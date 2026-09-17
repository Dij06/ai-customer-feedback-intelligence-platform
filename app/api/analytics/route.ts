import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWorkspaceContext } from '@/lib/rbac';

export async function GET(request: Request) {
  try {
    const context = await getWorkspaceContext(request);
    let workspaceId = context?.workspaceId;

    if (!workspaceId) {
      const { searchParams } = new URL(request.url);
      const paramWorkspaceId = searchParams.get('workspaceId');
      if (paramWorkspaceId && paramWorkspaceId !== 'undefined') {
        workspaceId = paramWorkspaceId;
      }
    }

    if (!workspaceId) {
      return NextResponse.json({
        totalCount: 0,
        sentimentData: [],
        channelData: [],
      });
    }

    const whereClause = { workspaceId };

    // 1. Sentiment Count Aggregation
    const sentiments = await prisma.feedback.groupBy({
      by: ['sentiment'],
      where: whereClause,
      _count: {
        id: true,
      },
    });

    // 2. Channel/Source Distribution
    const channels = await prisma.feedback.groupBy({
      by: ['source'],
      where: whereClause,
      _count: {
        id: true,
      },
    });

    // 3. Total Feedbacks Count
    const totalCount = await prisma.feedback.count({
      where: whereClause,
    });

    // Formatting for Recharts
    const sentimentData = sentiments.map((item) => ({
      name: item.sentiment || 'NEUTRAL',
      value: item._count.id,
    }));

    const channelData = channels.map((item) => ({
      name: item.source || 'Direct',
      count: item._count.id,
    }));

    return NextResponse.json({
      totalCount,
      sentimentData,
      channelData,
    });
  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}