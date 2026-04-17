# FightInsuranceDenials Architecture

## Purpose
FightInsuranceDenials is a public insurance denial observatory plus patient action platform. The system has two distinct product jobs:

1. Share Your Story
Capture denial stories, structure them, anonymize them where appropriate, and turn scattered patient frustration into searchable public evidence.

2. Fight Back
Use the observatory's historical patterns, benchmarks, and precedent signals to help patients generate stronger, more contextual appeal drafts.

## High-Level System Shape
The architecture intentionally separates operational product data from analytical warehouse data.

### Operational Layer
- Runtime app: Vite + React frontend with Express server in [server.ts](C:\Users\sashi\Projects\FightInsuranceDenials-working\server.ts)
- Current hosting target: Vercel project `fight-insurance-denials`
- Legacy app data: Firebase / Firestore remains in place but is no longer the preferred long-term analytical store
- Primary operational relational store: Neon / Postgres

### Analytics Layer
- BigQuery project/dataset is the warehouse for raw observatory intake, pattern analysis, anomaly detection, and dashboard views
- BigQuery is the preferred place for high-volume public web observations and analytical transforms
- Looker Studio is intended as the external/dashboard visualization layer on top of curated BigQuery views

## Data Flow
### Public-source intake path
1. Source-specific ingestion modules discover public observations
2. Raw observations are written into BigQuery `raw_web_observations`
3. Warehouse transforms, scoring, and sync jobs copy stronger rows into Neon `raw_web_observations`
4. Promotion scripts elevate stronger rows into Neon `curated_stories`
5. Public pages read from the curated layer and warehouse-backed summary endpoints

### Patient-submitted intake path
1. User begins in Share Your Story with narrative-first entry
2. User optionally records voice or uploads denial documents later in the flow
3. AI extraction attempts to normalize insurer, denial category, procedure, denial quote, dates, and other structured fields
4. Consent settings determine public, aggregated-only, or private handling
5. Approved public-facing fields join the observatory; private materials remain restricted

### Appeal generation path
1. User brings denial details and uploaded letter into Fight Back
2. The backend fetches similar insurer/procedure/category evidence from BigQuery views
3. The AI prompt is grounded in precedent notes, benchmark summaries, and evidence checklists
4. The generated draft should be more useful than a generic LLM appeal letter because it references observatory context

## Key Data Stores
### BigQuery
Intended use:
- raw source intake
- analytical views
- pattern aggregation
- anomaly detection
- source mix reporting
- Looker Studio dashboards

Current important tables/views include:
- `raw_web_observations`
- `curated_stories`
- `source_records`
- `benchmark_snapshots`
- `insurer_daily_metrics`
- `v_patterns_clean`
- `v_insurer_category_heatmap`
- `v_procedure_clusters`
- `v_data_quality_monitor`
- `v_source_mix`
- `v_state_patterns_clean`

### Neon / Postgres
Intended use:
- app-facing relational source of truth
- curated stories
- appeals
- source records
- operational syncing from BigQuery
- future private case tracking and product features

Current schema includes:
- `app_users`
- `user_cases`
- `appeals`
- `source_records`
- `raw_web_observations`
- `curated_stories`
- `benchmark_snapshots`
- `insurer_daily_metrics`
- `public_story_rollup` view

### Firestore
Legacy/transition role only:
- existing historical data and app wiring still reference Firestore in places
- long-term goal is to reduce dependence on Firestore for analytics and high-volume reads
- Firestore is not the desired long-term warehouse because of quota/read economics for this product

## Core App Areas
### Homepage / Observatory
Goal:
- emotional proof
- immediate trust
- visible live stats
- strong split between story-sharing and fight-back

Primary component:
- [ObservatoryExperience.tsx](C:\Users\sashi\Projects\FightInsuranceDenials-working\src\components\ObservatoryExperience.tsx)

### Share Your Story
Goal:
- collect narratives first
- make contribution feel safe and human
- gather structured fields without forcing the patient to think like an insurer

Primary component:
- [SubmitDenial.tsx](C:\Users\sashi\Projects\FightInsuranceDenials-working\src\components\SubmitDenial.tsx)

### Fight Back / Appeal Tools
Goal:
- upload-first workflow
- precedent-aware appeal writing
- benchmark-aware guidance

Primary components:
- [AppealTools.tsx](C:\Users\sashi\Projects\FightInsuranceDenials-working\src\components\AppealTools.tsx)
- [AppealGenerator.tsx](C:\Users\sashi\Projects\FightInsuranceDenials-working\src\components\AppealGenerator.tsx)

### Evidence Patterns
Goal:
- explain findings in public-facing language
- show data quality honestly
- turn warehouse analytics into evidence people can understand

Primary component:
- [Insights.tsx](C:\Users\sashi\Projects\FightInsuranceDenials-working\src\components\Insights.tsx)

## Ingestion / Automation
Current automation is app-side and script-side, not external cron infrastructure.

Key files:
- [warehouseAutopilot.ts](C:\Users\sashi\Projects\FightInsuranceDenials-working\src\lib\warehouseAutopilot.ts)
- [redditWarehouseIngestion.ts](C:\Users\sashi\Projects\FightInsuranceDenials-working\src\lib\redditWarehouseIngestion.ts)
- scripts in [scripts](C:\Users\sashi\Projects\FightInsuranceDenials-working\scripts)

Current background runner:
- local always-on daemon in [warehouse-runner-daemon.ps1](C:\Users\sashi\Projects\FightInsuranceDenials-working\scripts\warehouse-runner-daemon.ps1)
- job entrypoint in [run-warehouse-job.ts](C:\Users\sashi\Projects\FightInsuranceDenials-working\scripts\run-warehouse-job.ts)
- wrapper entrypoint in [run-warehouse-job.ps1](C:\Users\sashi\Projects\FightInsuranceDenials-working\scripts\run-warehouse-job.ps1)
- daemon is intended to relaunch on Windows login through `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`, but that persistence step still needs a final clean verification
- this is the current "all day" ingestion lane until production cron is fully armed in Vercel

Current source-lane inventory:
- living inventory in [SOURCE_INVENTORY.md](C:\Users\sashi\Projects\FightInsuranceDenials-working\docs\SOURCE_INVENTORY.md)

Design principle:
- raw first
- clean second
- promote selectively
- never let public-facing stats depend directly on noisy raw rows without quality filters

## Security Posture To Finish
Before broader public launch, the system still needs a dedicated hardening pass.

Critical areas:
- upload validation and constrained processing
- rate limiting and abuse prevention
- auth boundaries and private/public separation
- secure secret handling across local/Vercel/Firebase/BigQuery/Neon
- safe logging and error handling
- prompt-injection resilience around uploaded denial text and public web content

## Testing Discipline
The repository testing contract now lives in [TESTING.md](C:\Users\sashi\Projects\FightInsuranceDenials-working\TESTING.md).

The practical rule is:
1. logic changes need unit coverage
2. route and pipeline changes need integration or contract coverage
3. customer-facing fixes are not complete until the real failing path is rechecked after deploy

For this project specifically, the riskiest areas that always need regression coverage are:
- AI extraction and appeal generation
- upload parsing for PDF, JPG, and PNG inputs
- observatory API routes and production serverless handlers
- warehouse sync and promotion logic
- story submission and appeal generation end-to-end flows

## Handoff Guidance For Other AI Coding Engines
If another coding engine picks this project up, these are the important truths:

1. Do not treat Firestore as the long-term analytics source.
2. BigQuery is the warehouse and should remain the home for large-scale public-source analysis.
3. Neon is the intended operational database for the modern app path.
4. Share Your Story and Fight Back are different product surfaces and must stay distinct.
5. Evidence Patterns must explain methodology and data quality, not just show charts.
6. Raw observation growth matters, but public observatory trust matters more than inflated counts.
7. Prefer additive migration and compatibility layers over hard cutovers while the app is still evolving.

Read first:
- [HANDOFF_START_HERE.md](C:\Users\sashi\Projects\FightInsuranceDenials-working\docs\HANDOFF_START_HERE.md)
- [AGENT_CURRENT_STATE.md](C:\Users\sashi\Projects\FightInsuranceDenials-working\docs\AGENT_CURRENT_STATE.md)
- [AGENT_EXECUTION_GUIDE.md](C:\Users\sashi\Projects\FightInsuranceDenials-working\docs\AGENT_EXECUTION_GUIDE.md)

## Immediate Priorities
- Improve homepage emotional clarity and visual coherence
- Expand non-Reddit trusted-source ingestion
- Improve extraction quality for insurer/category/procedure/state
- Harden the public site before broad promotion
- Complete Vercel deployment of the current branch and env config
