import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding realistic database feedback...");

  // Workspace setup
  const workspace = await prisma.workspace.upsert({
    where: { slug: "acme-corp" },
    update: {},
    create: {
      name: "Acme SaaS Corp",
      slug: "acme-corp",
    },
  });

  // 2. User setup (required for foreign key constraint on Feedback)
  const user = await prisma.user.upsert({
    where: { email: "seed.user@acme.corp" },
    update: {},
    create: {
      clerkUserId: "seed_user_acme_123",
      email: "seed.user@acme.corp",
      name: "Seed Admin User",
      role: "ADMIN",
    },
  });

  const sampleFeedbacks = [
    {
      content: "The dashboard loading time takes more than 10 seconds. Fix this issue immediately!",
      sentiment: "NEGATIVE",
      category: "Performance",
      urgency: true,
      source: "IN-APP",
    },
    {
      content: "Love the new CSV export feature! It saved our team hours of manual export work.",
      sentiment: "POSITIVE",
      category: "Feature Request",
      urgency: false,
      source: "CSV",
    },
    {
      content: "Billing page threw a 500 internal server error when upgrading to the Pro plan.",
      sentiment: "NEGATIVE",
      category: "Bug",
      urgency: true,
      source: "EMAIL",
    },
    {
      content: "Please add dark mode support across all analytics pages.",
      sentiment: "NEUTRAL",
      category: "UI/UX",
      urgency: false,
      source: "IN-APP",
    },
  ];

  for (const item of sampleFeedbacks) {
    await prisma.feedback.create({
      data: {
        content: item.content,
        text: item.content,
        sentiment: item.sentiment,
        category: item.category,
        urgency: item.urgency,
        source: item.source,
        userId: user.id,
        workspaceId: workspace.id,
      },
    });
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });