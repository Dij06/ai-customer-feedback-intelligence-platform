# Project LOOP — AI Customer Feedback Platform

> An application that collects multi-channel customer feedback, uses AI to classify and group it into topics, detects complaint surges, answers questions grounded in actual customer reviews, and creates executive summary reports with PDF export.

---

## Features

### Core Application Architecture
- **Multi-Tenant Workspaces & Data Isolation:** All database queries are filtered by the active user's workspace ID so different workspaces never share data.
- **Role-Based Access Control (RBAC):**
  - `ADMIN`: Full access (Invite team members, change roles, delete feedback, create reports).
  - `ANALYST`: Ingest feedback, upload CSV files, triage reviews, create reports.
  - `VIEWER`: Read-only access across the workspace.
  - *Server-side API role enforcement (returns 403 Forbidden on unauthorized actions).*
- **Feedback Collection & CSV Importer:** Single feedback entry, simulated live channels (Support tickets, App Store, Discord, Twitter, Surveys), and a CSV importer with column auto-matching.
- **Feedback Inbox & Workflow:** Server-side pagination, search, 5 filters (source, sentiment, category, status, date range), and status progression (`NEW` -> `REVIEWED` -> `ACTIONED`).
- **Dashboard:** Interactive metrics cards, customer happiness score, category distribution, and time-series charts.

### AI Intelligence Suite
- **Sentiment & Urgency Scoring:** Automatic sentiment scoring (-1.0 to +1.0), category tagging, urgency ranking, and one-sentence summaries stored on each record.
- **Topic Clustering & Spike Alerts (`/trends`):** Automatically groups feedback into topics, tracks volume over time, flags complaint surges (>35% spike alerts), and provides drill-down side drawers.
- **Ask LOOP Q&A Assistant (`/ask`):** Conversational assistant with semantic retrieval that answers questions based on real feedback and cites exact customer quotes.
- **Executive Reports (`/reports`):** Period synthesis of executive summaries, sentiment shift deltas, top topics, customer quotes, recommended actions, and Print/PDF export.

---

## AI Engine & API Key Options

Project LOOP includes a multi-provider AI engine with automatic zero-key fallback:

1. **Built-in Engine (Default / Zero Key Needed):**  
   Works out of the box offline without requiring any external API keys.
2. **Groq Cloud API (Free Tier Recommended):**  
   Free ultra-fast inference with Llama 3.3 via [Groq Cloud Console](https://console.groq.com/).  
   Add `GROQ_API_KEY="your_key_here"` in `.env`.
3. **Google Gemini API (Free Tier):**  
   Free 15 requests per minute via [Google AI Studio](https://aistudio.google.com/).  
   Add `GEMINI_API_KEY="your_key_here"` in `.env`.

---

## Demo Login Credentials

Use these pre-seeded credentials to test multi-tenancy and RBAC roles:

| Workspace | Role | Email | Permissions |
| :--- | :--- | :--- | :--- |
| **Acme Corp** | `ADMIN` | `admin@acme.com` | Full workspace admin, invite members, triage & delete |
| **Acme Corp** | `ANALYST` | `analyst@acme.com` | Ingest feedback, CSV upload, triage, generate reports |
| **Acme Corp** | `VIEWER` | `viewer@acme.com` | Read-only access to Inbox, Trends, Ask LOOP, and Reports |
| **Beta Labs** | `ADMIN` | `beta-admin@betalabs.internal` | Demonstrates complete tenant data isolation |

---

## Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js (App Router) + TypeScript | Full-stack server components & route handlers |
| **Styling** | Tailwind CSS + Light/Dark Mode | Design system with responsive layout |
| **Database** | PostgreSQL (Neon / Supabase) | Relational data persistence |
| **ORM** | Prisma ORM | Type-safe schema migrations & relations |
| **Authentication** | Clerk Auth / RBAC Session Guards | Secure identity & role management |
| **AI Layer** | Multi-Provider Engine (Groq, Gemini & Built-in Engine) | Classification, Q&A, and summary reports |
| **Validation** | Zod & TypeScript Strict Types | Runtime API validation |

---

## Quickstart & Local Setup

### 1. Prerequisites
- Node.js 18+ LTS
- PostgreSQL database (e.g. Neon.tech or Supabase)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/RahulBhandari0/AI-Customer-Feedback-Intelligence-Platform.git
cd AI-Customer-Feedback-Intelligence-Platform/my-app

# Install dependencies
npm install
```

### 3. Environment Variables
Create a `.env` file in `my-app/` with:
```env
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@YOUR_HOST.aws.neon.tech/neondb?sslmode=require"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Optional: Add any free AI key for live LLM generation
GROQ_API_KEY="gsk_..."
# GEMINI_API_KEY="AIzaSy..."
```

### 4. Database Setup & Seeding
```bash
# Run the database migration
node scripts/migrate.js

# Seed the database with 130+ multi-channel items, themes, embeddings & reports
npm run seed
```

### 5. Run the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) or [http://localhost:3001](http://localhost:3001) in your browser.

---

## Application Routes

- `/` &mdash; Landing page and product overview
- `/feedback` &mdash; Feedback Inbox (Search, Filters, Status Workflow, Detail Drawer)
- `/feedback/new` &mdash; Single feedback submission form with real-time preview
- `/feedback/import` &mdash; CSV bulk importer with auto-column matching
- `/trends` &mdash; Topic clustering, volume over time, spike alerts & drill-down drawer
- `/ask` &mdash; Ask LOOP assistant with customer quote citations
- `/reports` &mdash; Executive summary report generator & PDF export
- `/dashboard` &mdash; Analytics dashboard (KPI cards, charts, and customer happiness)
- `/workspace/members` &mdash; Team workspace management & role settings
