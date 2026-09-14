import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeFeedbackWithLLM } from '@/lib/ai';
import { getWorkspaceContext, canTriageFeedback, unauthorizedResponse, forbiddenResponse } from '@/lib/rbac';
import { FeedbackReclassifySchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  try {
    const context = await getWorkspaceContext(req);
    if (!context) {
      return unauthorizedResponse();
    }

    // RBAC Check: Viewers cannot reclassify
    if (!canTriageFeedback(context.userRole)) {
      return forbiddenResponse('Viewer role is read-only. Reclassifying feedback is restricted to Admins and Analysts.');
    }

    const rawBody = await req.json().catch(() => ({}));
    const parseResult = FeedbackReclassifySchema.safeParse(rawBody);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues.map((e: { message: string }) => e.message).join(', ');
      return NextResponse.json(
        { success: false, error: errorMessage, details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { id } = parseResult.data;

    const existingFeedback = await prisma.feedback.findFirst({
      where: { id, workspaceId: context.workspaceId },
    });

    if (!existingFeedback) {
      return NextResponse.json(
        { success: false, error: 'Feedback record not found in this workspace' },
        { status: 404 }
      );
    }

    // Re-run AI analysis using live cloud AI
    const aiAnalysis = await analyzeFeedbackWithLLM(existingFeedback.content);

    const updated = await prisma.feedback.update({
      where: { id },
      data: {
        sentiment: aiAnalysis.sentiment,
        sentimentScore: aiAnalysis.sentimentScore,
        category: aiAnalysis.category,
        urgency: aiAnalysis.urgency,
        summary: aiAnalysis.summary,
        tags: aiAnalysis.tags,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Feedback re-classified successfully',
      feedback: updated,
      aiAnalysis,
    });
  } catch (error: unknown) {
    console.error('Error re-classifying feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to re-classify feedback' },
      { status: 500 }
    );
  }
}
