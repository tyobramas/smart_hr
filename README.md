# SmartHR — AI-Powered Recruitment & Talent Platform

<p align="left">
  <b>English</b> | <a href="README.id.md">Bahasa Indonesia</a>
</p>

An intelligent recruitment and talent management platform built with **Next.js 15 (App Router, TypeScript)**, **Supabase (PostgreSQL & Auth)**, **Tailwind CSS**, and an autonomous **Hermes AI Agent** runtime.

---

## 🚀 Key Features

### 1. Candidate Portal
- **Job Catalog (`/jobs`)**: Browse active job vacancies with modern 3D visual cards, location tags, employment types, and minimum qualification score thresholds.
- **Job Details (`/jobs/[slug]`)**: In-depth role descriptions, competencies, and technical qualifications.
- **Application & CV Upload (`/jobs/[slug]/apply`)**: Seamless application submission with instant client-side PDF text extraction and secure Supabase Storage upload.
- **Application Tracking (`/applications`)**: Real-time status monitoring (`pending`, `screened`, `invited_interview`, `interview_in_progress`, `interview_completed`, `rejected`, `withdrawn_expired`).
- **4-Framework Psychometric Assessment (`/applications/[id]/personality-test`)**: Comprehensive candidate profiling combining **DISC**, **Big Five (OCEAN)**, **PAPI Kostick**, and **MBTI** archetypes.
- **Interactive AI Interview (`/applications/[id]/interview`)**: Real-time competency-based AI interview sessions featuring dynamic follow-up questioning and conversational evaluation.

### 2. Admin & Recruiter Portal
- **Recruitment Dashboard (`/admin/dashboard`)**: Executive overview with recruitment metrics, active job counts, applicant throughput, and recent applications.
- **Job Management (`/admin/jobs`)**: Complete lifecycle control over job postings, publication toggles, passing thresholds, and AI blueprint generators.
- **Job Creation Studio (`/admin/jobs/new`)**: Create vacancies with automated slug generation and structured competency scripts.
- **Applicant Management (`/admin/applications`)**: Comprehensive candidate pipeline management, status transitions, CV analysis breakdown, and candidate dossier reviews.
- **Communication Log Dashboard (`/admin/communications`)**: Full visibility into automated outbound emails, delivery statuses, error reports, and live email HTML preview modal.

### 3. Hermes AI Engine & Intelligence Layer
- **Automated CV Screening**: In-depth CV analysis matching candidate background against role requirements with objective scoring and confidence ratings.
- **Dynamic Interview Questioning & Evaluation**: Real-time probe generation during candidate interviews with linguistic confidence scoring and behavioral assessment.
- **Tri-Factor Executive Synthesis**: Synthesizes CV analysis, psychometric personality profile, and interview performance into actionable hiring recommendations.
- **Proactive Communication Engine**: Personalizes candidate communication across 12 lifecycle events in empathetic, professional Indonesian without exposing internal evaluation rubrics.

### 4. Security & Role Guards
- **Row Level Security (RLS)**: Candidates can only access their own submissions and assessments; Admins have system-wide access.
- **Route Middleware Guards**: Server-side middleware protects `/admin/*` routes, redirecting unauthorized candidates to `/jobs`.
- **Sensitive Secrets Isolation**: Service role keys (`SUPABASE_SERVICE_ROLE_KEY`) are strictly confined to server actions and never bundled into client browser code.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15.1.7 (App Router, Server Actions)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3, Lucide React Icons
- **Database & Auth**: Supabase (PostgreSQL, Auth SSR, Supabase Storage)
- **AI Engine**: Hermes Agent runtime (`mistral-medium-3-5` with multi-model cascade)
- **Email Delivery**: Resend SDK with built-in dry-run simulation mode
- **PDF Extraction**: `unpdf`, `pdf-parse`, `pdf-lib`

---

## 🏁 Getting Started

### Prerequisites
- **Node.js**: v18.18+ or v20+
- **npm** or **yarn** / **pnpm**
- A **Supabase** project (cloud instance or local CLI)

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/tyobramas/smart_hr.git
cd smart_hr
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure your environment variables:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Hermes Agent Configuration (API Router or CLI)
HERMES_MODE=api
HERMES_BASE_URL=https://router.bynara.id/v1
HERMES_API_KEY=your_hermes_or_nara_api_key
HERMES_MODEL=mistral-medium-3-5

# Communication Engine (Resend)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM_ADDRESS=onboarding@resend.dev
EMAIL_FROM_NAME="SmartHR Recruitment"
APP_BASE_URL=http://localhost:3000
COMMUNICATION_ENABLED=true
COMMUNICATION_DRY_RUN=true
CRON_SECRET=your_secure_cron_secret
```

### 3. Database Migrations
Apply the migrations in `supabase/migrations/` to your database using the **Supabase Dashboard SQL Editor** or the Supabase CLI:
- `20250101000000_init_schema.sql` (Core schema & RLS policies)
- `20250101000001_storage.sql` (CV storage bucket & permissions)
- `20260901131451_add_interview_blueprints_to_jobs.sql` (Interview blueprints)
- `20260902000000_add_communication_logs.sql` (Communication Engine audit table)

### 4. Running the Development Server
Start the Next.js local server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on `localhost:3000` |
| `npm run build` | Build production Next.js application |
| `npm run start` | Start production server |
| `npm run test:comm` | Test Communication Engine content generation & delivery |
| `npm run test:hermes` | Test Hermes Agent connection and inference |
| `npm run test:screener` | Test CV screening pipeline |
| `npm run test:interview-script` | Test interview blueprint generator |

---

## 👑 Assigning the Admin Role

To grant a user Admin access:
1. Register a new account via `/sign-up` and complete initial onboarding.
2. In your Supabase Dashboard (Table Editor -> `profiles`), update the `role` column for that user from `'candidate'` to `'admin'`.
3. Refresh the page to access the `/admin` portal.
