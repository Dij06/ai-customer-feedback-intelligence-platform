import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Groq from "groq-sdk";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    let whereClause = {};
    if (workspaceId && workspaceId !== "undefined") {
      whereClause = { workspaceId };
    }

    const feedbacks = await prisma.feedback.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(feedbacks);
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to fetch feedbacks", error: error.message },
      { status: 500 }
    );
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

    // Verify workspace exists in DB or fallback to default workspace
    let dbWorkspace = null;
    if (workspaceId && workspaceId !== "undefined") {
      dbWorkspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      });
    }

    if (!dbWorkspace) {
      dbWorkspace = await prisma.workspace.findFirst();
      if (!dbWorkspace) {
        dbWorkspace = await prisma.workspace.create({
          data: {
            name: "Acme Corp Workspace",
            slug: "acme-corp",
          },
        });
      }
    }

    // Attempt to identify current authenticated user via Clerk
    let dbUser = null;
    try {
      const { userId } = await auth();
      if (userId) {
        dbUser = await prisma.user.findFirst({
          where: {
            OR: [{ id: userId }, { clerkUserId: userId }],
          },
        });

        if (!dbUser) {
          const user = await currentUser();
          const email = user?.emailAddresses[0]?.emailAddress || `${userId}@example.com`;
          const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "User";
          dbUser = await prisma.user.create({
            data: {
              clerkUserId: userId,
              email,
              name,
            },
          });
        }
      }
    } catch {
      // Auth check failed or unauthenticated request
    }

    // Fallback user if not logged in or auth is omitted
    if (!dbUser) {
      dbUser = await prisma.user.findFirst();
      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            clerkUserId: "default_user",
            email: "user@example.com",
            name: "Default User",
          },
        });
      }
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
  "urgency": true,
  "category": "short category name"
}

Feedback: "${rawText}"`,
              },
            ],
            model: "llama-3.1-8b-instant",
            response_format: { type: "json_object" },
          });

          const resultText = completion.choices[0]?.message?.content || "{}";
          const aiData = JSON.parse(resultText);

          sentiment = sentiment || aiData.sentiment || "NEUTRAL";
          category = category || aiData.category || "General";
          urgency = urgency !== undefined ? Boolean(urgency) : Boolean(aiData.urgency);
        }
      } catch (err) {
        console.error("AI Analysis warning during feedback creation:", err);
      }
    }

    const newFeedback = await prisma.feedback.create({
      data: {
        content: rawText,
        text: rawText,
        source: bodySource || "IN_APP",
        sentiment: sentiment || "NEUTRAL",
        category: category || "General",
        urgency: urgency !== undefined ? Boolean(urgency) : false,
        workspaceId: dbWorkspace ? dbWorkspace.id : null,
        userId: dbUser.id,
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


