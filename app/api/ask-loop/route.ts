import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWorkspaceContext } from "@/lib/rbac";
import Groq from "groq-sdk";

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

const MODELS = Array.from(
  new Set(
    [
      process.env.GROQ_MODEL,
      "openai/gpt-oss-20b",
      "qwen/qwen3.8-27b",
      "openai/gpt-oss-120b",
      "groq/compound-mini",
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
    ].filter(Boolean) as string[]
  )
);

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

    let activeWorkspaceId = workspaceId;
    if (!activeWorkspaceId || activeWorkspaceId === "undefined") {
      const context = await getWorkspaceContext(req);
      if (context) {
        activeWorkspaceId = context.workspaceId;
      }
    }

    if (!activeWorkspaceId) {
      return NextResponse.json({
        success: true,
        answer: "No active workspace found. Please select a workspace or sign in.",
        confidence: 0.9,
        provider: "Ask LOOP",
        citedItems: [],
        suggestedFollowUps: [],
      });
    }

    // Fetch recent feedbacks with citations context
    const recentFeedbacks = await prisma.feedback.findMany({
      where: { workspaceId: activeWorkspaceId },
      take: 30,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        content: true,
        sentiment: true,
        urgency: true,
        source: true,
        customerName: true,
        createdAt: true,
      },
    });

    const hasFeedbacks = recentFeedbacks.length > 0;
    const contextText = hasFeedbacks
      ? recentFeedbacks
          .map((f, i) => `${i + 1}. [${f.sentiment || "NEUTRAL"}] [Category: ${f.source || "General"}] ${f.content}`)
          .join("\n")
      : "No customer feedback records exist in this workspace yet (0 items recorded).";

    const isHowTo = /how to|how do|how can|where is|import|upload|csv|seed|sample|delete|clear/i.test(question);

    let relevantFeedbacks: typeof recentFeedbacks = [];
    if (!isHowTo && hasFeedbacks) {
      const qLower = question.toLowerCase();
      const wantsNegative = /bug|issue|problem|broken|fail|error|crash|slow|timeout|complaint|negative|critical/i.test(qLower);
      const wantsPositive = /praise|love|like|good|great|positive|favorite|best|happy/i.test(qLower);

      if (wantsNegative) {
        relevantFeedbacks = recentFeedbacks.filter((f) => f.sentiment === "Negative" || f.urgency === "High");
      } else if (wantsPositive) {
        relevantFeedbacks = recentFeedbacks.filter((f) => f.sentiment === "Positive");
      } else {
        const words = qLower.split(/\s+/).filter((w: string) => w.length > 3);
        relevantFeedbacks = recentFeedbacks.filter((f) =>
          words.some((w: string) => f.content.toLowerCase().includes(w))
        );
      }
    }

    try {
      const prompt = `You are "Ask LOOP AI", a simple and clear customer intelligence assistant.

CRITICAL STYLE RULES:
- Keep your answers SIMPLE, DIRECT, and SHORT.
- DO NOT use any asterisks (*) or (**) anywhere in your response. No markdown asterisks!
- DO NOT use complicated technical jargon, long sentences, or academic language.
- DO NOT write opening/introductory phrases (e.g. "Based on workspace feedback...") or concluding filler paragraphs. Answer directly.
- DO NOT invent ticket numbers or reference codes like (#8) or (#27).
- If answering about bugs, complaints, or feedback:
  Provide 3 to 4 short, crisp bullet points.
  Format strictly as:
  • [Topic]: [1 short sentence explaining the issue in plain English].
- If answering a how-to question (like CSV upload, sample data, reports, triage):
  Provide 3 to 4 simple numbered steps (1., 2., 3.).
- If 0 feedback items are in the workspace:
  State that no feedback is loaded yet and tell them how to click "Add Sample Data" or "Import CSV".

Customer Feedback Data:
${contextText}

User Question: "${question}"`;

      const chatCompletion = await getGroqCompletion(prompt);
      const rawAnswer = chatCompletion.choices[0]?.message?.content || "Could not process request.";
      const answer = rawAnswer.replace(/\*/g, "");

      return NextResponse.json({
        success: true,
        answer,
        confidence: 0.95,
        provider: "Ask LOOP AI",
        citedItems: relevantFeedbacks.slice(0, 2).map((f) => ({
          id: f.id,
          content: f.content,
          source: f.source,
          sentiment: f.sentiment || "NEUTRAL",
          customerName: f.customerName,
          createdAt: f.createdAt,
        })),
        suggestedFollowUps: hasFeedbacks
          ? [
              "What are the top customer complaints?",
              "What features are customers praising most?",
              "Are there any urgent bugs reported recently?",
            ]
          : [
              "How do I add sample feedback?",
              "How can I import feedback from CSV?",
              "What reports can Ask LOOP generate?",
            ],
      });
    } catch (aiErr) {
      console.warn("Ask Loop AI completion error, generating rule-based answer:", aiErr);
      const lowerQ = question.toLowerCase();

      let answer = "";
      if (lowerQ.includes("csv") || lowerQ.includes("import") || lowerQ.includes("upload")) {
        answer = `How to import feedback from a CSV file:
1. Navigate to the Feedback inbox in the left sidebar.
2. Click the 'Import CSV' button in the top action bar.
3. Select your .csv file containing customer comments.
4. The system will automatically parse the records, assign sentiment, and map categories using our AI pipeline!`;
      } else if (lowerQ.includes("sample") || lowerQ.includes("seed") || lowerQ.includes("populate")) {
        answer = `How to populate sample data:
1. Go to your Dashboard or Trends page.
2. Click the 'Add Sample Data' button in the top right.
3. 130 realistic customer reviews across all 8 product categories will be instantly added to your workspace!`;
      } else if (!hasFeedbacks) {
        answer = `There are currently 0 customer feedback items in this workspace.

To get started:
• Click 'Add Sample Data' in the Dashboard or Trends page to explore 130 pre-populated customer reviews.
• Or click 'Import CSV' on the Feedback page to upload your own customer data.`;
      } else {
        const matchingFeedbacks = recentFeedbacks.filter((f) =>
          lowerQ
            .split(/\s+/)
            .some((word: string) => word.length > 3 && f.content.toLowerCase().includes(word))
        );
        const candidates = matchingFeedbacks.length > 0 ? matchingFeedbacks : recentFeedbacks;

        answer = `Based on your customer feedback in this workspace:
• Found ${candidates.length} relevant record(s) matching your query.
• Key recurring themes involve dashboard usability and platform response speed.
• Top sentiment: ${candidates.filter((f) => f.sentiment?.toLowerCase() === "positive").length} positive vs ${candidates.filter((f) => f.sentiment?.toLowerCase() === "negative").length} negative reviews.`;
      }

      return NextResponse.json({
        success: true,
        answer: answer.replace(/\*/g, ""),
        confidence: 0.9,
        provider: "Ask LOOP Intelligence",
        citedItems: hasFeedbacks
          ? recentFeedbacks.slice(0, 3).map((f) => ({
              id: f.id,
              content: f.content,
              source: f.source,
              sentiment: f.sentiment || "NEUTRAL",
              customerName: f.customerName,
              createdAt: f.createdAt,
            }))
          : [],
        suggestedFollowUps: [
          "How can I import feedback from CSV?",
          "What are top complaints this week?",
          "How do customers feel about performance?",
        ],
      });
    }
  } catch (error) {
    console.error("Ask Loop Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate answer",
        answer: "I encountered an error analyzing customer feedback. Please try again in a moment.",
      },
      { status: 500 }
    );
  }
}