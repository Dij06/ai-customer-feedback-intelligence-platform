import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from './prisma';

export type UserRole = 'ADMIN' | 'ANALYST' | 'VIEWER';

export interface WorkspaceContext {
  userId: string;
  clerkUserId: string;
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  userRole: UserRole;
  userEmail: string;
  userName: string;
}

// Resolves authenticated user, active workspace, and RBAC role strictly from Clerk session & PostgreSQL database
export async function getWorkspaceContext(..._args: unknown[]): Promise<WorkspaceContext | null> {
  try {
    void _args;
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return null;
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return null;
    }

    const primaryEmail = clerkUser.emailAddresses?.[0]?.emailAddress || `${clerkUserId}@clerk.local`;
    const displayName =
      clerkUser.fullName ||
      (clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : primaryEmail.split('@')[0]);

    // 1. Sync or retrieve user from PostgreSQL
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { clerkUserId },
          { email: primaryEmail },
        ],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkUserId,
          email: primaryEmail,
          name: displayName,
          role: 'USER',
        },
      });
    } else {
      if (user.clerkUserId !== clerkUserId || user.name !== displayName || user.email !== primaryEmail) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            clerkUserId,
            name: displayName,
            email: primaryEmail,
          },
        });
      }
    }

    // 2. Resolve active workspace and membership role from database
    const member = await prisma.workspaceMember.findFirst({
      where: { userId: user.id },
      include: { workspace: true },
      orderBy: { role: 'asc' },
    });

    let workspace: { id: string; name: string; slug: string };
    let resolvedRole: UserRole = 'ADMIN';

    if (member && member.workspace) {
      workspace = member.workspace;
      if (member.role === 'ADMIN') resolvedRole = 'ADMIN';
      else if (member.role === 'ANALYST') resolvedRole = 'ANALYST';
      else resolvedRole = 'VIEWER';
    } else {
      // 3. New user signup flow: create a dedicated workspace for this user and make them ADMIN
      const baseName = user.name || displayName || primaryEmail.split('@')[0] || 'My Team';
      const workspaceName = `${baseName}'s Workspace`;
      const baseSlug = baseName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'workspace';

      let uniqueSlug = baseSlug;
      let attempt = 1;
      while (await prisma.workspace.findUnique({ where: { slug: uniqueSlug } })) {
        uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;
        attempt++;
        if (attempt > 10) {
          uniqueSlug = `${baseSlug}-${Date.now()}`;
          break;
        }
      }

      const newWorkspace = await prisma.workspace.create({
        data: {
          name: workspaceName,
          slug: uniqueSlug,
        },
      });

      // Create default workspace themes for categorization
      const defaultThemes = [
        { name: 'Performance', description: 'App speed, loading times, and responsiveness', color: '#f59e0b' },
        { name: 'Bug', description: 'Software errors, crashes, and broken features', color: '#ef4444' },
        { name: 'Billing', description: 'Invoices, payments, subscriptions, and pricing', color: '#10b981' },
        { name: 'UI/UX', description: 'Design, navigation, ergonomics, and usability', color: '#8b5cf6' },
        { name: 'Feature Request', description: 'New feature suggestions and enhancements', color: '#3b82f6' },
      ];

      await prisma.theme.createMany({
        data: defaultThemes.map((t) => ({
          name: t.name,
          description: t.description,
          color: t.color,
          workspaceId: newWorkspace.id,
        })),
        skipDuplicates: true,
      });

      // Assign user as ADMIN of their own new workspace
      const newMembership = await prisma.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: newWorkspace.id,
          role: 'ADMIN',
        },
        include: { workspace: true },
      });

      workspace = newMembership.workspace;
      resolvedRole = 'ADMIN';
    }

    return {
      userId: user.id,
      clerkUserId,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      workspaceSlug: workspace.slug,
      userRole: resolvedRole,
      userEmail: user.email,
      userName: user.name || user.email.split('@')[0],
    };
  } catch (error) {
    console.error('Error resolving workspace context from Clerk/DB:', error);
    return null;
  }
}

// Permissions: Admin and Analyst can submit feedback and upload CSVs
export function canIngestFeedback(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'ANALYST';
}

// Permissions: Admin and Analyst can change triage status (New, Reviewed, Actioned)
export function canTriageFeedback(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'ANALYST';
}

// Permissions: Only Admin can delete feedback entries
export function canDeleteFeedback(role: UserRole): boolean {
  return role === 'ADMIN';
}

// Permissions: Only Admin can invite members and update roles
export function canManageMembers(role: UserRole): boolean {
  return role === 'ADMIN';
}

// Helper for standardized 401 Unauthorized responses
export function unauthorizedResponse(
  message = 'Unauthorized. Please sign in to access this resource.'
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: 'UNAUTHORIZED',
    },
    { status: 401 }
  );
}

// Helper for standardized 403 Forbidden responses
export function forbiddenResponse(
  message = 'You do not have permission to perform this action.'
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: 'FORBIDDEN',
    },
    { status: 403 }
  );
}
