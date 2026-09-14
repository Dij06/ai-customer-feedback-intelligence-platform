import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Supported channels: "TWITTER", "EMAIL", "SUPPORT_TICKET", "WEBHOOK"
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { channel, content, sender, workspaceId } = body;

    if (!channel || !content || !workspaceId) {
      return NextResponse.json(
        { error: "Missing required fields: channel, content, or workspaceId" },
        { status: 400 }
      );
    }

    // Default system user for external multi-channel feeds
    let systemUser = await prisma.user.findFirst({
      where: { email: "system@ingestion.local" },
    });

    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          clerkUserId: "system_ingest_bot",
          email: "system@ingestion.local",
          name: "Channel Ingestion Bot",
        },
      });
    }

    const feedbackText = `[${channel.toUpperCase()}] ${sender ? `From: ${sender} - ` : ""}${content}`;
    const feedback = await prisma.feedback.create({
      data: {
        content: feedbackText,
        source: channel.toUpperCase(),
        sentiment: "NEUTRAL",
        category: "Channel Ingestion",
        urgency: "Low",
        workspaceId: workspaceId,
        userId: systemUser.id,
      },
    });

    return NextResponse.json({ success: true, feedback }, { status: 201 });
  } catch (err: any) {
    console.error("Multi-channel ingestion error:", err);
    return NextResponse.json(
      { error: "Failed to ingest channel feedback", details: err?.message },
      { status: 500 }
    );
  }
}