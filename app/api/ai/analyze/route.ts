import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { getWorkspaceContext, unauthorizedResponse, forbiddenResponse, canIngestFeedback } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const context = await getWorkspaceContext(req);
    if (!context) {
      return unauthorizedResponse("Please sign in to analyze feedback.");
    }

    if (!canIngestFeedback(context.userRole)) {
      return forbiddenResponse("Viewer role is read-only. AI analysis is restricted to Admins and Analysts.");
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY environment variable missing" },
        { status: 500 }
      );
    }

    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

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

Feedback: "${text}"`,
        },
      ],
      model: process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
      response_format: { type: "json_object" },
    });

    const resultText = completion.choices[0]?.message?.content || "{}";
    return NextResponse.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("GROQ_ERROR:", error);
    return NextResponse.json(
      { error: "AI Processing Failed", details: error?.message },
      { status: 500 }
    );
  }
}