# FightInsuranceDenials Agent Execution Guide

Last updated: 2026-04-20

## Read order

1. `docs/HANDOFF_START_HERE.md`
2. `docs/PROJECT_INTENT.md`
3. `docs/AGENT_CURRENT_STATE.md`
4. `docs/ARCHITECTURE.md`
5. `docs/SKILL_PLAYBOOK.md`
6. `docs/LESSONS_LEARNED.md`
7. `docs/TODO.md`
8. `docs/MVP_FEEDBACK_TRACKER.md`
9. `docs/BIGQUERY_INSIGHTS_REPORT.md`
10. `docs/NEXT_SESSION_PROMPT.md`

## Practical architecture summary

Frontend / app shell:
- Vite + React
- root app shell: `src/App.tsx`
- client-side tab routing: `src/lib/siteRoutes.ts`

Key public pages:
- homepage:
  - `src/components/Dashboard.tsx`
  - `src/components/ObservatoryExperience.tsx`
- fight back:
  - `src/components/AppealTools.tsx`
  - `src/components/AppealGenerator.tsx`
- share your story:
  - `src/components/SubmitDenial.tsx`
- evidence patterns:
  - `src/components/Insights.tsx`
- data visualizations:
  - `src/components/DataVisualizations.tsx`
- data products:
  - `src/components/B2BDataProducts.tsx`
- about / trust:
  - `src/components/AboutTransparency.tsx`

API layer:
- Vercel-style routes in `api/`
- most important routes:
  - `api/observatory/summary.ts`
  - `api/observatory/stories.ts`
  - `api/insights/patterns.ts`
  - `api/insights/dashboard.ts`
  - `api/ai/extract.ts`
  - `api/ai/generate-appeal.ts`

Shared product metrics:
- `src/lib/publicMetrics.ts`

Data layer:
- BigQuery = warehouse / broader analytics source
- Neon = app-facing operational relational store
- Firebase = auth and some legacy residue

## Core product jobs

1. Search the public record
- help patients find matching denial patterns fast

2. Share your story
- capture narratives safely
- extract structure from messy denial evidence

3. Fight back
- help patients turn denial details into better appeals

4. Explain the pattern visually
- make the evidence usable in under a few minutes, not just searchable

## Commands

Local install / run:

```powershell
cd "C:\Users\sashi\Projects\FightInsuranceDenials-working"
npm install
npm run dev
```

Quality gate:

```powershell
npm test
npm run lint
npm run build
```

Warehouse/data commands:

```powershell
npm run warehouse:normalize
npm run warehouse:promote
npm run warehouse:autopilot
npm run warehouse:deep-backfill
```

Deployment:

```powershell
npx vercel --prod --yes --name fight-insurance-denials
```

## Operating rules for the next agent

- Work on the real repo:
  - `C:\Users\sashi\Projects\FightInsuranceDenials-working`
- Stay on or branch from:
  - `codex/fix-everything-2026`
- Do not resume from stale sandbox copies or old branches without verifying commit history first.
- Run lint/test/build before claiming completion.
- Prefer surgical, page-focused sprints instead of wide unfocused rewrites.
- Keep public copy short. The user wants less explanation and more proof.

## Known traps

- The public site can still underexpress the warehouse signal.
- The B2B page can easily drift back into vague “intelligence platform” copy unless backed by actual artifacts.
- Some environment checks may fail inside sandboxed shells and need elevated reruns.
- Screenshot/video proof is still an open workflow gap.

## What to do first in a fresh session

1. Confirm branch and git status.
2. Read the docs listed above.
3. Open:
   - `src/components/ObservatoryExperience.tsx`
   - `src/components/DataVisualizations.tsx`
   - `src/components/Insights.tsx`
   - `src/lib/publicMetrics.ts`
   - `api/insights/dashboard.ts`
4. Run:
   - `npm test`
   - `npm run lint`
   - `npm run build`
5. Verify whether production still matches the current branch.
