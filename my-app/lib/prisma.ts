import { PrismaClient } from '@prisma/client';

const neonUrl =
  "postgresql://neondb_owner:npg_FY0y7pqTvIWZ@ep-cool-smoke-ax6w8mku.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require";
const rawUrl = process.env.DATABASE_URL || "";

const dbUrl =
  rawUrl &&
  !rawUrl.includes("your_db_connection_url_here") &&
  !rawUrl.includes("localhost:5432")
    ? rawUrl
    : neonUrl;

process.env.DATABASE_URL = dbUrl;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

if (globalForPrisma.prisma) {
  const currentUrl =
    (globalForPrisma.prisma as any)?._engineConfig?.overrideDatasources?.db?.url || "";
  if (currentUrl.includes("your_db_connection_url_here") || currentUrl.includes("localhost:5432")) {
    globalForPrisma.prisma = undefined;
  }
}

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
