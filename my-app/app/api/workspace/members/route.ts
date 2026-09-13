import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWorkspaceContext, canManageMembers, unauthorizedResponse, forbiddenResponse, UserRole } from '@/lib/rbac';
import { MemberInviteSchema, MemberRoleUpdateSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  try {
    const context = await getWorkspaceContext(req);
    if (!context) {
      return unauthorizedResponse();
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: context.workspaceId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json({ success: false, error: 'Workspace not found' }, { status: 404 });
    }

    const formattedMembers = workspace.members.map((m) => ({
      membershipId: m.id,
      userId: m.userId,
      email: m.user.email,
      name: m.user.name || m.user.email.split('@')[0],
      role: m.role,
    }));

    return NextResponse.json({
      success: true,
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
      },
      currentRole: context.userRole,
      currentUserEmail: context.userEmail,
      currentUserId: context.userId,
      members: formattedMembers,
    });
  } catch (error: unknown) {
    console.error('Error fetching workspace members:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await getWorkspaceContext(req);
    if (!context) {
      return unauthorizedResponse();
    }

    if (!canManageMembers(context.userRole)) {
      return forbiddenResponse('Only Admins can invite and add workspace members.');
    }

    const rawBody = await req.json().catch(() => ({}));
    const parseResult = MemberInviteSchema.safeParse(rawBody);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues.map((e: { message: string }) => e.message).join(', ');
      return NextResponse.json(
        { success: false, error: errorMessage, details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { email, name, role = 'VIEWER' } = parseResult.data;
    const validatedRole = role as UserRole;

    // Connect or create user in DB
    const user = await prisma.user.upsert({
      where: { email },
      update: { name: name || undefined },
      create: {
        email,
        name: name || email.split('@')[0],
        role: validatedRole,
      },
    });

    // Add membership strictly scoped to current workspace
    const membership = await prisma.workspaceMember.upsert({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: context.workspaceId,
        },
      },
      update: { role: validatedRole },
      create: {
        userId: user.id,
        workspaceId: context.workspaceId,
        role: validatedRole,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Member ${email} added as ${validatedRole}`,
      member: {
        membershipId: membership.id,
        userId: user.id,
        email: user.email,
        name: user.name,
        role: membership.role,
      },
    });
  } catch (error: unknown) {
    console.error('Error adding member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add workspace member' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const context = await getWorkspaceContext(req);
    if (!context) {
      return unauthorizedResponse();
    }

    if (!canManageMembers(context.userRole)) {
      return forbiddenResponse('Only Admins are permitted to update member roles.');
    }

    const rawBody = await req.json().catch(() => ({}));
    const parseResult = MemberRoleUpdateSchema.safeParse(rawBody);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues.map((e: { message: string }) => e.message).join(', ');
      return NextResponse.json(
        { success: false, error: errorMessage, details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { membershipId, newRole } = parseResult.data;

    // Explicit tenant isolation check: verify membership belongs to the active workspace
    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        id: membershipId,
        workspaceId: context.workspaceId,
      },
    });

    if (!existingMember) {
      return NextResponse.json(
        { success: false, error: 'Member not found in this workspace' },
        { status: 404 }
      );
    }

    const updated = await prisma.workspaceMember.update({
      where: { id: membershipId },
      data: { role: newRole as UserRole },
    });

    return NextResponse.json({
      success: true,
      message: `Role updated to ${newRole}`,
      membership: updated,
    });
  } catch (error: unknown) {
    console.error('Error updating member role:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update member role' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const context = await getWorkspaceContext(req);
    if (!context) {
      return unauthorizedResponse();
    }

    if (!canManageMembers(context.userRole)) {
      return forbiddenResponse('Only Admins are permitted to remove members.');
    }

    const { searchParams } = new URL(req.url);
    const membershipId = searchParams.get('membershipId');

    if (!membershipId) {
      return NextResponse.json(
        { success: false, error: 'membershipId parameter is required' },
        { status: 400 }
      );
    }

    // Explicit tenant isolation check: verify membership belongs to the active workspace
    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        id: membershipId,
        workspaceId: context.workspaceId,
      },
    });

    if (!existingMember) {
      return NextResponse.json(
        { success: false, error: 'Member not found in this workspace' },
        { status: 404 }
      );
    }

    // Prevent Admin from removing their own account from the workspace
    if (existingMember.userId === context.userId) {
      return NextResponse.json(
        { success: false, error: 'You cannot remove your own account from the workspace.' },
        { status: 400 }
      );
    }

    await prisma.workspaceMember.delete({
      where: { id: membershipId },
    });

    return NextResponse.json({
      success: true,
      message: 'Member removed from workspace successfully',
    });
  } catch (error: unknown) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove member' },
      { status: 500 }
    );
  }
}
