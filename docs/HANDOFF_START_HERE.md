# FightInsuranceDenials Agent Handoff

Last updated: 2026-04-16

This is the entry point for any new coding agent taking over the project.

## 1. Latest code

- Local working repo:
  - `C:\Users\sashi\Projects\FightInsuranceDenials-working`
- GitHub source of truth:
  - `https://github.com/reelcode-tech/FightInsuranceDenials`
- Current primary branch:
  - `main`
- Latest known handoff commit:
  - `1219d56fd4ef4e62ae55114b4895a9ec95b0f511`

## 2. Read these files first, in this order

1. `docs/HANDOFF_START_HERE.md`
2. `docs/AGENT_CURRENT_STATE.md`
3. `docs/ARCHITECTURE.md`
4. `docs/TODO.md`
5. `docs/MVP_FEEDBACK_TRACKER.md`
6. `docs/BIGQUERY_INSIGHTS_REPORT.md`
7. `TESTING.md`

Do not start by randomly reading components. Read the docs first so you understand what is already known to be weak, what has already been tried, and what the user is unhappy about.

## 3. What this product is

FightInsuranceDenials is:
- a public health insurance denial database
- a searchable evidence layer for patients
- an AI-assisted appeal-writing tool
- a growing warehouse + data product foundation

It is not yet a polished production product. It is an early-stage MVP with a strong core idea and incomplete execution.

## 4. What matters most right now

The user’s top concerns:
- UX is still too text-heavy and not visual enough
- the site still feels too much like an MVP/prototype
- evidence patterns are underpowered on the public site
- data products do not yet feel real enough to sell
- the public site still underexpresses the stronger BigQuery signal

The next agent should prioritize:
1. cleaner, more visual public UX
2. stronger evidence/dashboard modules from warehouse insights
3. clearer productization of sellable data outputs
4. continued improvement of data quality and promotion logic

## 5. Exact local commands

Install / run:

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

Warehouse / data tasks:

```powershell
npm run warehouse:normalize
npm run warehouse:promote
npm run warehouse:autopilot
npm run warehouse:deep-backfill
```

## 6. Deployment / hosting

- Production is on Vercel project:
  - `fight-insurance-denials`
- Public domains:
  - `https://fightinsurancedenials.com`
  - `https://www.fightinsurancedenials.com`
- Latest known production deploy at handoff time:
  - commit `1219d56`
  - message: `Polish trust and data product pages`

## 7. Handoff rule

Before making any major UX or data-layer change:
- check `docs/TODO.md`
- check `docs/MVP_FEEDBACK_TRACKER.md`
- check `docs/BIGQUERY_INSIGHTS_REPORT.md`

Those three files are the current operating system for this project.
