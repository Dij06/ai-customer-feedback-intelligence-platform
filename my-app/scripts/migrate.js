/* eslint-disable @typescript-eslint/no-require-imports */
const { Client } = require('pg');
require('dotenv').config();

async function migrate() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('Connected to PostgreSQL database...');

  const ddl = `
    CREATE TABLE IF NOT EXISTS "Theme" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "color" TEXT NOT NULL DEFAULT '#3b82f6',
      "workspaceId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Theme_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Theme_name_workspaceId_key" UNIQUE ("name", "workspaceId")
    );

    CREATE TABLE IF NOT EXISTS "FeedbackTheme" (
      "id" TEXT PRIMARY KEY,
      "feedbackId" TEXT NOT NULL,
      "themeId" TEXT NOT NULL,
      "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "FeedbackTheme_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "Feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "FeedbackTheme_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "FeedbackTheme_feedbackId_themeId_key" UNIQUE ("feedbackId", "themeId")
    );

    CREATE TABLE IF NOT EXISTS "Embedding" (
      "id" TEXT PRIMARY KEY,
      "feedbackId" TEXT NOT NULL UNIQUE,
      "vector" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Embedding_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "Feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "Report" (
      "id" TEXT PRIMARY KEY,
      "title" TEXT NOT NULL,
      "periodStart" TIMESTAMP(3),
      "periodEnd" TIMESTAMP(3),
      "contentJson" TEXT NOT NULL,
      "workspaceId" TEXT NOT NULL,
      "generatedBy" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Report_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Report_generatedBy_fkey" FOREIGN KEY ("generatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
    );
  `;

  await client.query(ddl);
  console.log('Tables Theme, FeedbackTheme, Embedding, and Report created successfully.');
  await client.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
