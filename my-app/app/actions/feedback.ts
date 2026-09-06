"use server";

import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Clean Zod Schema Validation
export const feedbackSchema = z.object({
  content: z
    .string()
    .min(10, { message: "Feedback kam se kam 10 characters ka hona chahiye." })
    .max(1000, { message: "Feedback 1000 characters se zyada nahi ho sakta." }),
  sentiment: z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]),
  source: z.string().min(1, { message: "Source required hai." }),
});

export type FeedbackFormValues = z.infer<typeof feedbackSchema>;

export async function submitFeedbackAction(data: FeedbackFormValues) {
  const validated = feedbackSchema.safeParse(data);

  if (!validated.success) {
    return { success: false, error: validated.error.flatten().fieldErrors };
  }

  try {
    const defaultWorkspace = await prisma.workspace.findFirst();
    const defaultUser = await prisma.user.findFirst();

    if (!defaultWorkspace || !defaultUser) {
      return { success: false, message: "Workspace ya User database mein nahi mila." };
    }

    await prisma.feedback.create({
      data: {
        content: validated.data.content,
        text: validated.data.content,
        category: "General",
        urgency: false,
        sentiment: validated.data.sentiment,
        source: validated.data.source,
        workspaceId: defaultWorkspace.id,
        userId: defaultUser.id,
      },
    });

    return { success: true, message: "Feedback successfully submit ho gaya!" };
  } catch (error) {
    console.error("Submission error:", error);
    return { success: false, message: "Database mein save karte waqt error aaya." };
  }
}