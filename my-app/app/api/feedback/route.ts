import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeFeedbackWithAI, analyzeFeedbackWithLLM } from '@/lib/ai';
import {
  getWorkspaceContext,
  canIngestFeedback,
  canTriageFeedback,
  canDeleteFeedback,
  forbiddenResponse,
} from '@/lib/rbac';

export async function GET(req: NextRequest) {
  try {
    const context = await getWorkspaceContext(req);
    const { searchParams } = new URL(req.url);

    const sentiment = searchParams.get('sentiment');
    const category = searchParams.get('category');
    const source = searchParams.get('source');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const dateRange = searchParams.get('dateRange'); // '7d', '30d', '90d', 'all'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10', 10)));

    // Filter by active workspace
    const whereClause: Record<string, unknown> = {
      workspaceId: context.workspaceId,
    };

    if (sentiment && sentiment !== 'ALL') {
      whereClause.sentiment = sentiment;
    }
    if (category && category !== 'ALL') {
      whereClause.category = category;
    }
    if (source && source !== 'ALL') {
      whereClause.source = source;
    }
    if (status && status !== 'ALL') {
      whereClause.status = status;
    }
    if (search && search.trim() !== '') {
      whereClause.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (dateRange && dateRange !== 'ALL') {
      const now = new Date();
      let fromDate: Date | null = null;
      if (dateRange === '7d') {
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (dateRange === '30d') {
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (dateRange === '90d') {
        fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      }
      if (fromDate) {
        whereClause.createdAt = { gte: fromDate };
      }
    }

    // Pagination
    const totalFiltered = await prisma.feedback.count({ where: whereClause });
    const feedbacks = await prisma.feedback.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate stats for current workspace
    const workspaceScope = { workspaceId: context.workspaceId };
    const totalCount = await prisma.feedback.count({ where: workspaceScope });
    const positiveCount = await prisma.feedback.count({ where: { ...workspaceScope, sentiment: 'Positive' } });
    const neutralCount = await prisma.feedback.count({ where: { ...workspaceScope, sentiment: 'Neutral' } });
    const negativeCount = await prisma.feedback.count({ where: { ...workspaceScope, sentiment: 'Negative' } });
    const highUrgencyCount = await prisma.feedback.count({ where: { ...workspaceScope, urgency: 'High', status: { not: 'ACTIONED' } } });

    return NextResponse.json({
      success: true,
      feedbacks,
      feedback: feedbacks,
      context: {
        workspaceId: context.workspaceId,
        workspaceName: context.workspaceName,
        workspaceSlug: context.workspaceSlug,
        userRole: context.userRole,
        userName: context.userName,
        userEmail: context.userEmail,
      },
      pagination: {
        page,
        limit,
        total: totalFiltered,
        totalPages: Math.ceil(totalFiltered / limit) || 1,
      },
      stats: {
        total: totalCount,
        positive: positiveCount,
        neutral: neutralCount,
        negative: negativeCount,
        highUrgency: highUrgencyCount,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching feedbacks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feedback records' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await getWorkspaceContext(req);

    // Check if user has permission to add feedback
    if (!canIngestFeedback(context.userRole)) {
      return forbiddenResponse('Viewer role is read-only. Ingestion is restricted to Admins and Analysts.');
    }

    const body = await req.json();
    const { content, source = 'Web Form', customerName, customerEmail } = body;

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Feedback content cannot be empty' },
        { status: 400 }
      );
    }

    // Run sentiment and category analysis
    const aiAnalysis = await analyzeFeedbackWithLLM(content);

    const feedback = await prisma.feedback.create({
      data: {
        content: content.trim(),
        source: source || 'Web Form',
        sentiment: aiAnalysis.sentiment,
        sentimentScore: aiAnalysis.sentimentScore,
        category: aiAnalysis.category,
        urgency: aiAnalysis.urgency,
        summary: aiAnalysis.summary,
        tags: aiAnalysis.tags,
        status: 'NEW',
        customerName: customerName || null,
        customerEmail: customerEmail || null,
        workspaceId: context.workspaceId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        feedback,
        aiAnalysis,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error creating feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process feedback' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const context = await getWorkspaceContext(req);

    // Check if user can update feedback
    if (!canTriageFeedback(context.userRole)) {
      return forbiddenResponse('Viewer role is read-only. Updating triage status is restricted to Admins and Analysts.');
    }

    const body = await req.json();
    const { id, status, category, urgency } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Feedback ID is required' },
        { status: 400 }
      );
    }

    // Verify item belongs to workspace
    const existing = await prisma.feedback.findFirst({
      where: { id, workspaceId: context.workspaceId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Feedback item not found in this workspace' },
        { status: 404 }
      );
    }

    const updated = await prisma.feedback.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(category ? { category } : {}),
        ...(urgency ? { urgency } : {}),
      },
    });

    return NextResponse.json({ success: true, feedback: updated });
  } catch (error: unknown) {
    console.error('Error updating feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update feedback' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const context = await getWorkspaceContext(req);

    // Only admins can delete feedback
    if (!canDeleteFeedback(context.userRole)) {
      return forbiddenResponse('Only Admins are permitted to delete feedback items.');
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Feedback ID is required' },
        { status: 400 }
      );
    }

    // Verify item belongs to workspace
    const existing = await prisma.feedback.findFirst({
      where: { id, workspaceId: context.workspaceId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Feedback item not found in this workspace' },
        { status: 404 }
      );
    }

    await prisma.feedback.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Feedback deleted successfully' });
  } catch (error: unknown) {
    console.error('Error deleting feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete feedback' },
      { status: 500 }
    );
  }
}
