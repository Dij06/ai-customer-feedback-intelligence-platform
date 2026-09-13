import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWorkspaceContext, canIngestFeedback, unauthorizedResponse, forbiddenResponse } from '@/lib/rbac';
import { ThemeCreateSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  try {
    const context = await getWorkspaceContext(req);
    if (!context) {
      return unauthorizedResponse();
    }
    const { searchParams } = new URL(req.url);
    const themeId = searchParams.get('themeId');

    // 1. If single theme drill-down requested: return theme details + full feedback list
    if (themeId) {
      const theme = await prisma.theme.findFirst({
        where: {
          id: themeId,
          workspaceId: context.workspaceId,
        },
        include: {
          feedbackThemes: {
            include: {
              feedback: true,
            },
            orderBy: {
              feedback: {
                createdAt: 'desc',
              },
            },
          },
        },
      });

      if (!theme) {
        return NextResponse.json({ success: false, error: 'Theme not found in this workspace' }, { status: 404 });
      }

      const feedbackItems = theme.feedbackThemes.map((ft) => ({
        id: ft.feedback.id,
        content: ft.feedback.content,
        source: ft.feedback.source,
        sentiment: ft.feedback.sentiment,
        sentimentScore: ft.feedback.sentimentScore,
        category: ft.feedback.category,
        urgency: ft.feedback.urgency,
        status: ft.feedback.status,
        customerName: ft.feedback.customerName,
        customerEmail: ft.feedback.customerEmail,
        summary: ft.feedback.summary,
        confidence: ft.confidence,
        createdAt: ft.feedback.createdAt,
      }));

      return NextResponse.json({
        success: true,
        theme: {
          id: theme.id,
          name: theme.name,
          description: theme.description,
          color: theme.color,
          createdAt: theme.createdAt,
        },
        feedbacks: feedbackItems,
        totalFeedbacks: feedbackItems.length,
      });
    }

    // 2. Otherwise return all workspace themes with computed trend & spike metrics
    const themes = await prisma.theme.findMany({
      where: {
        workspaceId: context.workspaceId,
      },
      include: {
        feedbackThemes: {
          include: {
            feedback: {
              select: {
                id: true,
                sentiment: true,
                sentimentScore: true,
                createdAt: true,
                content: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const enrichedThemes = themes.map((theme) => {
      const items = theme.feedbackThemes.map((ft) => ft.feedback);
      const totalCount = items.length;

      const positiveCount = items.filter((f) => f.sentiment === 'Positive').length;
      const negativeCount = items.filter((f) => f.sentiment === 'Negative').length;
      const neutralCount = items.filter((f) => f.sentiment === 'Neutral').length;

      const posRatio = totalCount > 0 ? Math.round((positiveCount / totalCount) * 100) : 0;
      const negRatio = totalCount > 0 ? Math.round((negativeCount / totalCount) * 100) : 0;

      // Spike calculation (comparing last 7d vs prior 7-14d)
      const recentCount = items.filter((f) => new Date(f.createdAt) >= sevenDaysAgo).length;
      const priorCount = items.filter((f) => {
        const d = new Date(f.createdAt);
        return d >= fourteenDaysAgo && d < sevenDaysAgo;
      }).length;

      let spikePercentage = 0;
      let spikeStatus: 'surge' | 'growth' | 'stable' | 'declining' = 'stable';
      let spikeLabel = 'Stable';

      if (priorCount > 0) {
        spikePercentage = Math.round(((recentCount - priorCount) / priorCount) * 100);
        if (spikePercentage >= 35 && negRatio >= 50) {
          spikeStatus = 'surge';
          spikeLabel = `Surge Alert: +${spikePercentage}% complaints`;
        } else if (spikePercentage > 10) {
          spikeStatus = 'growth';
          spikeLabel = `+${spikePercentage}% volume growth`;
        } else if (spikePercentage < -10) {
          spikeStatus = 'declining';
          spikeLabel = `${spikePercentage}% volume reduction`;
        }
      } else if (recentCount > 3) {
        spikeStatus = 'growth';
        spikeLabel = `+${recentCount} new items this week`;
      }

      const sampleQuote = items[0]?.content || '';

      return {
        id: theme.id,
        name: theme.name,
        description: theme.description,
        color: theme.color,
        count: totalCount,
        recentCount,
        positiveCount,
        negativeCount,
        neutralCount,
        positiveRatio: posRatio,
        negativeRatio: negRatio,
        spikeStatus,
        spikeLabel,
        spikePercentage,
        sampleQuote: sampleQuote.length > 90 ? `${sampleQuote.slice(0, 87)}...` : sampleQuote,
        createdAt: theme.createdAt,
      };
    });

    // Sort by count descending
    enrichedThemes.sort((a, b) => b.count - a.count);

    return NextResponse.json({
      success: true,
      themes: enrichedThemes,
      totalThemes: enrichedThemes.length,
      context: {
        workspaceName: context.workspaceName,
        userRole: context.userRole,
      },
    });
  } catch (error) {
    console.error('Error fetching themes:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await getWorkspaceContext(req);
    if (!context) {
      return unauthorizedResponse();
    }

    if (!canIngestFeedback(context.userRole)) {
      return forbiddenResponse('Only Admins and Analysts can create new themes.');
    }

    const rawBody = await req.json().catch(() => ({}));
    const parseResult = ThemeCreateSchema.safeParse(rawBody);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues.map((e: { message: string }) => e.message).join(', ');
      return NextResponse.json(
        { success: false, error: errorMessage, details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { name, description, color } = parseResult.data;

    const existing = await prisma.theme.findFirst({
      where: {
        name: name.trim(),
        workspaceId: context.workspaceId,
      },
    });

    if (existing) {
      return NextResponse.json({ success: false, error: 'Theme with this name already exists in this workspace' }, { status: 400 });
    }

    const newTheme = await prisma.theme.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#3b82f6',
        workspaceId: context.workspaceId,
      },
    });

    return NextResponse.json({ success: true, theme: newTheme }, { status: 201 });
  } catch (error) {
    console.error('Error creating theme:', error);
    return NextResponse.json({ success: false, error: 'Failed to create theme' }, { status: 500 });
  }
}
