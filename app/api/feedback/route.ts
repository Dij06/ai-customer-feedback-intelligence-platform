import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getWorkspaceContext, unauthorizedResponse } from "@/lib/rbac";
import Groq from "groq-sdk";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let workspaceId = searchParams.get("workspaceId");

    // If workspaceId is not explicitly passed, resolve from authenticated session
    if (!workspaceId || workspaceId === "undefined") {
      const context = await getWorkspaceContext(req);
      if (context) {
        workspaceId = context.workspaceId;
      }
    }

    // Strict multi-tenant isolation: Never leak other workspaces' feedback!
    if (!workspaceId) {
      return NextResponse.json([]);
    }

    const where: any = { workspaceId };

    const search = searchParams.get("search");
    if (search && search.trim()) {
      where.OR = [
        { content: { contains: search.trim(), mode: "insensitive" } },
        { customerName: { contains: search.trim(), mode: "insensitive" } },
        { customerEmail: { contains: search.trim(), mode: "insensitive" } },
        { summary: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const sentiment = searchParams.get("sentiment");
    if (sentiment && sentiment !== "ALL") {
      where.sentiment = {
        equals: sentiment,
        mode: "insensitive",
      };
    }

    const urgency = searchParams.get("urgency");
    if (urgency && urgency !== "ALL") {
      where.urgency = {
        equals: urgency,
        mode: "insensitive",
      };
    }

    const status = searchParams.get("status");
    if (status && status !== "ALL") {
      where.status = status;
    }

    const category = searchParams.get("category");
    if (category && category !== "ALL") {
      where.category = {
        equals: category,
        mode: "insensitive",
      };
    }

    const limitParam = searchParams.get("limit");
    const take = limitParam ? parseInt(limitParam, 10) : undefined;

    const feedbacks = await prisma.feedback.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...(take && !isNaN(take) ? { take } : {}),
    });

    return NextResponse.json(feedbacks);
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to fetch feedbacks", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const context = await getWorkspaceContext(req);
    if (!context) {
      return unauthorizedResponse("Please sign in to delete feedback.");
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const clearAll = searchParams.get("clearAll") === "true";

    if (clearAll) {
      const workspaceFeedbacks = await prisma.feedback.findMany({
        where: { workspaceId: context.workspaceId },
        select: { id: true },
      });
      const feedbackIds = workspaceFeedbacks.map((f) => f.id);

      if (feedbackIds.length > 0) {
        await prisma.$transaction([
          prisma.feedbackTheme.deleteMany({ where: { feedbackId: { in: feedbackIds } } }),
          prisma.embedding.deleteMany({ where: { feedbackId: { in: feedbackIds } } }),
          prisma.feedback.deleteMany({ where: { id: { in: feedbackIds } } }),
        ]);
      }

      return NextResponse.json({
        success: true,
        message: `Cleared ${feedbackIds.length} feedback items from workspace.`,
        count: feedbackIds.length,
      });
    }

    if (!id) {
      return NextResponse.json({ error: "Missing feedback ID to delete" }, { status: 400 });
    }

    await prisma.feedback.delete({
      where: { id, workspaceId: context.workspaceId },
    });

    return NextResponse.json({ success: true, message: "Feedback deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete feedback" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      workspaceId,
      text: bodyText,
      source: bodySource,
      sentiment: bodySentiment,
      category: bodyCategory,
      urgency: bodyUrgency,
    } = body;

    const rawText =
      bodyText ||
      (title && description && title !== description
        ? `${title}: ${description}`
        : description || title);

    if (!rawText) {
      return NextResponse.json(
        { message: "Missing required feedback content" },
        { status: 400 }
      );
    }

    // Resolve active workspace and user from authenticated context
    let dbWorkspaceId = workspaceId;
    let dbUserId = null;

    const context = await getWorkspaceContext(req);
    if (context) {
      dbWorkspaceId = context.workspaceId;
      dbUserId = context.userId;
    } else if (workspaceId && workspaceId !== "undefined") {
      const ws = await prisma.workspace.findUnique({ where: { id: workspaceId } });
      if (ws) dbWorkspaceId = ws.id;
    }

    if (!dbWorkspaceId) {
      return NextResponse.json({ error: "No active workspace found for feedback submission" }, { status: 400 });
    }

    if (!dbUserId) {
      let fallbackUser = await prisma.user.findFirst();
      if (!fallbackUser) {
        fallbackUser = await prisma.user.create({
          data: {
            clerkUserId: "system_user",
            email: "system@feedback.local",
            name: "System User",
          },
        });
      }
      dbUserId = fallbackUser.id;
    }

    // Sentiment & AI analysis
    let sentiment = bodySentiment;
    let category = bodyCategory;
    let urgency = bodyUrgency;

    if (!sentiment || !category || urgency === undefined) {
      try {
        const apiKey = process.env.GROQ_API_KEY;
        if (apiKey) {
          const groq = new Groq({ apiKey });
          const completion = await groq.chat.completions.create({
            messages: [
              {
                role: "user",
                content: `Analyze this customer feedback and return ONLY a valid raw JSON object:
{
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "urgency": "High" | "Medium" | "Low",
  "category": "short category name"
}

Feedback: "${rawText}"`,
              },
            ],
            model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
            response_format: { type: "json_object" },
          });

          const resultText = completion.choices[0]?.message?.content || "{}";
          const aiData = JSON.parse(resultText);

          sentiment = sentiment || aiData.sentiment || "NEUTRAL";
          category = category || aiData.category || "General";
          urgency = urgency || aiData.urgency || "Medium";
        }
      } catch (err) {
        console.error("AI Analysis warning during feedback creation:", err);
      }
    }

    const mappedUrgency =
      typeof urgency === "string" && ["High", "Medium", "Low"].includes(urgency)
        ? urgency
        : urgency
        ? "High"
        : "Medium";

    const newFeedback = await prisma.feedback.create({
      data: {
        content: rawText,
        source: bodySource || "IN_APP",
        sentiment: sentiment || "NEUTRAL",
        category: category || "General",
        urgency: mappedUrgency,
        workspaceId: dbWorkspaceId,
        userId: dbUserId,
      },
    });

    return NextResponse.json(newFeedback, { status: 201 });
  } catch (error: any) {
    console.error("POST Error:", error);
    return NextResponse.json(
      { message: "Failed to create feedback", error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const context = await getWorkspaceContext(req);
    if (!context) {
      return unauthorizedResponse("Please sign in to update feedback.");
    }

    const { searchParams } = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const id = searchParams.get("id") || body.id;
    const status = body.status;
    const category = body.category;

    if (!id) {
      return NextResponse.json({ error: "Missing feedback ID" }, { status: 400 });
    }

    const feedback = await prisma.feedback.findFirst({
      where: { id, workspaceId: context.workspaceId },
    });

    if (!feedback) {
      return NextResponse.json({ error: "Feedback not found in workspace" }, { status: 404 });
    }

    const updateData: any = {};
    if (status && ["NEW", "REVIEWED", "ACTIONED"].includes(status)) {
      updateData.status = status;
    }
    if (category) {
      updateData.category = category;
    }

    const updated = await prisma.feedback.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, feedback: updated });
  } catch (error: any) {
    console.error("PATCH Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update feedback" },
      { status: 500 }
    );
  }
}


