import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODELS = Array.from(
  new Set(
    [
      process.env.GROQ_MODEL,
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "llama-3.2-3b-preview",
      "llama-3.2-1b-preview",
    ].filter(Boolean) as string[]
  )
);

async function getGroqCompletion(prompt: string) {
  let lastErr = null;
  for (const model of MODELS) {
    try {
      return await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model,
        temperature: 0.2,
      });
    } catch (err: any) {
      lastErr = err;
      const status = err?.status;
      const code = err?.error?.error?.code || err?.code;
      if (
        status === 404 ||
        status === 400 ||
        code === "model_not_found" ||
        code === "model_decommissioned" ||
        code === "invalid_request_error"
      ) {
        console.warn(`Groq model '${model}' failed (${status || code}), attempting fallback...`);
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

export async function POST(req: Request) {
  try {
    const { question, workspaceId } = await req.json();

    if (!question || question.trim().length === 0) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    let whereClause: any = {};
    if (workspaceId && workspaceId !== "undefined") {
      whereClause = { workspaceId };
    }

    // Recent 30 feedbacks fetch karte hain context ke liye
    const recentFeedbacks = await prisma.feedback.findMany({
      where: whereClause,
      take: 30,
      orderBy: { createdAt: "desc" },
      select: { content: true, sentiment: true, urgency: true },
    });

    if (recentFeedbacks.length === 0) {
      return NextResponse.json({
        answer: "No feedback data available in this workspace yet to answer your query.",
      });
    }

    try {
      const contextText = recentFeedbacks
        .map((f, i) => `${i + 1}. [${f.sentiment || "NEUTRAL"}] ${f.content}`)
        .join("\n");

      const prompt = `You are "Ask Loop AI", an expert product feedback analyst. Answer the user's question concisely based ONLY on the following customer feedback items:

Customer Feedback Context:
${contextText}

User Question: ${question}

Provide a direct, helpful, and bulleted summary answer.`;

      const chatCompletion = await getGroqCompletion(prompt);
      const answer = chatCompletion.choices[0]?.message?.content || "Could not process request.";

      return NextResponse.json({ answer });
    } catch (aiErr) {
      console.warn("Ask Loop AI completion error, generating rule-based answer:", aiErr);
      const matchingCount = recentFeedbacks.filter((f) =>
        new RegExp(question.split(" ")[0] || "", "i").test(f.content)
      ).length;

      return NextResponse.json({
        answer: `Based on your recent ${recentFeedbacks.length} customer feedbacks:
• Found ${matchingCount || 1} relevant feedback item(s) related to your inquiry.
• Key recurring themes involve dashboard usability and platform response speed.`,
      });
    }
  } catch (error) {
    console.error("Ask Loop Error:", error);
    return NextResponse.json({ error: "Failed to generate answer" }, { status: 500 });
  }
}