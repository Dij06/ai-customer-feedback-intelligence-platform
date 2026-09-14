import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateFullSeedDataset } from "@/lib/seed-data";
import { getWorkspaceContext, unauthorizedResponse } from "@/lib/rbac";
import { generateEmbedding } from "@/lib/embeddings";

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

    // Ensure all 8 default themes exist in active workspace
    for (const td of THEME_DEFINITIONS) {
      await prisma.theme.upsert({
        where: {
          name_workspaceId: {
            name: td.name,
            workspaceId: activeWorkspace.id,
          },
        },
        update: { description: td.description, color: td.color },
        create: {
          name: td.name,
          description: td.description,
          color: td.color,
          workspaceId: activeWorkspace.id,
        },
      });
    }

    const themes = await prisma.theme.findMany({
      where: { workspaceId: activeWorkspace.id },
    });
    const themeMap = new Map<string, string>(themes.map((t) => [t.name.toLowerCase(), t.id]));

    // Generate comprehensive seed dataset
    const rawDataset = generateFullSeedDataset();
    const now = Date.now();

    // Remove existing seed feedback to avoid infinite duplicate bloat
    await prisma.feedback.deleteMany({
      where: { workspaceId: activeWorkspace.id },
    });

    for (const item of rawDataset) {
      const createdDate = new Date(now - item.daysAgo * 24 * 60 * 60 * 1000);

      const feedback = await prisma.feedback.create({
        data: {
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
        },
      });

      // Link to matching theme if exists
      const targetThemeId = item.category ? themeMap.get(item.category.toLowerCase()) : null;
      if (targetThemeId) {
        await prisma.feedbackTheme.upsert({
          where: {
            feedbackId_themeId: {
              feedbackId: feedback.id,
              themeId: targetThemeId,
            },
          },
          update: { confidence: 0.95 },
          create: {
            feedbackId: feedback.id,
            themeId: targetThemeId,
            confidence: 0.95,
          },
        });
      }

      // Generate embedding vector
      const vector = await generateEmbedding(item.content);
      await prisma.embedding.upsert({
        where: { feedbackId: feedback.id },
        update: { vector: JSON.stringify(vector) },
        create: {
          feedbackId: feedback.id,
          vector: JSON.stringify(vector),
        },
      });
    }

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

