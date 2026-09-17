import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWorkspaceContext } from "@/lib/rbac";

export async function GET(req: Request) {
  try {
    const context = await getWorkspaceContext(req);
    let workspaceId = context?.workspaceId;

    if (!workspaceId) {
      const { searchParams } = new URL(req.url);
      const paramWorkspaceId = searchParams.get("workspaceId");
      if (paramWorkspaceId && paramWorkspaceId !== "undefined") {
        workspaceId = paramWorkspaceId;
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
          { name: "High Urgency", count: 0, fill: "#F59E0B" },
          { name: "Normal", count: 0, fill: "#3B82F6" },
        ],
      });
    }

    const totalFeedbacks = await prisma.feedback.count({
      where: { workspaceId },
    });

    const positiveCount = await prisma.feedback.count({
      where: { workspaceId, sentiment: { equals: "POSITIVE", mode: "insensitive" } },
    });

    const neutralCount = await prisma.feedback.count({
      where: { workspaceId, sentiment: { equals: "NEUTRAL", mode: "insensitive" } },
    });

    const negativeCount = await prisma.feedback.count({
      where: { workspaceId, sentiment: { equals: "NEGATIVE", mode: "insensitive" } },
    });

    const urgentCount = await prisma.feedback.count({
      where: { workspaceId, urgency: { equals: "High", mode: "insensitive" } },
    });

    return NextResponse.json({
      totalFeedbacks,
      sentimentStats: [
        { name: "Positive", value: positiveCount, fill: "#10B981" },
        { name: "Neutral", value: neutralCount, fill: "#64748B" },
        { name: "Negative", value: negativeCount, fill: "#EF4444" },
      ],
      urgencyStats: [
        { name: "High Urgency", count: urgentCount, fill: "#F59E0B" },
        { name: "Normal", count: totalFeedbacks - urgentCount, fill: "#3B82F6" },
      ],
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}