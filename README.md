# Placement App

A PWA-style web app for iOS and Android that helps students:
- Detect job opportunities from email
- Get daily reminders until they apply
- Track applications from detection to result
- Score resume against job descriptions (ATS score)
- Get personalized skill recommendations

## Tech Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Prisma ORM + SQLite (dev) / PostgreSQL (prod)
- **Auth**: NextAuth.js (credentials)
- **PWA**: next-pwa

## Getting Started
1. Install dependencies: `npm install`
2. Set up environment: copy `.env.example` to `.env.local`
3. Initialize database: `npm run db:push`
4. Run dev server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables
See `.env.example` for required variables.

## Project Structure
- `src/app/` — Next.js App Router pages and API routes
- `src/lib/` — Core engines (scoring, email detection, reminder)
- `src/components/` — Reusable UI components
- `prisma/` — Database schema and migrations

## Features (MVP)
- ✅ User authentication (register, login, password recovery)
- ✅ Resume upload and parsing
- ✅ Email opportunity detection engine
- ✅ Reminder engine (daily + deadline escalation)
- ✅ Notification center
- ✅ Application tracker (10 status states)
- ✅ Job-fit score (0-100)
- ✅ ATS score calculator
- ✅ Skill recommendations
- ✅ PWA (installable on iOS + Android)
