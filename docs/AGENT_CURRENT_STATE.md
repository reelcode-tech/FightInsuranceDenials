# FightInsuranceDenials Current State

Last updated: 2026-04-20

## Current product state

What is now materially better:
- homepage is shorter, more proof-first, and more patient-usable
- `/data-visualizations` now has a clearer public count, legends, methodology note, time window controls, and appeal-citation copy
- `Evidence Patterns` now carries clearer “how to use this in your appeal” guidance and a consistent public-story count
- public navigation and daughter-page structure exist and are live on production

What is still not good enough:
- `Fight Back`, `Share Your Story`, and `Data Products` are still behind the homepage/data-viz standard
- there is still too much copy in parts of the app
- charts are better, but the site still needs more world-class visual polish and mobile QA
- we still do not have browser-captured screenshots/video proof checked into the repo
- the B2B / data-products story is still not backed by enough truly productized deliverables

## Current data position

Use these numbers consistently in the public product unless and until the business decision changes:
- published/public stories: `1,173`
- curated stories: `1,771`
- raw observations: `1,788`
- warehouse-scale usable rows reference: `14,202`

Important interpretation:
- the warehouse is stronger than the public site
- the public product still underexpresses the strongest analytics
- the bottleneck is not just ingestion, it is promotion, modeling, and presentation

## Strongest warehouse findings already identified

Top denial reasons:
- Prior Authorization: `2,808`
- Medical Necessity: `2,612`
- Coverage Exclusion: `1,981`
- Administrative: `1,693`
- Out of Network: `1,223`

Top treatment/service fights:
- Prescription medication: `1,229`
- Therapy services: `1,194`
- Cancer treatment and oncology care: `1,092`
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

## What changed in Sprint 3.0

- homepage copy reduced sharply and reorganized around one primary patient question
- long “Why now” rail replaced with 3 visual stat cards
- proof strips now have explicit explanatory labels/tooltips
- homepage now has a horizontal “Stories matching your situation” story rail
- `/data-visualizations` now uses one story-count source of truth (`1,173`)
- `/data-visualizations` now includes:
  - insurer denial share donut
  - state heatmap tile-map
  - timeline with appeal success-rate overlay
  - legends and methodology note
  - export PDF and copy-citation actions
- `Evidence Patterns` now uses the same public-story count and clearer appeal microcopy

## What is still open

Highest-value open work:
1. bring `Fight Back`, `Share Your Story`, and `Data Products` up to the same clarity/design bar
2. turn data products into something visibly real and sellable
3. add screenshot/video/browser verification to the workflow
4. deepen warehouse-backed public evidence modules beyond the current dashboard level
5. continue improving ingestion quality, especially insurer/category/procedure normalization

## What the user is explicitly frustrated by

- the site still risks sliding back into text-heavy “AI-generated” design
- the product needs to feel world-class for a patient in crisis, not just “improved”
- the data-products offer still needs to prove it is real
- work must happen on the real production codebase, not stale copies

Take that frustration seriously. The user is not asking for cosmetic tweaks. They are asking for a product that actually reduces panic and increases confidence.
