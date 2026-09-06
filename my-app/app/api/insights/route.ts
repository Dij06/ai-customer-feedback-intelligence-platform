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
      take: 25,
      orderBy: { createdAt: "desc" },
      select: { content: true, sentiment: true, category: true },
    });

    if (feedbacks.length === 0) {
      return NextResponse.json({
        clusters: [],
        trends: ["No enough data to analyze trends."],
      });
    }

    const feedbackText = feedbacks
      .map((f, i) => `${i + 1}. [${f.sentiment}] ${f.content}`)
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

    const response = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
    });

    const rawContent = response.choices[0]?.message?.content || "{}";
    const parsedData = JSON.parse(rawContent.trim());

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error("Insights API Error:", error);
    return NextResponse.json(
      { clusters: [], trends: ["Failed to calculate trends."] },
      { status: 500 }
    );
  }
}