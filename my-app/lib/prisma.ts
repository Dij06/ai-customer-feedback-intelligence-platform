import { PrismaClient } from '@prisma/client';

const dbUrl =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_FY0y7pqTvIWZ@ep-cool-smoke-ax6w8mku.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}