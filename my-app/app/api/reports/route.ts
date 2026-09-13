import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateVoiceOfCustomerReport } from '@/lib/ai';
import { getWorkspaceContext, canIngestFeedback, unauthorizedResponse, forbiddenResponse } from '@/lib/rbac';
import { ReportGenerateSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  try {
    const context = await getWorkspaceContext(req);
    if (!context) {
      return unauthorizedResponse();
    }

    const reports = await prisma.report.findMany({
      where: {
        workspaceId: context.workspaceId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const parsedReports = reports.map((r) => {
      let content = null;
      try {
        content = JSON.parse(r.contentJson);
      } catch {
        content = { raw: r.contentJson };
      }
      return {
        id: r.id,
        title: r.title,
        periodStart: r.periodStart,
        periodEnd: r.periodEnd,
        createdAt: r.createdAt,
        content,
      };
    });

    return NextResponse.json({
      success: true,
      reports: parsedReports,
      totalReports: parsedReports.length,
      context: {
        workspaceName: context.workspaceName,
        userRole: context.userRole,
      },
    });
  } catch (error) {
    console.error('Error fetching VoC reports:', error);
    return NextResponse.json({ success: false, error: 'Failed to load reports' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await getWorkspaceContext(req);
    if (!context) {
      return unauthorizedResponse();
    }

    if (!canIngestFeedback(context.userRole)) {
      return forbiddenResponse('Only Admins and Analysts can generate executive reports.');
    }

    const rawBody = await req.json().catch(() => ({}));
    const parseResult = ReportGenerateSchema.safeParse(rawBody);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues.map((e: { message: string }) => e.message).join(', ');
      return NextResponse.json(
        { success: false, error: errorMessage, details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const period = parseResult.data.period || 'Last 30 Days';

    // Calculate timeframe filter
    const now = new Date();
    let fromDate: Date | null = null;
    if (period === '7d' || period.toLowerCase().includes('7')) {
      fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === '90d' || period.toLowerCase().includes('90') || period.toLowerCase().includes('quarter')) {
      fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else {
      fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const whereScope = {
      workspaceId: context.workspaceId,
      createdAt: { gte: fromDate },
    };

    // Aggregate feedback stats
    const totalCount = await prisma.feedback.count({ where: whereScope });
    const positiveCount = await prisma.feedback.count({ where: { ...whereScope, sentiment: 'Positive' } });
    const neutralCount = await prisma.feedback.count({ where: { ...whereScope, sentiment: 'Neutral' } });
    const negativeCount = await prisma.feedback.count({ where: { ...whereScope, sentiment: 'Negative' } });

    // Fetch top themes with counts
    const themes = await prisma.theme.findMany({
      where: { workspaceId: context.workspaceId },
      include: {
        feedbackThemes: {
          where: { feedback: { createdAt: { gte: fromDate } } },
        },
      },
    });

    const topThemes = themes
      .map((t) => ({
        name: t.name,
        count: t.feedbackThemes.length,
        sentiment: 'Active',
      }))
      .sort((a, b) => b.count - a.count);

    // Fetch sample notable quotes
    const sampleItems = await prisma.feedback.findMany({
      where: whereScope,
      take: 8,
      orderBy: { createdAt: 'desc' },
      select: {
        content: true,
        customerName: true,
        sentiment: true,
        category: true,
      },
    });

    const reportContent = await generateVoiceOfCustomerReport(
      period,
      {
        total: totalCount || 1,
        positive: positiveCount,
        neutral: neutralCount,
        negative: negativeCount,
      },
      topThemes,
      sampleItems.map((s) => ({
        content: s.content,
        customerName: s.customerName || undefined,
        sentiment: s.sentiment || 'Neutral',
        category: s.category || undefined,
      }))
    );

    const savedReport = await prisma.report.create({
      data: {
        title: reportContent.title,
        periodStart: fromDate,
        periodEnd: now,
        contentJson: JSON.stringify(reportContent),
        workspaceId: context.workspaceId,
        generatedBy: context.userId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        report: {
          id: savedReport.id,
          title: savedReport.title,
          createdAt: savedReport.createdAt,
          content: reportContent,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error generating VoC report:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate report' }, { status: 500 });
  }
}
