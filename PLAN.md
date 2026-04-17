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

### Sprint 1.5

- [x] Replace generic Inter-based visual system with a more editorial typography stack
- [x] Rebuild homepage hero around a dominant live proof object
- [x] Reduce repeated homepage card scaffolding and convert news into a stronger narrative rail
- [x] Redesign Evidence Patterns hero into a signal board instead of another card wall
- [x] Convert warehouse snapshot content into fewer, stronger visual modules

### Sprint 2.0

- [x] Add persistent public navigation with Home, Fight Back, Evidence Patterns, Data Visualizations, Data Products, and About Trust
- [x] Build a live `/data-visualizations` page with insurer share, state heatmap, and trend timeline
- [x] Shift homepage and Evidence Patterns into the soft blue/green medical-tech visual system
- [x] Replace the remaining dark card-wall feel on the two highest-traffic public pages
- [ ] Deploy and visually verify the production site matches the new direction

## What changed this sprint

- Homepage now shows real featured stories or an intentional proof-state, never fabricated content.
- Homepage summary + featured content now load through one coordinated fetch path.
- Evidence Patterns now reads warehouse snapshot cards/questions from a live API endpoint instead of hardcoded constants.
- Evidence Patterns hero and question sections were compressed to reduce repeated card scaffolding.
- Homepage and Evidence Patterns now use a more deliberate editorial/control-room visual direction with stronger typography and proof objects.
- Global navigation now reflects the public information architecture and includes the new Data Visualizations destination.
- Data Visualizations now exposes live insurer share, state concentration, and trend charts with export/citation actions.
- Homepage and Evidence Patterns now use the calmer blue/green medical-tech palette the redesign was aiming for.

## Next sprint candidates

- Visually verify and tune production after deploy so the live site actually reflects Sprint 2.0.
- Add Playwright smoke coverage for homepage, evidence patterns, and fight-back flows.
- Decide whether `Data Products` stays public as-is or becomes a real live demo / preview.
- Align the remaining pages (`Fight Back`, `Share Your Story`, `Data Products`) to the new visual system before more feature work.
