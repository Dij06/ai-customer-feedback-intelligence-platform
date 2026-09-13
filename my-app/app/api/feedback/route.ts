import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeFeedbackWithLLM } from '@/lib/ai';
import { generateEmbedding } from '@/lib/embeddings';
import {
  getWorkspaceContext,
  canIngestFeedback,
  canTriageFeedback,
  canDeleteFeedback,
  unauthorizedResponse,
  forbiddenResponse,
} from '@/lib/rbac';
import { FeedbackCreateSchema, FeedbackUpdateSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  try {
    const context = await getWorkspaceContext(req);
    if (!context) {
      return unauthorizedResponse();
    }
    const { searchParams } = new URL(req.url);

    const sentiment = searchParams.get('sentiment');
    const category = searchParams.get('category');
    const source = searchParams.get('source');
    const status = searchParams.get('status');
    const themeId = searchParams.get('themeId') || searchParams.get('theme');
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
    if (themeId && themeId !== 'ALL') {
      whereClause.feedbackThemes = {
        some: {
          themeId: themeId,
        },
      };
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
      include: {
        feedbackThemes: {
          include: {
            theme: true,
          },
        },
      },
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
    if (!context) {
      return unauthorizedResponse();
    }

    if (!canIngestFeedback(context.userRole)) {
      return forbiddenResponse('Viewers cannot add feedback. Please ask an Admin or Analyst.');
    }

    const rawBody = await req.json().catch(() => ({}));
    const parseResult = FeedbackCreateSchema.safeParse(rawBody);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues.map((e: { message: string }) => e.message).join(', ');
      return NextResponse.json(
        { success: false, error: errorMessage, details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { content, source, customerName, customerEmail } = parseResult.data;

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
        userId: context.userId,
      },
    });

    try {
      const workspaceThemes = await prisma.theme.findMany({
        where: { workspaceId: context.workspaceId },
      });

      const textLower = content.toLowerCase();
      for (const theme of workspaceThemes) {
        const themeKeywords = theme.name.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
        const hasKeywordMatch = themeKeywords.some((kw) => textLower.includes(kw));
        const hasCategoryMatch = aiAnalysis.category.toLowerCase().includes(theme.name.toLowerCase()) || theme.name.toLowerCase().includes(aiAnalysis.category.toLowerCase());
        const isSuggested = aiAnalysis.suggestedThemes?.some((st) => st.toLowerCase() === theme.name.toLowerCase());

        if (hasKeywordMatch || hasCategoryMatch || isSuggested) {
          await prisma.feedbackTheme.upsert({
            where: {
              feedbackId_themeId: {
                feedbackId: feedback.id,
                themeId: theme.id,
              },
            },
            update: {},
            create: {
              feedbackId: feedback.id,
              themeId: theme.id,
              confidence: hasKeywordMatch && hasCategoryMatch ? 0.95 : 0.8,
            },
          });
        }
      }

      // Guarantee at least one theme assignment for the feedback item
      const assignedCount = await prisma.feedbackTheme.count({
        where: { feedbackId: feedback.id },
      });

      if (assignedCount === 0) {
        const targetThemeName = aiAnalysis.category || 'General';
        const categoryTheme = await prisma.theme.upsert({
          where: {
            name_workspaceId: {
              name: targetThemeName,
              workspaceId: context.workspaceId,
            },
          },
          update: {},
          create: {
            name: targetThemeName,
            description: `Auto-assigned theme for ${targetThemeName} feedback`,
            color: targetThemeName === 'Bug' ? '#ef4444' : targetThemeName === 'Performance' ? '#f59e0b' : targetThemeName === 'Billing' ? '#10b981' : '#3b82f6',
            workspaceId: context.workspaceId,
          },
        });

        await prisma.feedbackTheme.upsert({
          where: {
            feedbackId_themeId: {
              feedbackId: feedback.id,
              themeId: categoryTheme.id,
            },
          },
          update: {},
          create: {
            feedbackId: feedback.id,
            themeId: categoryTheme.id,
            confidence: 0.9,
          },
        });
      }

      // Generate dense semantic vector embedding for semantic search in Ask LOOP
      const vector = await generateEmbedding(content);
      await prisma.embedding.upsert({
        where: { feedbackId: feedback.id },
        update: { vector: JSON.stringify(vector) },
        create: {
          feedbackId: feedback.id,
          vector: JSON.stringify(vector),
        },
      });
    } catch (relationErr) {
      console.warn('Error linking theme/embedding:', relationErr);
    }

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
    if (!context) {
      return unauthorizedResponse();
    }

    if (!canTriageFeedback(context.userRole)) {
      return forbiddenResponse('Viewers cannot update feedback status.');
    }

    const rawBody = await req.json().catch(() => ({}));
    const parseResult = FeedbackUpdateSchema.safeParse(rawBody);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues.map((e: { message: string }) => e.message).join(', ');
      return NextResponse.json(
        { success: false, error: errorMessage, details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { id, status, category, urgency } = parseResult.data;

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
    if (!context) {
      return unauthorizedResponse();
    }

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
