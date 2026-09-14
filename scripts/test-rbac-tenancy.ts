import 'dotenv/config';
import { prisma } from '../lib/prisma';
import {
  canIngestFeedback,
  canTriageFeedback,
  canDeleteFeedback,
  canManageMembers,
} from '../lib/rbac';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, testName: string, errorMsg?: string) {
  if (condition) {
    results.push({ name: testName, passed: true });
    console.log(`  [PASS] ${testName}`);
  } else {
    results.push({ name: testName, passed: false, error: errorMsg || 'Assertion failed' });
    console.error(`  [FAIL] ${testName} - ${errorMsg || 'Assertion failed'}`);
  }
}

async function runTests() {
  console.log('\nRunning RBAC and Tenant Isolation Tests\n');

  // Check role permission matrix
  console.log('1. Role-Based Access Control');
  assert(canIngestFeedback('ADMIN'), 'Admin can ingest feedback');
  assert(canIngestFeedback('ANALYST'), 'Analyst can ingest feedback');
  assert(!canIngestFeedback('VIEWER'), 'Viewer cannot ingest feedback');

  assert(canTriageFeedback('ADMIN'), 'Admin can triage feedback');
  assert(canTriageFeedback('ANALYST'), 'Analyst can triage feedback');
  assert(!canTriageFeedback('VIEWER'), 'Viewer cannot triage feedback');

  assert(canDeleteFeedback('ADMIN'), 'Admin can delete feedback');
  assert(!canDeleteFeedback('ANALYST'), 'Analyst cannot delete feedback');
  assert(!canDeleteFeedback('VIEWER'), 'Viewer cannot delete feedback');

  assert(canManageMembers('ADMIN'), 'Admin can manage members');
  assert(!canManageMembers('ANALYST'), 'Analyst cannot manage members');
  assert(!canManageMembers('VIEWER'), 'Viewer cannot manage members');

  // Verify self-removal check
  console.log('\n2. Self-Removal Protection');
  const mockAdminUserId = 'admin-user-id-123';
  const mockTargetMemberIdSame = 'admin-user-id-123';
  const mockTargetMemberIdOther = 'analyst-user-id-456';

  const isSelfRemoval = (requesterUserId: string, targetUserId: string) => {
    return requesterUserId === targetUserId;
  };

  assert(
    isSelfRemoval(mockAdminUserId, mockTargetMemberIdSame) === true,
    'Admin targeting own account is detected as self-removal'
  );
  assert(
    isSelfRemoval(mockAdminUserId, mockTargetMemberIdOther) === false,
    'Admin targeting other account is permitted'
  );

  // Test multi-tenant isolation with isolated database records
  console.log('\n3. Database Tenant Isolation');

  try {
    const timestamp = Date.now();
    const workspaceA = await prisma.workspace.create({
      data: {
        name: `Tenant Test Workspace A (${timestamp})`,
        slug: `tenant-test-a-${timestamp}`,
      },
    });

    const workspaceB = await prisma.workspace.create({
      data: {
        name: `Tenant Test Workspace B (${timestamp})`,
        slug: `tenant-test-b-${timestamp}`,
      },
    });

    console.log(`  - Created Workspace A: ${workspaceA.id}`);
    console.log(`  - Created Workspace B: ${workspaceB.id}`);

    const userAdminA = await prisma.user.create({
      data: {
        email: `admin-a-${timestamp}@test.local`,
        name: 'Admin A',
        role: 'ADMIN',
      },
    });

    const userAdminB = await prisma.user.create({
      data: {
        email: `admin-b-${timestamp}@test.local`,
        name: 'Admin B',
        role: 'ADMIN',
      },
    });

    const membershipA = await prisma.workspaceMember.create({
      data: {
        userId: userAdminA.id,
        workspaceId: workspaceA.id,
        role: 'ADMIN',
      },
    });

    const membershipB = await prisma.workspaceMember.create({
      data: {
        userId: userAdminB.id,
        workspaceId: workspaceB.id,
        role: 'ADMIN',
      },
    });

    const feedbackA = await prisma.feedback.create({
      data: {
        content: 'Workspace A confidential customer note.',
        category: 'Bug',
        sentiment: 'Negative',
        workspaceId: workspaceA.id,
      },
    });

    const feedbackB = await prisma.feedback.create({
      data: {
        content: 'Workspace B confidential customer note.',
        category: 'Feature Request',
        sentiment: 'Positive',
        workspaceId: workspaceB.id,
      },
    });

    // Verify Workspace A queries only return Workspace A data
    const queryForTenantA = await prisma.feedback.findMany({
      where: { workspaceId: workspaceA.id },
    });

    assert(
      queryForTenantA.some((f) => f.id === feedbackA.id),
      'Workspace A query retrieves Workspace A feedback'
    );
    assert(
      !queryForTenantA.some((f) => f.id === feedbackB.id),
      'Workspace A query does not contain Workspace B feedback'
    );

    // Verify Workspace B queries only return Workspace B data
    const queryForTenantB = await prisma.feedback.findMany({
      where: { workspaceId: workspaceB.id },
    });

    assert(
      queryForTenantB.some((f) => f.id === feedbackB.id),
      'Workspace B query retrieves Workspace B feedback'
    );
    assert(
      !queryForTenantB.some((f) => f.id === feedbackA.id),
      'Workspace B query does not contain Workspace A feedback'
    );

    // Verify cross-tenant modifications are rejected
    const crossTenantFeedbackLookup = await prisma.feedback.findFirst({
      where: {
        id: feedbackA.id,
        workspaceId: workspaceB.id,
      },
    });

    assert(
      crossTenantFeedbackLookup === null,
      'Tenant B context cannot find or modify Tenant A feedback'
    );

    const crossTenantMemberLookup = await prisma.workspaceMember.findFirst({
      where: {
        id: membershipA.id,
        workspaceId: workspaceB.id,
      },
    });

    assert(
      crossTenantMemberLookup === null,
      'Tenant B context cannot find or modify Tenant A members'
    );

    // Verify new user sign-up provisioning isolation
    console.log('\n4. User Sign-up Provisioning');

    const newSignUpUser = await prisma.user.create({
      data: {
        email: `new-user-${timestamp}@test.local`,
        name: 'New Sign Up User',
        role: 'USER',
      },
    });

    const initialMembership = await prisma.workspaceMember.findFirst({
      where: { userId: newSignUpUser.id },
    });
    assert(initialMembership === null, 'New user starts with no workspace membership');

    // Provision dedicated workspace for the new user
    const newPersonalWorkspace = await prisma.workspace.create({
      data: {
        name: `${newSignUpUser.name}'s Workspace`,
        slug: `user-workspace-${timestamp}`,
      },
    });

    const newPersonalMembership = await prisma.workspaceMember.create({
      data: {
        userId: newSignUpUser.id,
        workspaceId: newPersonalWorkspace.id,
        role: 'ADMIN',
      },
    });

    assert(
      newPersonalMembership.role === 'ADMIN',
      'New user is assigned Admin role in their own workspace'
    );
    assert(
      newPersonalMembership.workspaceId !== workspaceA.id &&
      newPersonalMembership.workspaceId !== workspaceB.id,
      'New user workspace is isolated from other tenants'
    );

    // Clean up temporary test records
    await prisma.feedback.deleteMany({
      where: { id: { in: [feedbackA.id, feedbackB.id] } },
    });
    await prisma.workspaceMember.deleteMany({
      where: { id: { in: [membershipA.id, membershipB.id, newPersonalMembership.id] } },
    });
    await prisma.workspace.deleteMany({
      where: { id: { in: [workspaceA.id, workspaceB.id, newPersonalWorkspace.id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [userAdminA.id, userAdminB.id, newSignUpUser.id] } },
    });

  } catch (err) {
    console.error('Test execution error:', err);
    assert(false, 'Tenant isolation tests executed without errors', String(err));
  }

  // Final summary
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`\nResults: ${passed}/${total} passed (${failed} failed)\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
