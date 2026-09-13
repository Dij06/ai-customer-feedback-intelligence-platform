import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { question, workspaceId } = await req.json();

    if (!question || question.trim().length === 0) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const targetWorkspaceId = workspaceId || "cmtbcxvci0000ex7dtm";

    // Recent 30 feedbacks fetch karte hain context ke liye
    const recentFeedbacks = await prisma.feedback.findMany({
      where: { workspaceId: targetWorkspaceId },
      take: 30,
      orderBy: { createdAt: "desc" },
      select: { content: true, sentiment: true, urgency: true },
    });

    if (recentFeedbacks.length === 0) {
      return NextResponse.json({
        answer: "No feedback data available in this workspace yet to answer your query.",
      });
    }

    const contextText = recentFeedbacks
      .map((f, i) => `${i + 1}. [${f.sentiment}] ${f.content}`)
      .join("\n");

    const prompt = `You are "Ask Loop AI", an expert product feedback analyst. Answer the user's question concisely based ONLY on the following customer feedback items:

Customer Feedback Context:
${contextText}

User Question: ${question}

Provide a direct, helpful, and bulleted summary answer.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
    });

    const answer = chatCompletion.choices[0]?.message?.content || "Could not process request.";

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Ask Loop Error:", error);
    return NextResponse.json({ error: "Failed to generate answer" }, { status: 500 });
  }
}