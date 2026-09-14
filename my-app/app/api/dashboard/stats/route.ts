import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Adjust path as per your project setup

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId") || "cmtbcxvci0000ex7dtm";

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