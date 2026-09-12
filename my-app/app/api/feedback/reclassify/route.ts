import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeFeedbackWithLLM } from '@/lib/ai';
import { getWorkspaceContext, canTriageFeedback, forbiddenResponse } from '@/lib/rbac';

export async function POST(req: NextRequest) {
  try {
    const context = await getWorkspaceContext(req);

    // RBAC Check: Viewers cannot reclassify
    if (!canTriageFeedback(context.userRole)) {
      return forbiddenResponse('Viewer role is read-only. Reclassifying feedback is restricted to Admins and Analysts.');
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Feedback ID is required for re-classification' },
        { status: 400 }
      );
    }

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
