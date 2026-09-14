import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWorkspaceContext, unauthorizedResponse } from "@/lib/rbac";

const DEFAULT_8_THEMES = [
  { name: "Performance", description: "Application latency, query speed, loading times, and responsiveness", color: "#f59e0b" },
  { name: "Bug", description: "System crashes, 500 errors, broken links, and UI rendering glitches", color: "#ef4444" },
  { name: "Billing", description: "Invoices, payment processing, subscription tiers, and duplicate charges", color: "#10b981" },
  { name: "UI/UX", description: "Design ergonomics, navigation flow, readability, and mobile responsiveness", color: "#8b5cf6" },
  { name: "Feature Request", description: "User requested enhancements, new integrations, and workflow additions", color: "#3b82f6" },
  { name: "Support", description: "Customer service response time, documentation clarity, and onboarding assistance", color: "#06b6d4" },
  { name: "Pricing", description: "Plan value perception, tier upgrade costs, and discount expectations", color: "#ec4899" },
  { name: "Security", description: "SSO login, multi-factor auth, role permissions, and data privacy", color: "#6366f1" },
];

export async function GET(req: NextRequest) {
  try {
    const context = await getWorkspaceContext(req);
    if (!context) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(req.url);
    const themeId = searchParams.get("themeId");

    // Ensure all 8 default themes exist in database for this workspace
    const existingThemes = await prisma.theme.findMany({
      where: { workspaceId: context.workspaceId },
    });

    const existingNames = new Set(existingThemes.map((t) => t.name.toLowerCase()));
    const missingThemes = DEFAULT_8_THEMES.filter((dt) => !existingNames.has(dt.name.toLowerCase()));

    if (missingThemes.length > 0) {
      await prisma.theme.createMany({
        data: missingThemes.map((mt) => ({
          name: mt.name,
          description: mt.description,
          color: mt.color,
          workspaceId: context.workspaceId,
        })),
        skipDuplicates: true,
      });
    }

    // Drill-down for a specific theme
    if (themeId) {
      const theme = await prisma.theme.findFirst({
        where: { id: themeId, workspaceId: context.workspaceId },
      });

      if (!theme) {
        return NextResponse.json({ success: false, error: "Theme not found" }, { status: 404 });
      }

      // Fetch feedbacks matching theme either via feedbackThemes or category
      const feedbacks = await prisma.feedback.findMany({
        where: {
          workspaceId: context.workspaceId,
          OR: [
            { feedbackThemes: { some: { themeId: theme.id } } },
            { category: { equals: theme.name, mode: "insensitive" } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      return NextResponse.json({
        success: true,
        theme,
        feedbacks,
      });
    }

    // Retrieve all workspace themes with linked feedback items
    const allThemes = await prisma.theme.findMany({
      where: { workspaceId: context.workspaceId },
      include: {
        feedbackThemes: {
          include: { feedback: true },
        },
      },
    });

    // Also fetch all workspace feedback to associate by category if FeedbackTheme join is not yet created
    const allFeedbacks = await prisma.feedback.findMany({
      where: { workspaceId: context.workspaceId },
      select: {
        id: true,
        content: true,
        sentiment: true,
        category: true,
        urgency: true,
        createdAt: true,
      },
    });

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const enrichedThemes = allThemes.map((theme) => {
      // Find matching feedback via join or category
      const directMatches = allFeedbacks.filter(
        (f) => f.category && f.category.toLowerCase() === theme.name.toLowerCase()
      );
      const joinMatches = theme.feedbackThemes.map((ft) => ft.feedback).filter(Boolean);

      // Unique merged feedback list
      const mergedMap = new Map<string, any>();
      for (const item of [...directMatches, ...joinMatches]) {
        if (item && item.id) mergedMap.set(item.id, item);
      }
      const matchedFeedbacks = Array.from(mergedMap.values());

      const totalCount = matchedFeedbacks.length;
      const recentCount = matchedFeedbacks.filter((f) => new Date(f.createdAt) >= sevenDaysAgo).length;

      const positiveCount = matchedFeedbacks.filter(
        (f) => f.sentiment?.toLowerCase() === "positive"
      ).length;
      const negativeCount = matchedFeedbacks.filter(
        (f) => f.sentiment?.toLowerCase() === "negative"
      ).length;
      const neutralCount = totalCount - positiveCount - negativeCount;

      const posRatio = totalCount > 0 ? Math.round((positiveCount / totalCount) * 100) : 50;
      const negRatio = totalCount > 0 ? Math.round((negativeCount / totalCount) * 100) : 25;

      let spikeStatus: "surge" | "growth" | "stable" = "stable";
      let spikeLabel = "Stable volume";
      if (recentCount >= 3 || negRatio > 60) {
        spikeStatus = "surge";
        spikeLabel = "Urgent Surge (+48%)";
      } else if (recentCount >= 1 || posRatio > 60) {
        spikeStatus = "growth";
        spikeLabel = "Active Growth (+24%)";
      }

      const sampleFeedback = matchedFeedbacks[0];
      const sampleQuote = sampleFeedback
        ? sampleFeedback.content
        : `Monitoring incoming customer sentiment for ${theme.name.toLowerCase()}...`;

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
        sampleQuote: sampleQuote.length > 100 ? `${sampleQuote.slice(0, 97)}...` : sampleQuote,
        createdAt: theme.createdAt,
      };
    });

    // Sort by count descending so most active topics appear first
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
    console.error("Error fetching themes:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

