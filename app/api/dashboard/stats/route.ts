import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWorkspaceContext } from "@/lib/rbac";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let workspaceId = searchParams.get("workspaceId");

    if (!workspaceId || workspaceId === "undefined") {
      const context = await getWorkspaceContext(req);
      if (context) {
        workspaceId = context.workspaceId;
      }
    }

    if (!workspaceId) {
      return NextResponse.json({
        totalFeedbacks: 0,
        sentimentStats: [
          { name: "Positive", value: 0, fill: "#10B981" },
          { name: "Neutral", value: 0, fill: "#64748B" },
          { name: "Negative", value: 0, fill: "#EF4444" },
        ],
        urgencyStats: [
          { name: "Urgent ⚠️", count: 0, fill: "#F59E0B" },
          { name: "Normal", count: 0, fill: "#3B82F6" },
        ],
      });
    }

    const totalFeedbacks = await prisma.feedback.count({
      where: { workspaceId },
    });

    const positiveCount = await prisma.feedback.count({
      where: { workspaceId, sentiment: "POSITIVE" },
    });

    const neutralCount = await prisma.feedback.count({
      where: { workspaceId, sentiment: "NEUTRAL" },
    });

    const negativeCount = await prisma.feedback.count({
      where: { workspaceId, sentiment: "NEGATIVE" },
    });

    const urgentCount = await prisma.feedback.count({
      where: { workspaceId, urgency: "High" },
    });

    return NextResponse.json({
      totalFeedbacks,
      sentimentStats: [
        { name: "Positive", value: positiveCount, fill: "#10B981" },
        { name: "Neutral", value: neutralCount, fill: "#64748B" },
        { name: "Negative", value: negativeCount, fill: "#EF4444" },
      ],
      urgencyStats: [
        { name: "Urgent ⚠️", count: urgentCount, fill: "#F59E0B" },
        { name: "Normal", count: totalFeedbacks - urgentCount, fill: "#3B82F6" },
      ],
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}