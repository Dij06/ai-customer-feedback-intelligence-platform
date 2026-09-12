import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { askLoopGroundedQA } from '@/lib/ai';
import { getWorkspaceContext } from '@/lib/rbac';

export async function POST(req: NextRequest) {
  try {
    const context = await getWorkspaceContext(req);
    const body = await req.json();
    const { question } = body;

    if (!question || question.trim() === '') {
      return NextResponse.json({ success: false, error: 'Question is required' }, { status: 400 });
    }

    // Retrieve feedback for the current workspace (scoped strictly for tenant isolation)
    const feedbackCorpus = await prisma.feedback.findMany({
      where: {
        workspaceId: context.workspaceId,
      },
      select: {
        id: true,
        content: true,
        source: true,
        sentiment: true,
        sentimentScore: true,
        category: true,
        urgency: true,
        customerName: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 200,
    });

    if (feedbackCorpus.length === 0) {
      return NextResponse.json({
        success: true,
        answer: 'There is currently no feedback recorded in this workspace. Please ingest feedback or run the seed script to enable grounded Q&A.',
        confidence: 0,
        citedItems: [],
        suggestedFollowUps: ['How do I ingest feedback?', 'What data channels are supported?'],
        provider: 'LOOP System',
      });
    }

    // Call grounded RAG engine
    const result = await askLoopGroundedQA(question.trim(), feedbackCorpus);

    return NextResponse.json({
      success: true,
      answer: result.answer,
      confidence: result.confidence,
      citedItems: result.citedItems,
      suggestedFollowUps: result.suggestedFollowUps,
      provider: result.provider,
      totalFeedbackQueried: feedbackCorpus.length,
      workspaceName: context.workspaceName,
    });
  } catch (error) {
    console.error('Error handling Ask LOOP Q&A:', error);
    return NextResponse.json({ success: false, error: 'Internal server error while processing query' }, { status: 500 });
  }
}
