# FightInsuranceDenials Agent Execution Guide

Last updated: 2026-04-16

This guide tells the next coding agent how to work on the project effectively.

## 1. Read order

Read in this order:

1. `docs/HANDOFF_START_HERE.md`
2. `docs/AGENT_CURRENT_STATE.md`
3. `docs/ARCHITECTURE.md`
4. `docs/TODO.md`
5. `docs/MVP_FEEDBACK_TRACKER.md`
6. `docs/BIGQUERY_INSIGHTS_REPORT.md`
7. `TESTING.md`

## 2. Practical architecture summary

Frontend / app shell:
- Vite + React
- main entry: `src/App.tsx`
- routed tabs are managed client-side through `src/lib/siteRoutes.ts`

Important public pages:
- homepage / observatory:
  - `src/components/Dashboard.tsx`
  - `src/components/ObservatoryExperience.tsx`
- share your story:
  - `src/components/SubmitDenial.tsx`
- fight back:
  - `src/components/AppealTools.tsx`
  - `src/components/AppealGenerator.tsx`
- evidence patterns:
  - `src/components/Insights.tsx`
- data products:
  - `src/components/B2BDataProducts.tsx`
- about / trust:
  - `src/components/AboutTransparency.tsx`

API layer:
- Vercel-style API routes in `api/`
- important routes:
  - `api/observatory/summary.ts`
  - `api/observatory/stories.ts`
  - `api/insights/patterns.ts`
  - `api/ai/extract.ts`
  - `api/ai/generate-appeal.ts`

Data:
- BigQuery = warehouse and analytics source
- Neon = app-facing operational relational store
- Firebase = legacy auth/app residue; not the desired analytics future

## 3. How to think about the product

There are three main product jobs:

1. Search the public record
- help patients find similar denials
- help them see what patterns repeat

2. Share your story
- capture narratives safely
- extract structured fields
- convert isolated experiences into public evidence

3. Fight back
- turn denial details into a stronger appeal
- use precedent and benchmark context

These jobs should remain visually and conceptually distinct.

## 4. Best next technical moves

If you only have one pass to make impact, do these:

1. Build the data visualization layer
- create a dedicated dashboard page/section
- show insurer share, denial reason share, state or regional summary if stable, and treatment-pattern trends
- use the warehouse-scale findings in `docs/BIGQUERY_INSIGHTS_REPORT.md`

2. Reduce text and increase signal
- replace explanatory paragraphs with charts, cards, screenshots, and focused labels
- use one sentence where three currently exist

3. Make data products real
- show concrete outputs that could plausibly be sold:
  - insurer trend dashboards
  - plan-type benchmark reports
  - exportable evidence packets
  - regulator / hospital / legal reporting views

4. Keep improving promotion from warehouse to public evidence
- the warehouse already has stronger signal than the site expresses

## 5. Testing requirements

Always follow `TESTING.md`.

Minimum pre-push gate:

```powershell
npm test
npm run lint
npm run build
```

If changing API, data flow, or UX tied to a bug:
- add or update regression coverage
- verify the failing path after deployment if possible

## 6. Deployment workflow

Current happy path:

```powershell
git status
git add .
git commit -m "Meaningful message"
git push origin main
```

Then verify production in Vercel:
- confirm latest deployment on `fight-insurance-denials`
- confirm it is `READY`
- confirm commit SHA matches what you pushed

## 7. Known traps

- The public site can underexpress the actual warehouse signal.
- Tiny public clusters can be misleadingly weak.
- Better UX is not just more copy; the user wants more visual proof and less explanation.
- More connectors are not automatically better; shallow ingestion has already wasted time.
- Keep work focused on:
  - evidence density
  - product clarity
  - visual trust
  - public usefulness

## 8. If you need a fast orientation in code

Start here:

```powershell
Get-Content .\\src\\App.tsx
Get-Content .\\src\\components\\ObservatoryExperience.tsx
Get-Content .\\src\\components\\Insights.tsx
Get-Content .\\src\\components\\AppealTools.tsx
Get-Content .\\src\\components\\SubmitDenial.tsx
```

Then review:

```powershell
Get-Content .\\docs\\TODO.md
Get-Content .\\docs\\MVP_FEEDBACK_TRACKER.md
Get-Content .\\docs\\BIGQUERY_INSIGHTS_REPORT.md
```

That is enough to understand the current product direction fast.
