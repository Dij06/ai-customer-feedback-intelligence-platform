import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWorkspaceContext, unauthorizedResponse } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const context = await getWorkspaceContext(req);
    if (!context) {
      return unauthorizedResponse();
    }

    const user = await prisma.user.findUnique({
      where: { id: context.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        department: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user,
      workspace: {
        id: context.workspaceId,
        name: context.workspaceName,
        slug: context.workspaceSlug,
        role: context.userRole,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const context = await getWorkspaceContext(req);
    if (!context) {
      return unauthorizedResponse();
    }

    const body = await req.json().catch(() => ({}));
    const { name, phoneNumber, department } = body;

    const updatedUser = await prisma.user.update({
      where: { id: context.userId },
      data: {
        name: name !== undefined ? String(name).trim() : undefined,
        phoneNumber: phoneNumber !== undefined ? String(phoneNumber).trim() : undefined,
        department: department !== undefined ? String(department).trim() : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        department: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 });
  }
}

