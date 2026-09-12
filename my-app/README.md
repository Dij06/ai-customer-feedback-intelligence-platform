# Project LOOP — AI Customer-Feedback Intelligence Platform

> **"Close the loop on customer feedback."**  
> An enterprise-grade, multi-tenant web application that ingests multi-channel customer feedback, uses AI to classify and cluster it into themes, surfaces trending complaint spikes, answers plain-English questions grounded in actual feedback (RAG), and synthesizes one-click executive Voice-of-Customer (VoC) digests.

---

## 🌟 Executive Summary & Features

### Core Application Architecture
- **Multi-Tenant Workspaces & Tenant Isolation:** Every single database query is filtered strictly by the authenticated user's `workspaceId`. A user from Company A can never read Company B's data.
- **Role-Based Access Control (RBAC):**
  - `ADMIN`: Full access (Invite teammates, change roles, delete feedback, generate reports).
  - `ANALYST`: Manage and ingest feedback, classify items, generate reports.
  - `VIEWER`: Read-only access across the workspace.
  - *Server-side API role enforcement (returns `403 Forbidden` on forbidden actions).*
- **Multi-Channel Ingestion & Universal CSV Bulk Uploader:** Single feedback entry, simulated live channels (Support tickets, App Store, Discord, Twitter, Surveys), and universal CSV importer with validation summaries.
- **Triage Inbox & Workflow:** Server-side pagination, full-text search, 5 multi-dimensional filters (channel, sentiment, category, status, date range), and inline status workflow (`NEW` &rarr; `REVIEWED` &rarr; `ACTIONED`).
- **Live Analytics Dashboard:** Interactive metrics cards, Net Sentiment Score, category distribution, and time-series charts.

### 🧠 AI Intelligence Suite (Milestones 3 & 4)
- **AI1: Structured Auto-Classification:** Automated sentiment scoring (-1.0 to +1.0), category tagging, urgency ranking, and one-sentence summaries stored directly on the record.
- **AI2: Theme Clustering & Spike Detection (`/trends`):** AI clusters feedback into named themes, tracks volume evolution over time, flags complaint surges (>35% spike alerts), and provides interactive click-to-drill-down drawers.
- **AI3: Ask LOOP Grounded Q&A / RAG (`/ask`):** Plain-English conversational assistant with semantic vector retrieval that answers questions strictly based on real feedback and cites exact customer quotes.
- **AI4: Voice-of-Customer (VoC) Executive Digest (`/reports`):** 1-Click period synthesis of executive summaries, sentiment shift deltas, top themes, notable verbatim quotes, prioritized engineering actions, and **Print/PDF Export**.

---

## 🔑 AI Engine & Free API Key Options

Project LOOP includes a **Multi-Provider AI Intelligence Engine** designed with automatic zero-key fallback:

1. **High-Precision Built-in Engine (Default / Zero Key Needed):**  
   Works 100% out of the box offline or during demonstrations without requiring any paid API keys.
2. **Google Gemini API (Free Tier Recommended):**  
   Free 15 requests per minute via [Google AI Studio](https://aistudio.google.com/).  
   Add `GEMINI_API_KEY="your_key_here"` in `.env`.
3. **Groq Cloud API (Free Tier):**  
   Free ultra-fast inference with Llama 3.3 via [Groq Cloud Console](https://console.groq.com/).  
   Add `GROQ_API_KEY="your_key_here"` in `.env`.
4. **Anthropic Claude API:**  
   Add `ANTHROPIC_API_KEY="your_key_here"` in `.env`.

---

## 👥 Demo Login Credentials (For Graders & Mentors)

Use these pre-seeded credentials to test multi-tenancy and RBAC roles:

| Workspace | Role | Email | Permissions |
| :--- | :--- | :--- | :--- |
| **Acme Corp** | `ADMIN` | `admin@acme.com` | Full workspace admin, invite members, triage & delete |
| **Acme Corp** | `ANALYST` | `analyst@acme.com` | Ingest feedback, CSV upload, triage, generate VoC reports |
| **Acme Corp** | `VIEWER` | `viewer@acme.com` | Read-only access to Inbox, Trends, Ask LOOP, and Reports |
| **Beta Labs** | `ADMIN` | `beta-admin@betalabs.internal` | Demonstrates complete tenant data isolation |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 14 / 16 (App Router) + TypeScript | Full-stack server components & route handlers |
| **Styling** | Tailwind CSS + Light/Dark Mode | Modern corporate SaaS design system |
| **Database** | PostgreSQL (Neon / Supabase) | Multi-tenant relational data integrity |
| **ORM** | Prisma ORM | Type-safe schema migrations & relations |
| **Authentication** | Clerk Auth / RBAC Session Guards | Secure identity & role management |
| **AI Layer** | Multi-Provider Engine (Gemini, Groq, Claude & Fallback) | Structured classification, RAG Q&A, and VoC digests |
| **Validation** | Zod & TypeScript Strict Types | Runtime API boundary validation |

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- Node.js 18+ LTS
- PostgreSQL database (e.g. free tier on Neon.tech or Supabase)

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
GEMINI_API_KEY="AIzaSy..."
# GROQ_API_KEY="gsk_..."
# ANTHROPIC_API_KEY="sk-ant-..."
```

### 4. Database Setup & Seeding (130+ Items)
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

## 🗺️ Application Route Sitemap

- `/` &mdash; Interactive Marketing Landing Page & Product Feature Tour
- `/feedback` &mdash; Multi-tenant Feedback Inbox (Search, Filters, Inline Triage, Detail Drawer)
- `/feedback/new` &mdash; Single Feedback Ingestion Form with Real-time AI Classification Preview
- `/feedback/import` &mdash; Universal Drag & Drop CSV Bulk Importer with Validation Summary
- `/trends` &mdash; **AI2**: Theme Clustering, Volume Over Time, Spike Alerts & Drill-Down Drawer
- `/ask` &mdash; **AI3**: Ask LOOP Conversational Assistant with Grounded Citations (RAG)
- `/reports` &mdash; **AI4**: Executive Voice-of-Customer Digest Generator & PDF Export
- `/dashboard` &mdash; Live Visual Analytics Dashboard (Metrics Cards & Net Sentiment)
- `/workspace/members` &mdash; Team Workspace Management & RBAC Role Switcher
