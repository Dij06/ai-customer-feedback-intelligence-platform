import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateFullSeedDataset, DEMO_USERS } from '@/lib/seed-data';
import { getWorkspaceContext, canIngestFeedback, unauthorizedResponse, forbiddenResponse } from '@/lib/rbac';
import { generateEmbedding } from '@/lib/embeddings';

export async function POST(req: NextRequest) {
  try {
    const context = await getWorkspaceContext(req);
    if (!context) {
      return unauthorizedResponse('Please sign in to seed feedback data.');
    }

    if (!canIngestFeedback(context.userRole)) {
      return forbiddenResponse('Only Admins and Analysts are permitted to seed feedback data.');
    }

    // Ensure target active workspace exists
    const activeWorkspace = await prisma.workspace.findUnique({
      where: { id: context.workspaceId },
    });

    if (!activeWorkspace) {
      return NextResponse.json({ success: false, error: 'Workspace not found' }, { status: 404 });
    }

    const betaWorkspace = await prisma.workspace.upsert({
      where: { slug: 'beta-labs' },
      update: { name: 'Beta Labs' },
      create: {
        name: 'Beta Labs',
        slug: 'beta-labs',
      },
    });

    // Add demo users and workspace memberships
    await prisma.user.upsert({
      where: { email: 'admin@acme.com' },
      update: { name: 'Admin User', role: 'ADMIN' },
      create: {
        email: 'admin@acme.com',
        name: 'Admin User',
        role: 'ADMIN',
        clerkUserId: 'demo-admin-acme',
      },
    });

    for (const u of DEMO_USERS) {
      const user = await prisma.user.upsert({
        where: { email: u.email },
        update: { name: u.name, role: u.role },
        create: {
          email: u.email,
          name: u.name,
          role: u.role,
          clerkUserId: u.clerkUserId,
        },
      });

      await prisma.workspaceMember.upsert({
        where: {
          userId_workspaceId: {
            userId: user.id,
            workspaceId: activeWorkspace.id,
          },
        },
        update: { role: u.role },
        create: {
          userId: user.id,
          workspaceId: activeWorkspace.id,
          role: u.role,
        },
      });
    }

    // Populate feedback for the active workspace
    await prisma.feedback.deleteMany({
      where: { workspaceId: activeWorkspace.id },
    });

    const rawDataset = generateFullSeedDataset();
    const now = Date.now();

    const feedbackData = rawDataset.map((item) => {
      const createdDate = new Date(now - item.daysAgo * 24 * 60 * 60 * 1000);
      return {
        content: item.content,
        source: item.source,
        sentiment: item.sentiment,
        sentimentScore: item.sentimentScore,
        category: item.category,
        urgency: item.urgency,
        status: item.status,
        customerName: item.customerName,
        customerEmail: item.customerEmail,
        summary: item.summary,
        tags: item.tags,
        createdAt: createdDate,
        workspaceId: activeWorkspace.id,
        userId: context.userId,
      };
    });

    await prisma.feedback.createMany({
      data: feedbackData,
    });

    // Vectorize all newly created feedback records for semantic search
    const createdFeedbacks = await prisma.feedback.findMany({
      where: { workspaceId: activeWorkspace.id },
      select: { id: true, content: true },
    });

    for (const item of createdFeedbacks) {
      const vector = await generateEmbedding(item.content);
      await prisma.embedding.upsert({
        where: { feedbackId: item.id },
        update: { vector: JSON.stringify(vector) },
        create: {
          feedbackId: item.id,
          vector: JSON.stringify(vector),
        },
      });
    }

    // Beta Labs feedback (tenant isolation demo)
    await prisma.feedback.deleteMany({
      where: { workspaceId: betaWorkspace.id },
    });

    await prisma.feedback.createMany({
      data: [
        {
          content: 'Beta Labs test feedback: Really loving the new dashboard analytics and speed improvements.',
          source: 'Email',
          sentiment: 'Positive',
          sentimentScore: 0.85,
          category: 'Performance',
          urgency: 'Low',
          status: 'NEW',
          customerName: 'Beta Client',
          customerEmail: 'client@betalabs.internal',
          summary: 'Positive feedback on dashboard speed.',
          tags: ['beta-labs', 'tenant-test'],
          workspaceId: betaWorkspace.id,
        },
      ],
    });

    const betaFeedbacks = await prisma.feedback.findMany({
      where: { workspaceId: betaWorkspace.id },
      select: { id: true, content: true },
    });
    for (const b of betaFeedbacks) {
      const v = await generateEmbedding(b.content);
      await prisma.embedding.upsert({
        where: { feedbackId: b.id },
        update: { vector: JSON.stringify(v) },
        create: { feedbackId: b.id, vector: JSON.stringify(v) },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${feedbackData.length} items in ${activeWorkspace.name} & Beta Labs`,
      count: feedbackData.length,
      workspace: activeWorkspace.name,
    });
  } catch (error: unknown) {
    console.error('Error seeding data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed sample feedback data' },
      { status: 500 }
    );
  }
}
