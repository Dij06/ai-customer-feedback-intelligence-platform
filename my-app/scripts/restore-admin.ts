import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function restoreAdmin() {
  console.log('Checking users to restore Admin status...');
  const users = await prisma.user.findMany({
    include: { memberships: true },
  });

  let restoredCount = 0;
  for (const u of users) {
    // Skip automated system bots
    if (u.email === 'system@ingestion.local') continue;

    console.log('Restoring Admin role for:', u.email);
    await prisma.user.update({
      where: { id: u.id },
      data: { role: 'ADMIN' },
    });

    for (const mem of u.memberships) {
      await prisma.workspaceMember.update({
        where: { id: mem.id },
        data: { role: 'ADMIN' },
      });
      restoredCount++;
    }
  }

  console.log('Successfully restored memberships to ADMIN! Total:', restoredCount);
}

restoreAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
