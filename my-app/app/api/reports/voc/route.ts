import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODELS = [
  process.env.GROQ_MODEL,
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
  "qwen/qwen3.6-27b",
].filter(Boolean) as string[];

async function getGroqCompletion(prompt: string) {
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
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    let whereClause: any = {};
    if (workspaceId && workspaceId !== "undefined") {
      whereClause = { workspaceId };
    }

    const feedbacks = await prisma.feedback.findMany({
      where: whereClause,
      take: 50,
      orderBy: { createdAt: "desc" },
    });

    if (feedbacks.length === 0) {
      return NextResponse.json({
        summary: "No customer feedback available yet.",
        csatScore: "N/A",
        keyWins: ["No positive feedback recorded yet."],
        topComplaints: ["No complaints recorded yet."],
        actionItems: ["Collect more feedback to generate insights."],
      });
    }

    const feedbackText = feedbacks
      .map((f, i) => `${i + 1}. [${f.sentiment || "NEUTRAL"}] ${f.content}`)
      .join("\n");

    const prompt = `You are a Voice of Customer analyst. Analyze this feedback:

${feedbackText}

Provide a valid JSON response with these EXACT keys:
{
  "summary": "Brief 2-3 sentence executive summary",
  "csatScore": "Estimated CSAT score like 85% or 4.2/5",
  "keyWins": ["win 1", "win 2"],
  "topComplaints": ["complaint 1", "complaint 2"],
  "actionItems": ["action 1", "action 2"]
}

Only return valid JSON.`;

    const response = await getGroqCompletion(prompt);
    const rawContent = response.choices[0]?.message?.content || "{}";
    const parsedData = JSON.parse(rawContent.trim());

    return NextResponse.json({
      summary: parsedData.summary || "Summary unavailable.",
      csatScore: parsedData.csatScore || "N/A",
      keyWins: parsedData.keyWins || [],
      topComplaints: parsedData.topComplaints || [],
      actionItems: parsedData.actionItems || [],
    });
  } catch (error: any) {
    console.error("VoC Report API Error:", error);
    return NextResponse.json(
      {
        summary: "Failed to load report summary due to an error.",
        csatScore: "N/A",
        keyWins: [],
        topComplaints: [],
        actionItems: [],
        error: "Failed to generate report.",
      },
      { status: 500 }
    );
  }
}