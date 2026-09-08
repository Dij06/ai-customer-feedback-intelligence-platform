import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId") || "cmtbcxvci0000ex7dtm";

    const feedbacks = await prisma.feedback.findMany({
      where: { workspaceId },
      take: 40,
      orderBy: { createdAt: "desc" },
      select: { content: true, sentiment: true, category: true, urgency: true },
    });

    if (feedbacks.length === 0) {
      return NextResponse.json({
        summary: "No customer feedback found for this workspace yet.",
        csatScore: "N/A",
        topComplaints: [],
        keyWins: [],
        actionItems: [],
      });
    }

    const contextText = feedbacks
      .map((f) => `[Sentiment: ${f.sentiment}, Urgent: ${f.urgency}] ${f.content}`)
      .join("\n");

    const prompt = `You are a Chief Customer Officer (CCO). Analyze the following customer feedback items and generate a Voice-of-Customer (VoC) Executive Report:

${contextText}

Return ONLY a valid JSON object matching this exact schema:
{
  "summary": "High-level 2-sentence executive summary of customer sentiment.",
  "csatScore": "e.g., 78%",
  "topComplaints": ["Complaint 1", "Complaint 2"],
  "keyWins": ["What customers love 1", "What customers love 2"],
  "actionItems": ["Strategic Recommendation 1", "Strategic Recommendation 2"]
}`;

    const response = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
    });

    const rawContent = response.choices[0]?.message?.content || "{}";
    const parsedReport = JSON.parse(rawContent.trim());

    return NextResponse.json(parsedReport);
  } catch (error) {
    console.error("VoC Report API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate Voice-of-Customer report" },
      { status: 500 }
    );
  }
}