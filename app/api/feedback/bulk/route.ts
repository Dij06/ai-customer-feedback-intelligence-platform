import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getWorkspaceContext } from "@/lib/rbac";
import Groq from "groq-sdk";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const { feedbacks, workspaceId } = await req.json();

    if (!Array.isArray(feedbacks) || feedbacks.length === 0) {
      return NextResponse.json(
        { error: "Valid feedback items array is required" },
        { status: 400 }
      );
    }

    // Find or create database user for Clerk user
    let dbUser = await prisma.user.findFirst({
      where: {
        OR: [{ id: userId }, { clerkUserId: userId }],
      },
    });

    if (!dbUser) {
      const email = user.emailAddresses[0]?.emailAddress || `${userId}@example.com`;
      const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";
      dbUser = await prisma.user.create({
        data: {
          clerkUserId: userId,
          email,
          name,
        },
      });
    }

    // Resolve workspace context
    const context = await getWorkspaceContext(req);
    let activeWorkspaceId = workspaceId;

    if (!activeWorkspaceId || activeWorkspaceId === "undefined") {
      if (context?.workspaceId) {
        activeWorkspaceId = context.workspaceId;
      } else {
        const dbWorkspace = await prisma.workspace.findFirst();
        activeWorkspaceId = dbWorkspace?.id;
      }
    }

    if (!activeWorkspaceId) {
      return NextResponse.json({ error: "No active workspace found for feedback import" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const groq = new Groq({ apiKey });

    // AI Processing via Groq
    const analyzedFeedbacks = await Promise.all(
      feedbacks.map(async (text: string) => {
        try {
          const completion = await groq.chat.completions.create({
            messages: [
              {
                role: "user",
                content: `Analyze this customer feedback and return ONLY a valid raw JSON object:
{
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "urgency": true,
  "category": "short category name"
}

Feedback: "${text}"`,
              },
            ],
            model: "llama-3.1-8b-instant",
            response_format: { type: "json_object" },
          });

          const resultText = completion.choices[0]?.message?.content || "{}";
          const aiData = JSON.parse(resultText);

          return {
            content: text,
            text: text,
            source: "CSV",
            userId: dbUser.id,
            sentiment: aiData.sentiment || "NEUTRAL",
            urgency: Boolean(aiData.urgency),
            category: aiData.category || "General",
            workspaceId: activeWorkspaceId,
          };
        } catch (err) {
          return {
            content: text,
            text: text,
            source: "CSV",
            userId: dbUser.id,
            sentiment: "NEUTRAL",
            urgency: false,
            category: "General",
            workspaceId: activeWorkspaceId,
          };
        }
      })
    );

    // Database save via Prisma
    const savedRecords = await (prisma as any).feedback.createMany({
      data: analyzedFeedbacks,
    });

    return NextResponse.json({
      success: true,
      count: savedRecords.count,
      data: analyzedFeedbacks,
    });
  } catch (error: any) {
    console.error("BULK_INGESTION_ERROR:", error);
    return NextResponse.json(
      { error: "Bulk Ingestion Failed", details: error?.message },
      { status: 500 }
    );
  }
}
