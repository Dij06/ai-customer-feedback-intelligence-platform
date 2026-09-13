import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { askLoopGroundedQA } from '@/lib/ai';
import { generateEmbedding, rankFeedbackByVectorSimilarity } from '@/lib/embeddings';
import { getWorkspaceContext, unauthorizedResponse } from '@/lib/rbac';
import { AskLoopQuerySchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  try {
    const context = await getWorkspaceContext(req);
    if (!context) {
      return unauthorizedResponse();
    }
    const rawBody = await req.json().catch(() => ({}));
    const parseResult = AskLoopQuerySchema.safeParse(rawBody);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues.map((e: { message: string }) => e.message).join(', ');
      return NextResponse.json(
        { success: false, error: errorMessage, details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { question } = parseResult.data;

    // 1. Retrieve all feedback records for the current workspace with embeddings
    const feedbackCorpus = await prisma.feedback.findMany({
      where: {
        workspaceId: context.workspaceId,
      },
      include: {
        embedding: true,
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

    // 2. Generate embedding vector for the user's question
    const queryVector = await generateEmbedding(question.trim());

    // 3. Ensure all feedback items have valid embeddings (on-the-fly backfill if missing)
    const itemsForRanking: Array<{
      item: (typeof feedbackCorpus)[number];
      vector: number[];
    }> = [];

    for (const item of feedbackCorpus) {
      let vector: number[] = [];
      if (item.embedding && item.embedding.vector) {
        try {
          const parsed = JSON.parse(item.embedding.vector);
          if (Array.isArray(parsed) && typeof parsed[0] === 'number') {
            vector = parsed;
          }
        } catch {
          // invalid or legacy format
        }
      }

      // If missing or legacy, compute embedding now and persist
      if (vector.length === 0) {
        vector = await generateEmbedding(item.content);
        try {
          await prisma.embedding.upsert({
            where: { feedbackId: item.id },
            update: { vector: JSON.stringify(vector) },
            create: { feedbackId: item.id, vector: JSON.stringify(vector) },
          });
        } catch (dbErr) {
          console.warn('Could not backfill embedding in DB:', dbErr);
        }
      }

      itemsForRanking.push({ item, vector });
    }

    // 4. Primary Retrieval: Vector similarity ranking via Cosine Similarity
    const ranked = rankFeedbackByVectorSimilarity(queryVector, itemsForRanking);

    // Filter top matches (top items with positive semantic similarity)
    const topSemanticMatches = ranked
      .filter((r) => r.similarity > 0.08)
      .slice(0, 6)
      .map((r) => r.item);

    // 5. Fallback: If vector similarity found no matches, fallback to keyword matching
    let relevantMatches = topSemanticMatches;
    if (relevantMatches.length === 0) {
      const cleanQ = question.toLowerCase();
      const terms = cleanQ.split(/\W+/).filter((w) => w.length > 2);
      const keywordScored = feedbackCorpus.map((item) => {
        const text = `${item.content} ${item.source} ${item.sentiment || ''} ${item.category || ''}`.toLowerCase();
        let score = 0;
        terms.forEach((t) => {
          if (text.includes(t)) score += 1;
        });
        return { item, score };
      });
      keywordScored.sort((a, b) => b.score - a.score);
      const topKeywordMatches = keywordScored.filter((k) => k.score > 0).slice(0, 5).map((k) => k.item);
      relevantMatches = topKeywordMatches.length > 0 ? topKeywordMatches : feedbackCorpus.slice(0, 4);
    }

    // 6. Pass only top semantic matching feedback items to Grok (with multi-provider fallback)
    const result = await askLoopGroundedQA(
      question.trim(),
      relevantMatches.map((f) => ({
        id: f.id,
        content: f.content,
        source: f.source,
        sentiment: f.sentiment,
        category: f.category,
        customerName: f.customerName,
        createdAt: f.createdAt,
      }))
    );

    return NextResponse.json({
      success: true,
      answer: result.answer,
      confidence: result.confidence,
      citedItems: result.citedItems,
      suggestedFollowUps: result.suggestedFollowUps,
      provider: result.provider,
      totalFeedbackQueried: feedbackCorpus.length,
      topMatchesCount: relevantMatches.length,
      workspaceName: context.workspaceName,
    });
  } catch (error) {
    console.error('Error handling Ask LOOP Q&A:', error);
    return NextResponse.json({ success: false, error: 'Internal server error while processing query' }, { status: 500 });
  }
}
