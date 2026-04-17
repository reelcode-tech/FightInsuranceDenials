# FightInsuranceDenials Current State

Last updated: 2026-04-16

This file is the quickest honest state snapshot for a new coding agent.

## 1. Current product state

What is good:
- strong core idea
- public routed pages exist
- live domain is connected
- evidence page is moving toward broader question-driven insights
- appeal flow exists and is more grounded than a generic chatbot
- some warehouse-backed insights are now visible on the site

What is not good enough:
- the overall UX is still too text-heavy
- not enough charts, visuals, or visual hierarchy
- homepage still lacks enough proof and social-trust framing
- evidence still feels underpowered vs the actual warehouse signal
- data-products page is better than before, but still not a genuinely compelling B2B pitch
- the site still does not feel “finished”

## 2. Current data position

Latest app-side counts recently used in product updates:
- raw observations: `1788`
- curated stories: `1771`
- published/public stories: `1173`

Latest warehouse-scale insight reference:
- usable warehouse rows: `14,202`
- this is the stronger signal layer and is documented in `docs/BIGQUERY_INSIGHTS_REPORT.md`

Important interpretation:
- the warehouse is richer than the public site
- the bottleneck is not just ingestion volume
- the bigger bottleneck is promotion, normalization, and public evidence modeling

## 3. Strongest warehouse findings already identified

Top denial reasons:
- Prior Authorization: `2808`
- Medical Necessity: `2612`
- Coverage Exclusion: `1981`
- Administrative: `1693`
- Out of Network: `1223`

Top treatment/service fights:
- Prescription medication: `1229`
- Therapy services: `1194`
- Cancer treatment and oncology care: `1092`
- GLP-1 medication: `893`
- Claims processing disputes: `748`

Strong repeat combinations:
- Claims processing disputes + Administrative: `717`
- Therapy services + Out of Network: `505`
- Cancer treatment + Medical Necessity: `473`
- Cancer treatment + Prior Authorization: `457`
- Prescription medication + Prior Authorization: `454`
- GLP-1 medication + Prior Authorization: `404`
- GLP-1 medication + Coverage Exclusion: `332`

The public site should lean much harder on these broader modules instead of tiny low-count clusters.

## 4. What has already been fixed recently

- production API import/runtime issue was fixed so the public observatory routes can run on Vercel
- insurer normalization was hardened so long narrative text no longer becomes fake insurer names
- Neon normalize/promote backfills were batched for reliability
- evidence page now includes warehouse-backed snapshot cards and user-question cards
- footer/sitemap-style public shell now exists
- About / Trust has been rewritten into a stronger public-interest trust page
- Data Products has been reframed into a more credible organization-facing page

## 5. What is still open

Highest-value open work:
1. build a dedicated data visualization / dashboard experience
2. make the homepage visually stronger and less text-heavy
3. make the story browser cleaner and more obviously useful
4. finish turning BigQuery findings into public evidence modules
5. make the data-products page feel like a real sellable offer or simplify it further

## 6. What not to do

Do not:
- add more shallow connectors just to increase source count
- reintroduce internal jargon like “cleaned slice” on public pages
- rely on tiny `2-15 story` widgets as the main public evidence
- treat Firestore as the analytics source of truth
- assume more rows alone will fix the product

## 7. What the user is explicitly frustrated by

- too much text on every page
- not enough visuals, charts, graphs, and pictures
- too little evidence of real product maturity
- not enough demonstration of real sellable data products
- too much time spent on low-yield connector work without clear payoff

This frustration is legitimate. The next agent should not pretend otherwise.
