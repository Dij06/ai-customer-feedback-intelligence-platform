"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Clean Zod Schema Validation
export const feedbackSchema = z.object({
  content: z
    .string()
    .min(10, { message: "Feedback must be at least 10 characters long." })
    .max(1000, { message: "Feedback cannot exceed 1000 characters." }),
  sentiment: z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]),
  source: z.string().min(1, { message: "Source is required." }),
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
      return { success: false, message: "Workspace or User not found in database." };
    }

    await prisma.feedback.create({
      data: {
        content: validated.data.content,
        category: "General",
        urgency: "Low",
        sentiment: validated.data.sentiment,
        source: validated.data.source,
        workspaceId: defaultWorkspace.id,
        userId: defaultUser.id,
      },
    });

    return { success: true, message: "Feedback submitted successfully." };
  } catch (error) {
    console.error("Submission error:", error);
    return { success: false, message: "An error occurred while saving feedback to database." };
  }
}