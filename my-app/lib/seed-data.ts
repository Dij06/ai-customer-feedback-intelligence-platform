export interface SeedFeedbackItem {
  content: string;
  source: 'Support Ticket' | 'App Store Review' | 'NPS Survey' | 'Sales Call Note' | 'Community Post' | 'Email' | 'Discord' | 'Twitter' | 'Web Form' | 'Survey';
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  sentimentScore: number;
  category: 'Performance' | 'Bug' | 'Feature Request' | 'UI/UX' | 'Billing' | 'Support' | 'General';
  urgency: 'High' | 'Medium' | 'Low';
  status: 'NEW' | 'REVIEWED' | 'ACTIONED';
  customerName: string;
  customerEmail: string;
  summary: string;
  tags: string[];
  daysAgo: number;
}

export const DEMO_WORKSPACES = [
  {
    name: 'Acme Corp',
    slug: 'acme-corp',
  },
  {
    name: 'Beta Labs',
    slug: 'beta-labs',
  },
];

export const DEMO_USERS = [
  {
    email: 'admin@acme.com',
    name: 'Admin User',
    role: 'ADMIN' as const,
    clerkUserId: 'demo-admin-acme',
  },
  {
    email: 'analyst@acme.com',
    name: 'Analyst User',
    role: 'ANALYST' as const,
    clerkUserId: 'demo-analyst-acme',
  },
  {
    email: 'viewer@acme.com',
    name: 'Viewer User',
    role: 'VIEWER' as const,
    clerkUserId: 'demo-viewer-acme',
  },
];

export const SEED_FEEDBACK_DATA: SeedFeedbackItem[] = [
  // Critical bugs & billing
  {
    content: 'CRITICAL: The production database export crashed during our quarterly compliance audit and returned a 500 internal server error!',
    source: 'Support Ticket',
    sentiment: 'Negative',
    sentimentScore: -0.92,
    category: 'Bug',
    urgency: 'High',
    status: 'NEW',
    customerName: 'Marcus Vance',
    customerEmail: 'mvance@acme-global.com',
    summary: 'Database export fails with 500 error during compliance audit.',
    tags: ['export', '500-error', 'critical', 'compliance'],
    daysAgo: 1,
  },
  {
    content: 'We were charged twice on invoice #99281 for our enterprise tier upgrade. Please issue a refund immediately!',
    source: 'Email',
    sentiment: 'Negative',
    sentimentScore: -0.88,
    category: 'Billing',
    urgency: 'High',
    status: 'NEW',
    customerName: 'Elena Rostova',
    customerEmail: 'elena.r@enterprise.org',
    summary: 'Duplicate charge on invoice #99281 requiring immediate refund.',
    tags: ['billing', 'duplicate-charge', 'refund', 'invoice'],
    daysAgo: 2,
  },
  {
    content: 'Cannot login via Google SSO after the latest platform update. Our entire engineering team of 40 is blocked.',
    source: 'Discord',
    sentiment: 'Negative',
    sentimentScore: -0.95,
    category: 'Bug',
    urgency: 'High',
    status: 'NEW',
    customerName: 'Arjun Mehta',
    customerEmail: 'arjun@techflow.io',
    summary: 'Google SSO authentication broken across engineering team.',
    tags: ['auth', 'sso', 'blocker', 'google-login'],
    daysAgo: 2,
  },
  {
    content: 'Subscription downgraded unexpectedly even though our credit card transaction succeeded on Stripe.',
    source: 'Support Ticket',
    sentiment: 'Negative',
    sentimentScore: -0.85,
    category: 'Billing',
    urgency: 'High',
    status: 'REVIEWED',
    customerName: 'David Chen',
    customerEmail: 'david.chen@finlabs.co',
    summary: 'Unexpected subscription downgrade despite successful Stripe transaction.',
    tags: ['billing', 'stripe', 'subscription', 'downgrade'],
    daysAgo: 3,
  },
  {
    content: 'Password reset link in the email expires in 30 seconds, making it impossible to reset credentials.',
    source: 'Support Ticket',
    sentiment: 'Negative',
    sentimentScore: -0.78,
    category: 'Bug',
    urgency: 'High',
    status: 'ACTIONED',
    customerName: 'Sophie Dubois',
    customerEmail: 'sophie@nexuscrowd.fr',
    summary: 'Password reset token expiration time too short.',
    tags: ['auth', 'password-reset', 'security'],
    daysAgo: 5,
  },

  // Performance and speed
  {
    content: 'Dashboard latency spikes up to 6.2 seconds during peak morning hours (9am-11am EST). Need query caching.',
    source: 'Email',
    sentiment: 'Negative',
    sentimentScore: -0.72,
    category: 'Performance',
    urgency: 'Medium',
    status: 'NEW',
    customerName: 'Liam O’Connor',
    customerEmail: 'liam@fintechlabs.com',
    summary: 'Severe dashboard latency spikes during peak morning hours.',
    tags: ['performance', 'latency', 'caching', 'dashboard'],
    daysAgo: 4,
  },
  {
    content: 'The CSV upload of 5,000 rows freezes the browser tab completely on Chrome macOS.',
    source: 'Community Post',
    sentiment: 'Negative',
    sentimentScore: -0.68,
    category: 'Performance',
    urgency: 'Medium',
    status: 'REVIEWED',
    customerName: 'Rachel Green',
    customerEmail: 'rachel@fashionhub.com',
    summary: 'Bulk CSV upload freezes browser tab for large files.',
    tags: ['csv', 'performance', 'browser-freeze', 'upload'],
    daysAgo: 6,
  },
  {
    content: 'Search bar has noticeable 500ms lag when typing quickly in the feedback inbox.',
    source: 'App Store Review',
    sentiment: 'Neutral',
    sentimentScore: -0.20,
    category: 'Performance',
    urgency: 'Low',
    status: 'NEW',
    customerName: 'Tariq Al-Mansoor',
    customerEmail: 'tariq@cloudsync.ae',
    summary: 'Search input keystroke debounce lag in inbox.',
    tags: ['search', 'debounce', 'speed'],
    daysAgo: 7,
  },
  {
    content: 'Reports generation takes over 45 seconds when filtering over a 90-day time window.',
    source: 'Support Ticket',
    sentiment: 'Negative',
    sentimentScore: -0.60,
    category: 'Performance',
    urgency: 'Medium',
    status: 'NEW',
    customerName: 'Hannah Abbott',
    customerEmail: 'hannah@quantedge.com',
    summary: 'Long latency when generating 90-day executive reports.',
    tags: ['reports', 'latency', 'sql-optimization'],
    daysAgo: 8,
  },

  // Positive reviews
  {
    content: 'The new AI auto-classification engine saved our CX team over 15 hours of manual triage this week alone! Truly outstanding update.',
    source: 'Twitter',
    sentiment: 'Positive',
    sentimentScore: 0.94,
    category: 'Feature Request',
    urgency: 'Low',
    status: 'ACTIONED',
    customerName: 'Sarah Jenkins',
    customerEmail: 'sarah.j@techcorp.io',
    summary: 'AI auto-classification saved CX team 15+ hours weekly.',
    tags: ['ai-classification', 'cx-productivity', 'satisfaction'],
    daysAgo: 1,
  },
  {
    content: 'Dark mode UI is sleek, modern, and easy on the eyes during late night monitoring shifts. Best SaaS interface we have used.',
    source: 'Twitter',
    sentiment: 'Positive',
    sentimentScore: 0.91,
    category: 'UI/UX',
    urgency: 'Low',
    status: 'ACTIONED',
    customerName: 'Jordan Taylor',
    customerEmail: 'jtaylor@designcraft.com',
    summary: 'Dark mode UI praised for aesthetics and late-night usability.',
    tags: ['dark-mode', 'ui', 'design'],
    daysAgo: 3,
  },
  {
    content: 'Customer support specialist Kevin resolved our webhook configuration issue in under 4 minutes. Phenomenal service!',
    source: 'Survey',
    sentiment: 'Positive',
    sentimentScore: 0.96,
    category: 'Support',
    urgency: 'Low',
    status: 'ACTIONED',
    customerName: 'Priya Patel',
    customerEmail: 'priya@cloudscale.net',
    summary: 'Rapid resolution of webhook configuration issue by support.',
    tags: ['customer-support', 'webhook', 'quick-resolution'],
    daysAgo: 4,
  },
  {
    content: 'The CSV import with live preview is seamless. We imported 1,200 survey responses without a hitch.',
    source: 'Community Post',
    sentiment: 'Positive',
    sentimentScore: 0.88,
    category: 'Feature Request',
    urgency: 'Low',
    status: 'REVIEWED',
    customerName: 'Carlos Mendoza',
    customerEmail: 'cmendoza@growthpulse.mx',
    summary: 'CSV bulk importer works flawlessly with live preview.',
    tags: ['csv', 'bulk-import', 'data-pipeline'],
    daysAgo: 5,
  },
  {
    content: 'Real-time sentiment breakdown charts gave our VP of Product instant clarity on our latest release health.',
    source: 'Sales Call Note',
    sentiment: 'Positive',
    sentimentScore: 0.87,
    category: 'UI/UX',
    urgency: 'Low',
    status: 'ACTIONED',
    customerName: 'Victoria Sterling',
    customerEmail: 'vsterling@apexholdings.com',
    summary: 'Executive sentiment charts provided instant release clarity.',
    tags: ['analytics', 'charts', 'executive-reporting'],
    daysAgo: 7,
  },
  {
    content: 'Switching from spreadsheets to LOOP has been a night-and-day transformation for our product roadmap prioritization.',
    source: 'Twitter',
    sentiment: 'Positive',
    sentimentScore: 0.92,
    category: 'General',
    urgency: 'Low',
    status: 'ACTIONED',
    customerName: 'Alex Rivera',
    customerEmail: 'alex@startup.co',
    summary: 'Platform transformed product roadmap prioritization.',
    tags: ['transformation', 'product-management', 'roadmap'],
    daysAgo: 8,
  },

  // Feature requests
  {
    content: 'Would love native Slack integration to post high-urgency customer complaints directly into an #alerts channel.',
    source: 'Discord',
    sentiment: 'Neutral',
    sentimentScore: 0.15,
    category: 'Feature Request',
    urgency: 'Medium',
    status: 'NEW',
    customerName: 'Zack Morris',
    customerEmail: 'zack@growthmatrix.com',
    summary: 'Request for Slack webhook integration for high urgency alerts.',
    tags: ['slack', 'webhooks', 'alerts', 'integration'],
    daysAgo: 2,
  },
  {
    content: 'Please add automated PDF export for the weekly Voice of Customer executive reports so we can attach them to board slide decks.',
    source: 'Sales Call Note',
    sentiment: 'Neutral',
    sentimentScore: 0.10,
    category: 'Feature Request',
    urgency: 'Medium',
    status: 'NEW',
    customerName: 'Evelyn Reed',
    customerEmail: 'ereed@venturecap.org',
    summary: 'Request for automated PDF export of weekly VoC reports.',
    tags: ['pdf-export', 'reports', 'executive'],
    daysAgo: 4,
  },
  {
    content: 'Can you support custom tagging taxonomies so our enterprise tags automatically map to Jira issue labels?',
    source: 'Support Ticket',
    sentiment: 'Neutral',
    sentimentScore: 0.05,
    category: 'Feature Request',
    urgency: 'Low',
    status: 'REVIEWED',
    customerName: 'Dmitri Volkov',
    customerEmail: 'dmitri@nordictech.se',
    summary: 'Request for Jira label synchronization with custom tags.',
    tags: ['jira', 'taxonomy', 'integration'],
    daysAgo: 6,
  },
  {
    content: 'We need multi-factor authentication (MFA/TOTP) enforcement for all workspace users to meet SOC2 requirements.',
    source: 'Email',
    sentiment: 'Neutral',
    sentimentScore: 0.0,
    category: 'Feature Request',
    urgency: 'Medium',
    status: 'NEW',
    customerName: 'Samantha Ray',
    customerEmail: 'sray@cyberdefense.io',
    summary: 'Request for workspace-wide mandatory MFA enforcement.',
    tags: ['security', 'mfa', 'compliance', 'soc2'],
    daysAgo: 9,
  },
  {
    content: 'A public feedback portal widget we can embed in our Next.js client app would be a game changer.',
    source: 'Discord',
    sentiment: 'Positive',
    sentimentScore: 0.75,
    category: 'Feature Request',
    urgency: 'Low',
    status: 'NEW',
    customerName: 'Kenji Sato',
    customerEmail: 'kenji@tokyosync.jp',
    summary: 'Request for embeddable customer feedback widget.',
    tags: ['widget', 'embed', 'sdk'],
    daysAgo: 10,
  },

  // UI and UX feedback
  {
    content: 'Mobile responsive drawer on iPhone 15 cuts off the sentiment confidence score badge when opened in landscape mode.',
    source: 'App Store Review',
    sentiment: 'Negative',
    sentimentScore: -0.55,
    category: 'UI/UX',
    urgency: 'Low',
    status: 'REVIEWED',
    customerName: 'Chloe Bennett',
    customerEmail: 'chloe.b@mobiledevs.com',
    summary: 'Mobile drawer badge clipping in landscape orientation.',
    tags: ['mobile', 'responsive', 'ui-bug'],
    daysAgo: 5,
  },
  {
    content: 'The contrast of disabled buttons on the bulk upload page is too low for WCAG AA compliance.',
    source: 'Community Post',
    sentiment: 'Neutral',
    sentimentScore: -0.12,
    category: 'UI/UX',
    urgency: 'Low',
    status: 'NEW',
    customerName: 'Oliver Smith',
    customerEmail: 'oliver@accessforall.org',
    summary: 'Disabled button color contrast low for accessibility compliance.',
    tags: ['accessibility', 'wcag', 'contrast', 'ui'],
    daysAgo: 7,
  },
  {
    content: 'Pagination controls on the feedback inbox should show the total count of filtered records alongside page numbers.',
    source: 'Web Form',
    sentiment: 'Neutral',
    sentimentScore: 0.05,
    category: 'UI/UX',
    urgency: 'Low',
    status: 'ACTIONED',
    customerName: 'Lucas Gray',
    customerEmail: 'lgray@analyticshive.com',
    summary: 'Display total count of filtered items on pagination controls.',
    tags: ['pagination', 'inbox', 'ux'],
    daysAgo: 11,
  },
  {
    content: 'Hover state on the volume velocity SVG line chart is silky smooth and informative.',
    source: 'Twitter',
    sentiment: 'Positive',
    sentimentScore: 0.85,
    category: 'UI/UX',
    urgency: 'Low',
    status: 'ACTIONED',
    customerName: 'Maya Lin',
    customerEmail: 'maya@visualdata.studio',
    summary: 'Praise for smooth hover interactions on volume chart.',
    tags: ['charts', 'svg', 'hover-interactions'],
    daysAgo: 12,
  },

  // Billing and subscription
  {
    content: 'Annual billing invoice does not display our EU VAT number despite entering it in the organization profile.',
    source: 'Support Ticket',
    sentiment: 'Negative',
    sentimentScore: -0.65,
    category: 'Billing',
    urgency: 'Medium',
    status: 'REVIEWED',
    customerName: 'Jan Kowalski',
    customerEmail: 'jan@warsawlogistics.pl',
    summary: 'EU VAT number missing from generated billing invoices.',
    tags: ['billing', 'vat', 'invoice', 'europe'],
    daysAgo: 8,
  },
  {
    content: 'Pricing tier jump from Starter (500 items) to Pro (10,000 items) is too steep for early stage startups. Need an intermediate tier.',
    source: 'Sales Call Note',
    sentiment: 'Neutral',
    sentimentScore: -0.15,
    category: 'Billing',
    urgency: 'Low',
    status: 'NEW',
    customerName: 'Ethan Wright',
    customerEmail: 'ethan@bootstrapped.dev',
    summary: 'Feedback regarding steep pricing tier gap between Starter and Pro.',
    tags: ['pricing', 'tiers', 'packaging'],
    daysAgo: 14,
  },
  {
    content: 'Need support for ACH bank transfer payments for invoices exceeding $5,000 USD annually.',
    source: 'Email',
    sentiment: 'Neutral',
    sentimentScore: 0.0,
    category: 'Billing',
    urgency: 'Low',
    status: 'NEW',
    customerName: 'Barbara Hayes',
    customerEmail: 'bhayes@midwestmfg.com',
    summary: 'Request for ACH payment method on enterprise invoices.',
    tags: ['billing', 'ach', 'enterprise-payments'],
    daysAgo: 16,
  },

  // General feedback and NPS surveys
  {
    content: 'NPS Score 10/10: Reliable platform that does exactly what it promises without bloat.',
    source: 'NPS Survey',
    sentiment: 'Positive',
    sentimentScore: 0.98,
    category: 'General',
    urgency: 'Low',
    status: 'ACTIONED',
    customerName: 'Gabriel Santos',
    customerEmail: 'gsantos@saasventure.br',
    summary: 'Perfect 10/10 NPS rating and positive endorsement.',
    tags: ['nps-10', 'promoter', 'general'],
    daysAgo: 3,
  },
  {
    content: 'NPS Score 7/10: Product is good, but would like to see faster release cycles on the AI trend detection features.',
    source: 'NPS Survey',
    sentiment: 'Neutral',
    sentimentScore: 0.0,
    category: 'General',
    urgency: 'Low',
    status: 'REVIEWED',
    customerName: 'Freja Nielsen',
    customerEmail: 'freja@nordicpay.dk',
    summary: 'Passive NPS rating requesting faster feature cadence on trends.',
    tags: ['nps-7', 'passive', 'feature-velocity'],
    daysAgo: 13,
  },
  {
    content: 'NPS Score 3/10: Too many timeout errors during data sync operations with external endpoints.',
    source: 'NPS Survey',
    sentiment: 'Negative',
    sentimentScore: -0.80,
    category: 'Bug',
    urgency: 'High',
    status: 'NEW',
    customerName: 'Simon Baker',
    customerEmail: 'sbaker@retailstream.uk',
    summary: 'Detractor NPS score citing frequent data sync timeouts.',
    tags: ['nps-3', 'detractor', 'sync-timeout'],
    daysAgo: 4,
  },

  // Additional feedback items
  {
    content: 'Webhook payload delivery failed with TLS handshake error after server certificate renewal.',
    source: 'Discord',
    sentiment: 'Negative',
    sentimentScore: -0.75,
    category: 'Bug',
    urgency: 'High',
    status: 'NEW',
    customerName: 'Devon Miles',
    customerEmail: 'dmiles@infraops.co',
    summary: 'TLS handshake failure on webhook delivery post-certificate update.',
    tags: ['webhook', 'tls', 'security', 'bug'],
    daysAgo: 1,
  },
  {
    content: 'The Ask LOOP retrieval query accurately identified customer pain points from last month without making up data!',
    source: 'Twitter',
    sentiment: 'Positive',
    sentimentScore: 0.93,
    category: 'Feature Request',
    urgency: 'Low',
    status: 'ACTIONED',
    customerName: 'Natasha Roman',
    customerEmail: 'nroman@avengerstech.io',
    summary: 'Ask LOOP retrieval praised for grounding and accuracy.',
    tags: ['ask-loop', 'rag', 'grounding'],
    daysAgo: 2,
  },
  {
    content: 'Filter by date range is missing custom date picker (only has preset 7d, 30d, 90d buttons).',
    source: 'Web Form',
    sentiment: 'Neutral',
    sentimentScore: -0.05,
    category: 'UI/UX',
    urgency: 'Low',
    status: 'REVIEWED',
    customerName: 'Arthur Dent',
    customerEmail: 'adent@hitchhiker.co.uk',
    summary: 'Request for custom calendar date range picker.',
    tags: ['filter', 'date-picker', 'ux'],
    daysAgo: 6,
  },
  {
    content: 'Customer on sales demo asked if feedback can be ingested via direct email forwarding address.',
    source: 'Sales Call Note',
    sentiment: 'Neutral',
    sentimentScore: 0.10,
    category: 'Feature Request',
    urgency: 'Low',
    status: 'NEW',
    customerName: 'Gillian Welch',
    customerEmail: 'gwelch@enterpriseleads.com',
    summary: 'Prospect inquired about email forwarding ingestion channel.',
    tags: ['sales-prospect', 'email-ingestion', 'channel'],
    daysAgo: 9,
  },
  {
    content: 'Documentation on role permissions (Admin vs Analyst vs Viewer) is crystal clear and helpful.',
    source: 'Community Post',
    sentiment: 'Positive',
    sentimentScore: 0.89,
    category: 'Support',
    urgency: 'Low',
    status: 'ACTIONED',
    customerName: 'Hugo Boss',
    customerEmail: 'hugo@fashiontech.de',
    summary: 'Positive feedback regarding RBAC documentation clarity.',
    tags: ['rbac', 'documentation', 'clarity'],
    daysAgo: 15,
  },
  {
    content: 'The triage status filter does not persist when navigating back from the detail drawer.',
    source: 'Support Ticket',
    sentiment: 'Negative',
    sentimentScore: -0.45,
    category: 'UI/UX',
    urgency: 'Medium',
    status: 'NEW',
    customerName: 'Leila Farhadi',
    customerEmail: 'leila@persiangrid.ir',
    summary: 'Inbox filter state resets when closing detail drawer.',
    tags: ['inbox', 'filter-persistence', 'state-management'],
    daysAgo: 11,
  },
  {
    content: 'Response times from the API endpoints remain sub-50ms under heavy concurrent test load. Very solid backend architecture.',
    source: 'Community Post',
    sentiment: 'Positive',
    sentimentScore: 0.91,
    category: 'Performance',
    urgency: 'Low',
    status: 'ACTIONED',
    customerName: 'Ravi Shankar',
    customerEmail: 'ravi@bangaloredevs.in',
    summary: 'Sub-50ms backend response times praised under high load.',
    tags: ['performance', 'benchmarks', 'backend'],
    daysAgo: 18,
  },
  {
    content: 'Search query containing special characters like ampersand throws an unhandled server error.',
    source: 'Support Ticket',
    sentiment: 'Negative',
    sentimentScore: -0.70,
    category: 'Bug',
    urgency: 'High',
    status: 'REVIEWED',
    customerName: 'Fiona Gallagher',
    customerEmail: 'fiona@chicagoops.com',
    summary: 'Unhandled server error when searching special characters.',
    tags: ['search', 'sql-injection-safety', 'bug'],
    daysAgo: 12,
  },
  {
    content: 'Would appreciate a light mode toggle option for users working in bright outdoor daylight environments.',
    source: 'App Store Review',
    sentiment: 'Neutral',
    sentimentScore: 0.0,
    category: 'UI/UX',
    urgency: 'Low',
    status: 'NEW',
    customerName: 'Timothee Chalamet',
    customerEmail: 'timothee@dunevision.com',
    summary: 'Request for optional light theme toggle for high glare settings.',
    tags: ['theme', 'light-mode', 'ui'],
    daysAgo: 20,
  },
  {
    content: 'Reclassifying feedback items with AI updates the tags and urgency instantly without page reload. Great UX.',
    source: 'Twitter',
    sentiment: 'Positive',
    sentimentScore: 0.88,
    category: 'Feature Request',
    urgency: 'Low',
    status: 'ACTIONED',
    customerName: 'Beatriz Gomez',
    customerEmail: 'beatriz@madridtech.es',
    summary: 'Seamless optimistic UI on AI reclassification praised.',
    tags: ['reclassify', 'optimistic-ui', 'ux'],
    daysAgo: 16,
  }
];

// Generates full dataset across dates and channels
export function generateFullSeedDataset(): SeedFeedbackItem[] {
  const fullList: SeedFeedbackItem[] = [...SEED_FEEDBACK_DATA];
  
  const additionalTemplates = [
    {
      contentTemplate: (topic: string, issue: string) => `Encountered unexpected timeout when querying ${topic}. Error log indicates ${issue}.`,
      sentiment: 'Negative' as const,
      sentimentScore: -0.65,
      category: 'Performance' as const,
      urgency: 'Medium' as const,
      source: 'Support Ticket' as const,
      tag: 'latency',
    },
    {
      contentTemplate: (topic: string, benefit: string) => `The ${topic} feature has drastically improved our team workflow. ${benefit}`,
      sentiment: 'Positive' as const,
      sentimentScore: 0.88,
      category: 'Feature Request' as const,
      urgency: 'Low' as const,
      source: 'Twitter' as const,
      tag: 'enhancement',
    },
    {
      contentTemplate: (topic: string, defect: string) => `Bug report: ${topic} button remains unresponsive after ${defect}.`,
      sentiment: 'Negative' as const,
      sentimentScore: -0.72,
      category: 'Bug' as const,
      urgency: 'High' as const,
      source: 'Discord' as const,
      tag: 'defect',
    },
    {
      contentTemplate: (topic: string) => `Customer during QBR asked for expanded documentation and video walkthroughs on ${topic}.`,
      sentiment: 'Neutral' as const,
      sentimentScore: 0.05,
      category: 'Support' as const,
      urgency: 'Low' as const,
      source: 'Sales Call Note' as const,
      tag: 'documentation',
    },
    {
      contentTemplate: (topic: string) => `NPS Rating 9/10: Excellent software stability and clean dark aesthetics around ${topic}.`,
      sentiment: 'Positive' as const,
      sentimentScore: 0.92,
      category: 'UI/UX' as const,
      urgency: 'Low' as const,
      source: 'NPS Survey' as const,
      tag: 'nps-promoter',
    },
    {
      contentTemplate: (topic: string) => `Billing query: Can we get automated quarterly tax summary receipts for ${topic}?`,
      sentiment: 'Neutral' as const,
      sentimentScore: 0.0,
      category: 'Billing' as const,
      urgency: 'Low' as const,
      source: 'Email' as const,
      tag: 'tax-receipts',
    },
  ];

  const topics = [
    { name: 'Analytics Dashboard', benefit: 'Gives instant visibility to executives.', issue: 'database connection pool exhaustion', defect: 'clicking filter tag' },
    { name: 'CSV Importer', benefit: 'Parsed 2,000 survey rows cleanly.', issue: 'memory limit exceeded on large file stream', defect: 'drag and drop zone release' },
    { name: 'Ask LOOP Semantic Search', benefit: 'Found verbatim customer quotes in seconds.', issue: 'vector query latency spike', defect: 'submitting empty prompt' },
    { name: 'Voice-of-Customer Digest', benefit: 'Replaced 3 hours of manual slide deck preparation.', issue: 'PDF render timeout on heavy tables', defect: 'clicking generate digest' },
    { name: 'Real-time Triage Queue', benefit: 'Ensured zero critical bugs went unattended.', issue: 'websocket reconnect backoff', defect: 'updating status inline' },
    { name: 'Theme Clustering Trends', benefit: 'Flagged 80% spike in login complaints early.', issue: 'clustering algorithm time window aggregation', defect: 'drilling down to theme' },
    { name: 'Mobile Responsive View', benefit: 'Great for on-call engineers checking alerts.', issue: 'CSS viewport height calculation on iOS Safari', defect: 'opening modal overlay' },
    { name: 'Multi-Tenant RBAC', benefit: 'Strict role separation between Admin, Analyst, and Viewer.', issue: 'session token validation latency', defect: 'role switch dropdown' },
    { name: 'Feedback API Endpoints', benefit: 'Clean JSON responses with proper HTTP status codes.', issue: 'rate limiting threshold reached on bulk query', defect: 'sending unescaped URI params' },
    { name: 'Webhook Alert Notifications', benefit: 'Instantly alerted our Slack on-call channel.', issue: 'TLS handshake timeout with client endpoint', defect: 'triggering automated test payload' },
  ];

  const names = [
    'Alexander Wright', 'Beatrice Thorne', 'Caleb Montgomery', 'Danielle Silva', 'Eric Johansson',
    'Fatima Al-Hassan', 'George Papadopoulos', 'Hanna Lindstrom', 'Isaac Newton', 'Julia Roberts',
    'Kofi Mensah', 'Laura Croft', 'Mateo Rossi', 'Nadia Petrov', 'Oscar Wilde',
    'Penelope Cruz', 'Quentin Tarantino', 'Rohan Sharma', 'Sonia Gandhi', 'Tom Hanks',
    'Ursula Le Guin', 'Victor Hugo', 'Wendy Darling', 'Xavier Hernandez', 'Yara Shahidi', 'Zoe Kravitz'
  ];

  for (let i = 0; i < 90; i++) {
    const template = additionalTemplates[i % additionalTemplates.length];
    const topic = topics[i % topics.length];
    const customer = names[i % names.length];
    const email = `${customer.toLowerCase().replace(/\s+/g, '.')}${i}@${i % 2 === 0 ? 'acme-corp.com' : 'enterprise-partner.io'}`;
    const daysAgo = (i % 40) + 1;

    let content = '';
    if (template.sentiment === 'Negative' && template.category === 'Performance') {
      content = template.contentTemplate(topic.name, topic.issue);
    } else if (template.sentiment === 'Positive') {
      content = template.contentTemplate(topic.name, topic.benefit);
    } else if (template.sentiment === 'Negative' && template.category === 'Bug') {
      content = template.contentTemplate(topic.name, topic.defect);
    } else {
      content = template.contentTemplate(topic.name);
    }

    fullList.push({
      content,
      source: template.source,
      sentiment: template.sentiment,
      sentimentScore: template.sentimentScore,
      category: template.category,
      urgency: template.urgency,
      status: (i % 3 === 0 ? 'ACTIONED' : i % 3 === 1 ? 'REVIEWED' : 'NEW'),
      customerName: customer,
      customerEmail: email,
      summary: content.slice(0, 80) + '...',
      tags: [template.tag, topic.name.toLowerCase().split(' ')[0]],
      daysAgo,
    });
  }

  return fullList;
}

export interface DemoTheme {
  name: string;
  description: string;
  color: string;
  keywords: string[];
}

export const DEMO_THEMES: DemoTheme[] = [
  {
    name: 'Onboarding & Workspace Setup',
    description: 'Feedback related to team invitation, workspace creation, and initial setup UX.',
    color: '#6366f1', // Indigo
    keywords: ['onboarding', 'invite', 'workspace', 'setup', 'tutorial', 'team', 'sign up', 'member'],
  },
  {
    name: 'Billing & Invoicing',
    description: 'Inquiries and issues concerning subscription charges, invoices, Stripe, and refunds.',
    color: '#ec4899', // Pink
    keywords: ['billing', 'invoice', 'charge', 'refund', 'subscription', 'price', 'stripe', 'tier', 'payment'],
  },
  {
    name: 'Performance & Latency',
    description: 'Platform loading speed, API latency, page responsiveness, and UI freeze complaints.',
    color: '#f59e0b', // Amber
    keywords: ['slow', 'speed', 'latency', 'loading', 'freeze', 'lag', 'fast', 'quick', 'timeout', 'performance'],
  },
  {
    name: 'Authentication & SSO',
    description: 'SAML/SSO integration, Google OAuth, password resets, and session management.',
    color: '#8b5cf6', // Violet
    keywords: ['sso', 'saml', 'google', 'login', 'auth', 'password', 'session', 'blocked', 'access'],
  },
  {
    name: 'Export & Reporting',
    description: 'Data exports (CSV, PDF), analytics charts, scheduled reports, and download issues.',
    color: '#10b981', // Emerald
    keywords: ['export', 'csv', 'pdf', 'report', 'chart', 'analytics', 'download', 'compliance', 'dataset'],
  },
  {
    name: 'Mobile Experience & UI',
    description: 'Mobile responsiveness, dark mode rendering, layout bugs, and navigation ease.',
    color: '#06b6d4', // Cyan
    keywords: ['mobile', 'dark mode', 'responsive', 'ui', 'ux', 'button', 'layout', 'design', 'view', 'phone'],
  },
  {
    name: 'Search & Filtering',
    description: 'Full-text query accuracy, inbox filtering, pagination speed, and search indexing.',
    color: '#3b82f6', // Blue
    keywords: ['search', 'filter', 'inbox', 'query', 'pagination', 'find', 'sort', 'indexing'],
  },
  {
    name: 'Integrations & Webhooks',
    description: 'Third-party integrations, webhook delivery, Slack bots, and API reliability.',
    color: '#14b8a6', // Teal
    keywords: ['webhook', 'integration', 'slack', 'api', 'payload', 'rate limit', 'endpoint', 'sync'],
  },
];

export function getMatchingThemesForFeedback(content: string, category?: string): { themeName: string; confidence: number }[] {
  const text = content.toLowerCase();
  const matched: { themeName: string; confidence: number }[] = [];

  for (const theme of DEMO_THEMES) {
    let hits = 0;
    for (const kw of theme.keywords) {
      if (text.includes(kw.toLowerCase())) {
        hits++;
      }
    }
    if (category && theme.name.toLowerCase().includes(category.toLowerCase())) {
      hits += 2;
    }
    if (hits > 0) {
      const confidence = Math.min(0.99, Number((0.55 + hits * 0.15).toFixed(2)));
      matched.push({ themeName: theme.name, confidence });
    }
  }

  if (matched.length === 0) {
    matched.push({ themeName: 'Onboarding & Workspace Setup', confidence: 0.65 });
  }

  return matched.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}

