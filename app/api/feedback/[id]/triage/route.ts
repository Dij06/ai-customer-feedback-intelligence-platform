import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWorkspaceContext, canTriageFeedback, unauthorizedResponse, forbiddenResponse } from "@/lib/rbac";

export async function PATCH(
  req: NextRequest,
  contextProps: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const context = await getWorkspaceContext(req);
    if (!context) {
      return unauthorizedResponse("Please sign in to update feedback status.");
    }

    if (!canTriageFeedback(context.userRole)) {
      return forbiddenResponse("Viewer role is read-only. Triaging feedback is restricted to Admins and Analysts.");
    }

    const resolvedParams = await contextProps.params;
    const feedbackId = resolvedParams.id;

    if (!feedbackId) {
      return NextResponse.json({ error: "Missing feedback ID" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { status } = body;

    if (!status || !["NEW", "REVIEWED", "ACTIONED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be NEW, REVIEWED, or ACTIONED." },
        { status: 400 }
      );
    }

    const feedback = await prisma.feedback.findFirst({
      where: { id: feedbackId, workspaceId: context.workspaceId },
    });

    if (!feedback) {
      return NextResponse.json({ error: "Feedback not found in workspace" }, { status: 404 });
    }

    const updated = await prisma.feedback.update({
      where: { id: feedbackId },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      message: `Feedback marked as ${status}`,
      feedback: updated,
    });
  } catch (error: any) {
    console.error("Error triaging feedback:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update feedback status" },
      { status: 500 }
    );
  }
}
