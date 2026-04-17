# PLAN

## Current branch

- `codex/fix-everything-2026`

## Sprint status

### Sprint 1

- [x] Fix public story readiness / anonymization eligibility
- [x] Remove fabricated homepage story fallbacks
- [x] Replace hardcoded warehouse snapshot cards with live dashboard API data
- [x] Collapse duplicate homepage summary fetches
- [x] Apply quick homepage + Evidence Patterns hierarchy polish

## What changed this sprint

- Homepage now shows real featured stories or an intentional proof-state, never fabricated content.
- Homepage summary + featured content now load through one coordinated fetch path.
- Evidence Patterns now reads warehouse snapshot cards/questions from a live API endpoint instead of hardcoded constants.
- Evidence Patterns hero and question sections were compressed to reduce repeated card scaffolding.

## Next sprint candidates

- Build a dedicated `Data Visualizations` page with chart-first navigation.
- Replace more text-heavy sections with chart modules and state/insurer drill-downs.
- Add Playwright smoke coverage for homepage, evidence patterns, and fight-back flows.
- Decide whether `Data Products` stays public as-is or becomes a real live demo / preview.
