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
- [x] Deploy and visually verify the production site matches the new direction

### Sprint 3.0

- [x] Cut homepage text density and replace the long “why now” rail with three visual stat cards
- [x] Rebuild the homepage hero around one short promise, one search slab, and one dominant proof object
- [x] Add explicit proof-strip labels/tooltips and a horizontal “Stories matching your situation” rail
- [x] Make `/data-visualizations` use one public-story total source of truth: `1,173`
- [x] Add chart legends, methodology note, time-window selector, and copy-ready appeal citation copy to `/data-visualizations`
- [x] Add appeal-success-rate context to the donut/timeline modules using recorded overturn outcomes
- [x] Tighten Evidence Patterns copy and micro-guidance so every major module says how to use it in an appeal
- [x] Deploy Sprint 3.0 to production on `www.fightinsurancedenials.com`
- [ ] Capture screenshots/video proof of the Sprint 3.0 live UI from a browser-capable environment
- [ ] Push the Sprint 3.0 branch state and refreshed docs to GitHub

## What changed this sprint

- Homepage now shows real featured stories or an intentional proof-state, never fabricated content.
- Homepage summary + featured content now load through one coordinated fetch path.
- Evidence Patterns now reads warehouse snapshot cards/questions from a live API endpoint instead of hardcoded constants.
- Evidence Patterns hero and question sections were compressed to reduce repeated card scaffolding.
- Homepage and Evidence Patterns now use a more deliberate editorial/control-room visual direction with stronger typography and proof objects.
- Global navigation now reflects the public information architecture and includes the new Data Visualizations destination.
- Data Visualizations now exposes live insurer share, state concentration, and trend charts with export/citation actions.
- Homepage and Evidence Patterns now use the calmer blue/green medical-tech palette the redesign was aiming for.
- Sprint 3.0 cut homepage copy, replaced the narrative rail with stat cards, added clearer proof-strip guidance, and introduced a more useful story carousel.
- Sprint 3.0 made `/data-visualizations` patient-usable with one count source of truth, methodology guidance, legends, success-rate context, and copy-ready appeal citations.
- Sprint 3.0 aligned the public-story count across homepage, evidence, data visualizations, and share-your-story messaging.

## Next sprint candidates

- Visually verify and tune production after deploy so the live site actually reflects Sprint 2.0.
- Add browser screenshots/video capture and Playwright smoke coverage for homepage, evidence patterns, and data visualizations.
- Decide whether `Data Products` stays public as-is or becomes a real live demo / preview with actual sellable artifacts.
- Align the remaining pages (`Fight Back`, `Share Your Story`, `Data Products`) to the new Sprint 3.0 clarity standard before more feature work.
