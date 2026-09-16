import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateFullSeedDataset } from "@/lib/seed-data";
import { getWorkspaceContext, unauthorizedResponse } from "@/lib/rbac";
import { generateLocalSemanticEmbedding } from "@/lib/embeddings";
import crypto from "crypto";

const THEME_DEFINITIONS = [
  { name: "Performance", description: "Application speed, loading times, and responsiveness", color: "#f59e0b" },
  { name: "Bug", description: "Software errors, crashes, and broken features", color: "#ef4444" },
  { name: "Billing", description: "Invoices, payments, subscriptions, and pricing", color: "#10b981" },
  { name: "UI/UX", description: "Design, navigation, ergonomics, and usability", color: "#8b5cf6" },
  { name: "Feature Request", description: "New feature suggestions and enhancements", color: "#3b82f6" },
  { name: "Support", description: "Customer support responsiveness and ticketing assistance", color: "#06b6d4" },
  { name: "Pricing", description: "Tier pricing, plan limits, and enterprise contract terms", color: "#ec4899" },
  { name: "Security", description: "SSO authentication, role-based access control, and privacy", color: "#6366f1" },
];

export async function POST(req: NextRequest) {
  try {
    const context = await getWorkspaceContext(req);
    if (!context) {
      return unauthorizedResponse("Please sign in to seed feedback data.");
    }

    const activeWorkspace = await prisma.workspace.findUnique({
      where: { id: context.workspaceId },
    });

    if (!activeWorkspace) {
      return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 });
    }

    // Ensure default themes exist in active workspace in a single batch check
    const existingThemes = await prisma.theme.findMany({
      where: { workspaceId: activeWorkspace.id },
    });
    const existingNames = new Set(existingThemes.map((t) => t.name.toLowerCase()));
    const missingThemes = THEME_DEFINITIONS.filter((td) => !existingNames.has(td.name.toLowerCase()));

    if (missingThemes.length > 0) {
      await prisma.theme.createMany({
        data: missingThemes.map((td) => ({
          name: td.name,
          description: td.description,
          color: td.color,
          workspaceId: activeWorkspace.id,
        })),
        skipDuplicates: true,
      });
    }

    const allThemes = await prisma.theme.findMany({
      where: { workspaceId: activeWorkspace.id },
    });
    const themeMap = new Map<string, string>(allThemes.map((t) => [t.name.toLowerCase(), t.id]));

    // Generate comprehensive seed dataset
    const rawDataset = generateFullSeedDataset();
    const now = Date.now();

    // Fast cleanup of existing feedback and relations for this workspace
    const existingFeedbacks = await prisma.feedback.findMany({
      where: { workspaceId: activeWorkspace.id },
      select: { id: true },
    });
    const existingIds = existingFeedbacks.map((f) => f.id);

    if (existingIds.length > 0) {
      await prisma.$transaction([
        prisma.feedbackTheme.deleteMany({ where: { feedbackId: { in: existingIds } } }),
        prisma.embedding.deleteMany({ where: { feedbackId: { in: existingIds } } }),
        prisma.feedback.deleteMany({ where: { id: { in: existingIds } } }),
      ]);
    }

    // Prepare batch arrays with precomputed UUIDs
    const feedbacksToInsert = [];
    const feedbackThemesToInsert = [];
    const embeddingsToInsert = [];

    for (const item of rawDataset) {
      const feedbackId = crypto.randomUUID();
      const createdDate = new Date(now - item.daysAgo * 24 * 60 * 60 * 1000);

      feedbacksToInsert.push({
        id: feedbackId,
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
      });

      const targetThemeId = item.category ? themeMap.get(item.category.toLowerCase()) : null;
      if (targetThemeId) {
        feedbackThemesToInsert.push({
          id: crypto.randomUUID(),
          feedbackId,
          themeId: targetThemeId,
          confidence: 0.95,
        });
      }

      const vector = generateLocalSemanticEmbedding(item.content);
      embeddingsToInsert.push({
        id: crypto.randomUUID(),
        feedbackId,
        vector: JSON.stringify(vector),
      });
    }

    // Execute batch inserts inside an atomic fast transaction
    await prisma.$transaction([
      prisma.feedback.createMany({ data: feedbacksToInsert }),
      prisma.feedbackTheme.createMany({ data: feedbackThemesToInsert, skipDuplicates: true }),
      prisma.embedding.createMany({ data: embeddingsToInsert, skipDuplicates: true }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${rawDataset.length} customer feedback items into ${activeWorkspace.name}!`,
      count: rawDataset.length,
      workspace: activeWorkspace.name,
    });
  } catch (error: unknown) {
    console.error("Error seeding data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to seed sample feedback data" },
      { status: 500 }
    );
  }
}

