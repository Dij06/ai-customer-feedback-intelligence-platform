import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWorkspaceContext } from "@/lib/rbac";
import Groq from "groq-sdk";

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

// Active Groq production models
const MODELS = [
  process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
  "qwen/qwen3.8-27b",
  "groq/compound-mini",
  "openai/gpt-oss-120b",
  "groq/compound",
  "openai/gpt-oss-20b",
].filter(Boolean) as string[];

async function getGroqCompletion(prompt: string) {
  const groq = getGroqClient();
  if (!groq) {
    throw new Error("GROQ_API_KEY environment variable is not configured");
  }
  let lastErr = null;

  for (const model of MODELS) {
    try {
      return await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model,
        temperature: 0.1,
        response_format: { type: "json_object" },
      });
    } catch (err: any) {
      lastErr = err;
      const status = err?.status;
      const code = err?.error?.error?.code;

      if (
        status === 404 ||
        status === 400 ||
        code === "model_not_found" ||
        code === "model_decommissioned"
      ) {
        console.warn(`Groq model '${model}' failed (${status || code}), attempting fallback...`);
        continue;
      }
      throw err;
    }
  }
  throw lastErr || new Error("All Groq models failed to respond.");
}

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
        clusters: [],
        trends: ["No customer feedback records found in this workspace yet."],
      });
    }

    const feedbacks = await prisma.feedback.findMany({
      where: { workspaceId },
      take: 25,
      orderBy: { createdAt: "desc" },
      select: { content: true, sentiment: true, category: true },
    });

    if (feedbacks.length === 0) {
      return NextResponse.json({
        clusters: [],
        trends: ["Not enough data to analyze trends."],
      });
    }

    const feedbackText = feedbacks
      .map((f, i) => `${i + 1}. [${f.sentiment || "NEUTRAL"}] ${f.content}`)
      .join("\n");

    const prompt = `You are a product feedback analyst. Analyze these feedback items:

${feedbackText}

Provide a valid JSON response matching this exact structure:
{
  "clusters": [
    { "theme": "Theme Name", "count": number, "description": "Short explanation of feedback group" }
  ],
  "trends": [
    "Trend observation 1",
    "Trend observation 2"
  ]
}

Only return valid JSON without markdown text or surrounding quotes.`;

    const response = await getGroqCompletion(prompt);

    const rawContent = response.choices[0]?.message?.content || "{}";
    const parsedData = JSON.parse(rawContent.trim());

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("Insights API Error:", error);
    return NextResponse.json(
      { clusters: [], trends: ["Failed to calculate trends due to AI processing issue."] },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const { POST: askLoopHandler } = await import("@/app/api/ask-loop/route");
  return askLoopHandler(req);
}
