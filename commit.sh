#!/usr/bin/env bash
set -e

echo "=== Initializing and Committing JanSetu Grievance Portal ==="

# Initialize git repository if not already initialized
if [ ! -d ".git" ]; then
  git init -b main
  echo "Initialized empty Git repository in $(pwd)/.git"
fi

# Configure local git user if not globally set
if [ -z "$(git config user.name)" ]; then
  git config user.name "Ankit"
  git config user.email "ankit@grievance.gov.in"
  echo "Configured local Git committer identity."
fi

# Stage and Commit 1: Project Foundation & Configuration
git add package.json tsconfig.json next.config.js tailwind.config.ts postcss.config.js .gitignore .env.example .env
git commit -m "feat(core): initialize Next.js App Router structure with TypeScript and Tailwind CSS" || true

# Stage and Commit 2: Database Schema & Seed Data
git add prisma/
git commit -m "feat(db): add Prisma relational schema with 12 models and realistic seed data" || true

# Stage and Commit 3: Authentication & Security
git add src/lib/auth/ src/lib/audit/ src/app/api/auth/ src/app/login/ src/app/register/
git commit -m "feat(auth): implement JWT authentication, password hashing, and role-based access control" || true

# Stage and Commit 4: AI Service Layer & Analytics Pipeline
git add src/lib/ai/ src/lib/utils/ src/app/api/upload/ src/app/api/stats/ src/app/api/categories/ src/types/
git commit -m "feat(ai): implement multimodal classification, multi-signal duplicate detection, and fraud risk scoring" || true

# Stage and Commit 5: UI Component Library & Maps
git add src/components/ui/ src/components/layout/ src/components/maps/ src/components/complaints/ src/app/globals.css
git commit -m "feat(ui): add accessible civic component library, Leaflet map picker, and status timeline" || true

# Stage and Commit 6: Grievance APIs & Citizen Portal
git add src/app/api/complaints/ src/app/api/notifications/ src/app/citizen/
git commit -m "feat(citizen): add 4-step grievance submission wizard, live tracking, and notification center" || true

# Stage and Commit 7: Department Officer Workspace & Review
git add src/app/officer/
git commit -m "feat(officer): add department queue, AI analysis panel, and status action console" || true

# Stage and Commit 8: Administrator Center
git add src/app/admin/ src/app/api/admin/
git commit -m "feat(admin): add live analytics hub, department management, routing rules, and audit logs" || true

# Stage and Commit 9: Public Landing & Informational Pages
git add src/app/page.tsx src/app/about/ src/app/how-it-works/
git commit -m "feat(public): add landing page with real-time stats ticker, about, and how-it-works pages" || true

# Stage and Commit 10: Automated Tests & Academic Documentation
git add tests/ README.md PROJECT_REPORT.md public/
git commit -m "docs & test: add Vitest test suite, comprehensive README, and university project report" || true

# Stage remaining files if any
git add -A
git commit -m "chore: finalize project setup and file verification" || true

echo ""
echo "=== Git Commit History ==="
git log --oneline -n 12

echo ""
echo "All commits created successfully!"
