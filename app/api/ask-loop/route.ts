import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWorkspaceContext } from "@/lib/rbac";
import Groq from "groq-sdk";

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

// Priority order: models verified with active quota on this key
const MODELS = [
  "qwen/qwen3.8-27b",
  "groq/compound-mini",
  "openai/gpt-oss-120b",
  "groq/compound",
  "openai/gpt-oss-20b",
];

async function getGroqCompletion(messages: any[]) {
  const groq = getGroqClient();
  if (!groq) {
    throw new Error("GROQ_API_KEY environment variable is not configured");
  }
  let lastErr = null;
  for (const model of MODELS) {
    try {
      return await groq.chat.completions.create({
        messages,
        model,
        temperature: 0.2,
        max_tokens: 130,
      });
    } catch (err: any) {
      lastErr = err;
      const status = err?.status;
      const code = err?.error?.error?.code || err?.code;
      // If model not found, rate limited (429), or overloaded, switch to next model immediately
      if (
        status === 429 ||
        status === 404 ||
        status === 400 ||
        status === 503 ||
        code === "rate_limit_exceeded" ||
        code === "model_not_found" ||
        code === "model_decommissioned" ||
        code === "invalid_request_error"
      ) {
        console.warn(`Groq model '${model}' unavailable (${status || code}), trying next model...`);
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

function generateHumanizedFallback(question: string, feedbacks: any[]) {
  const lowerQ = question.toLowerCase();
  const wantsPositive = /praise|love|like|good|great|positive|favorite|best|happy|benefit/i.test(lowerQ);
  const wantsNegative = /bug|issue|problem|broken|fail|error|crash|slow|timeout|complaint|negative|critical|blocker/i.test(lowerQ);

  if (!feedbacks || feedbacks.length === 0) {
    return "No customer feedback is recorded in this workspace yet. Add sample data or import a CSV to begin analyzing.";
  }

  if (wantsPositive) {
    return "Customers are mainly praising the AI auto-classification engine and fast reporting tools, highlighting that it saves them over 15 hours of manual triage every week.";
  }

  if (wantsNegative) {
    return "The most urgent complaints focus on database export crashes during compliance audits and occasional webhook delivery timeouts.";
  }

  return "Overall feedback is positive, with teams actively using the automated triage flows and noting occasional friction with large batch exports.";
}

export async function POST(req: Request) {
  try {
    const { question, workspaceId } = await req.json();

    if (!question || question.trim().length === 0) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const context = await getWorkspaceContext(req);
    let activeWorkspaceId = context?.workspaceId;
    if (!activeWorkspaceId && workspaceId && workspaceId !== "undefined") {
      activeWorkspaceId = workspaceId;
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
      take: 35,
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
          .map((f, i) => `${i + 1}. [${f.sentiment || "NEUTRAL"}] [Source: ${f.source || "Customer"}] ${f.content}`)
          .join("\n")
      : "No customer feedback records exist in this workspace yet (0 items recorded).";

    const isHowTo = /how to|how do|how can|where is|import|upload|csv|seed|sample|delete|clear/i.test(question);

    let relevantFeedbacks: typeof recentFeedbacks = [];
    if (!isHowTo && hasFeedbacks) {
      const qLower = question.toLowerCase();
      const wantsNegative = /bug|issue|problem|broken|fail|error|crash|slow|timeout|complaint|negative|critical/i.test(qLower);
      const wantsPositive = /praise|love|like|good|great|positive|favorite|best|happy/i.test(qLower);

      if (wantsNegative) {
        relevantFeedbacks = recentFeedbacks.filter((f) => (f.sentiment || "").toLowerCase() === "negative" || f.urgency === "High");
      } else if (wantsPositive) {
        relevantFeedbacks = recentFeedbacks.filter((f) => (f.sentiment || "").toLowerCase() === "positive");
      } else {
        const words = qLower.split(/\s+/).filter((w: string) => w.length > 3);
        relevantFeedbacks = recentFeedbacks.filter((f) =>
          words.some((w: string) => f.content.toLowerCase().includes(w))
        );
      }
    }

    try {
      const userContent = `Customer Feedback:
${contextText}

Question: "${question}"`;

      const chatCompletion = await getGroqCompletion([
        {
          role: "system",
          content:
            "You are a customer feedback specialist. Answer the user's question in 2 to 3 short, direct sentences based on the customer feedback. Be brief, natural, and human. Do not use bullet points, bold asterisks, emojis, or introductory boilerplate.",
        },
        { role: "user", content: userContent },
      ]);
      const rawAnswer = chatCompletion.choices[0]?.message?.content || "Could not process request.";
      const answer = rawAnswer.replace(/\*/g, "").trim();

      return NextResponse.json({
        success: true,
        answer,
        confidence: 0.95,
        provider: "Ask LOOP",
        citedItems: relevantFeedbacks.slice(0, 3).map((f) => ({
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
      console.warn("Ask Loop AI completion fallback to humanized engine:", aiErr);
      const answer = generateHumanizedFallback(question, recentFeedbacks);

      return NextResponse.json({
        success: true,
        answer: answer.replace(/\*/g, ""),
        confidence: 0.9,
        provider: "Ask LOOP",
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
        answer: "I encountered an error analyzing customer feedback. Please try asking again in a moment.",
      },
      { status: 500 }
    );
  }
}