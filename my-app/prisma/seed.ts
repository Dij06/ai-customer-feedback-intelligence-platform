import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { DEMO_WORKSPACES, DEMO_USERS, DEMO_THEMES, generateFullSeedDataset, getMatchingThemesForFeedback } from '../lib/seed-data'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding multi-tenant dataset (Themes, 125+ Feedbacks, Embeddings & Reports)...')

  // 1. Create / Upsert Workspaces
  const acmeWorkspace = await prisma.workspace.upsert({
    where: { slug: 'acme-corp' },
    update: { name: 'Acme Corp' },
    create: {
      name: 'Acme Corp',
      slug: 'acme-corp',
    },
  })

  const betaWorkspace = await prisma.workspace.upsert({
    where: { slug: 'beta-labs' },
    update: { name: 'Beta Labs' },
    create: {
      name: 'Beta Labs',
      slug: 'beta-labs',
    },
  })

  console.log(`Workspaces ready: Acme Corp (${acmeWorkspace.id}) & Beta Labs (${betaWorkspace.id})`)

  // 2. Create / Upsert Demo RBAC Users for Acme Corp
  const createdUsers: Record<string, string> = {}
  for (const u of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role },
      create: {
        email: u.email,
        name: u.name,
        role: u.role,
        clerkUserId: u.clerkUserId,
      },
    })
    createdUsers[u.role] = user.id

    // Ensure Workspace Membership
    await prisma.workspaceMember.upsert({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: acmeWorkspace.id,
        },
      },
      update: { role: u.role },
      create: {
        userId: user.id,
        workspaceId: acmeWorkspace.id,
        role: u.role,
      },
    })
  }

  console.log('RBAC Users configured: Admin, Analyst, and Viewer')

  // 3. Upsert Enterprise Themes for Acme Corp
  const themeMap: Record<string, string> = {}
  for (const theme of DEMO_THEMES) {
    const createdTheme = await prisma.theme.upsert({
      where: {
        name_workspaceId: {
          name: theme.name,
          workspaceId: acmeWorkspace.id,
        },
      },
      update: {
        description: theme.description,
        color: theme.color,
      },
      create: {
        name: theme.name,
        description: theme.description,
        color: theme.color,
        workspaceId: acmeWorkspace.id,
      },
    })
    themeMap[theme.name] = createdTheme.id
  }

  console.log(`${DEMO_THEMES.length} Themes configured for Acme Corp`)

  // 4. Clear existing feedback & join relations for Acme Corp
  await prisma.feedbackTheme.deleteMany({
    where: { feedback: { workspaceId: acmeWorkspace.id } },
  })
  await prisma.embedding.deleteMany({
    where: { feedback: { workspaceId: acmeWorkspace.id } },
  })
  await prisma.feedback.deleteMany({
    where: { workspaceId: acmeWorkspace.id },
  })

  // 5. Generate and Insert 125+ Seed Feedback items for Acme Corp
  const rawDataset = generateFullSeedDataset()
  const now = Date.now()

  for (let i = 0; i < rawDataset.length; i++) {
    const item = rawDataset[i]
    const createdDate = new Date(now - item.daysAgo * 24 * 60 * 60 * 1000)

    const createdFeedback = await prisma.feedback.create({
      data: {
        content: item.content,
        source: item.source,
        sentiment: item.sentiment,
        sentimentScore: item.sentimentScore,
        category: item.category,
        urgency: item.urgency,
        status: item.status,
        customerName: item.customerName,
        customerEmail: item.customerEmail,
        summary: item.summary,
        tags: item.tags,
        createdAt: createdDate,
        workspaceId: acmeWorkspace.id,
        userId: createdUsers['ADMIN'],
      },
    })

    // Assign themes to this feedback
    const matchedThemes = getMatchingThemesForFeedback(item.content, item.category)
    for (const match of matchedThemes) {
      const themeId = themeMap[match.themeName]
      if (themeId) {
        await prisma.feedbackTheme.create({
          data: {
            feedbackId: createdFeedback.id,
            themeId,
            confidence: match.confidence,
          },
        })
      }
    }

    // Generate simulated embedding representation (token frequency / keyword bag)
    const keywords = item.content.toLowerCase().split(/\W+/).filter((w) => w.length > 3)
    await prisma.embedding.create({
      data: {
        feedbackId: createdFeedback.id,
        vector: JSON.stringify(keywords),
      },
    })
  }

  console.log(`Successfully seeded ${rawDataset.length} feedback items with themes & embeddings for Acme Corp`)

  // 6. Pre-seed a sample Voice-of-Customer (VoC) Report
  await prisma.report.deleteMany({
    where: { workspaceId: acmeWorkspace.id },
  })

  const sampleReportContent = {
    title: 'Weekly Executive Voice-of-Customer Digest (Q3 - Week 36)',
    period: 'Last 30 Days',
    generatedAt: new Date().toISOString(),
    executiveSummary:
      'Overall customer sentiment remains moderately positive (+62% positive ratio). However, a notable surge in negative sentiment has been observed around Google SSO login timeouts and duplicate invoice processing on the enterprise tier. Recent dashboard speed improvements received universal acclaim.',
    stats: {
      totalFeedback: rawDataset.length,
      positiveCount: rawDataset.filter((f) => f.sentiment === 'Positive').length,
      neutralCount: rawDataset.filter((f) => f.sentiment === 'Neutral').length,
      negativeCount: rawDataset.filter((f) => f.sentiment === 'Negative').length,
      netSentimentScore: '+48%',
    },
    topThemes: [
      {
        theme: 'Onboarding & Workspace Setup',
        sentiment: 'Positive (84%)',
        count: 28,
        spikeIndicator: '+14% vs previous period',
        insight: 'Users praise the streamlined 2-step workspace switcher and team invite flow.',
      },
      {
        theme: 'Authentication & SSO',
        sentiment: 'Negative (78%)',
        count: 19,
        spikeIndicator: 'Surge Alert: +42% spike in complaints',
        insight: 'SAML timeout issues on corporate networks require immediate OAuth handler patch.',
      },
      {
        theme: 'Performance & Latency',
        sentiment: 'Positive (89%)',
        count: 24,
        spikeIndicator: 'Stable',
        insight: 'Next.js server-side pagination reduced feedback table load time by 60%.',
      },
      {
        theme: 'Billing & Invoicing',
        sentiment: 'Negative (65%)',
        count: 16,
        spikeIndicator: '+8% vs previous period',
        insight: 'Duplicate invoice line items triggered refund requests on annual plans.',
      },
    ],
    notableQuotes: [
      {
        quote: 'The new dashboard is gorgeous and finally fast. Huge improvement over last month!',
        author: 'Elena Rostova (TechFlow)',
        sentiment: 'Positive',
      },
      {
        quote: 'Cannot login via Google SSO after the update. Our entire engineering team is blocked.',
        author: 'Marcus Vance (Acme Global)',
        sentiment: 'Negative',
      },
      {
        quote: 'We were charged twice on invoice #99281. Please resolve immediately.',
        author: 'Arjun Mehta (CloudScale)',
        sentiment: 'Negative',
      },
    ],
    recommendedActions: [
      {
        priority: 'P0 - Blocker',
        action: 'Hotfix SAML/SSO token exchange timeout in auth route handler.',
        owner: 'Engineering Team',
      },
      {
        priority: 'P1 - High',
        action: 'Audit Stripe webhook idempotency for enterprise invoice generation.',
        owner: 'Billing & Payments Team',
      },
      {
        priority: 'P2 - Medium',
        action: 'Promote self-serve CSV template download directly within the onboarding modal.',
        owner: 'Product / Growth',
      },
    ],
  }

  await prisma.report.create({
    data: {
      title: 'Weekly Executive Voice-of-Customer Digest (Q3 - Week 36)',
      periodStart: new Date(now - 30 * 24 * 60 * 60 * 1000),
      periodEnd: new Date(now),
      contentJson: JSON.stringify(sampleReportContent),
      workspaceId: acmeWorkspace.id,
      generatedBy: createdUsers['ADMIN'],
    },
  })

  console.log('Sample Executive VoC Report seeded.')

  // 7. Seed 3 isolated records for Beta Labs (to demonstrate tenant isolation)
  await prisma.feedback.deleteMany({
    where: { workspaceId: betaWorkspace.id },
  })

  await prisma.feedback.createMany({
    data: [
      {
        content: 'Beta Labs isolated customer feedback: Testing quantum neural network pipeline.',
        source: 'Email',
        sentiment: 'Positive',
        sentimentScore: 0.85,
        category: 'Performance',
        urgency: 'Low',
        status: 'NEW',
        customerName: 'Beta Client',
        customerEmail: 'client@betalabs.internal',
        summary: 'Quantum pipeline testing feedback.',
        tags: ['beta-labs', 'isolated-tenant'],
        workspaceId: betaWorkspace.id,
      },
    ],
  })

  console.log('Beta Labs tenant isolation feedback seeded.')
  console.log('Seeding completed successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })