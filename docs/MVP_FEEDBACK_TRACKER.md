# MVP Feedback Tracker

Last updated: 2026-04-16

This file turns direct product feedback into a tracked execution plan. It is intentionally opinionated and page-specific so we can close gaps one by one instead of losing the thread across chats and deploys.

## Status legend
- `done`: shipped and basically working
- `in_progress`: started, partially visible, or blocked by follow-up work
- `not_started`: not yet addressed in the product
- `reconsider`: needs a product decision before we keep investing

## Overall read

Current product state:
- Strong core idea and timely mission
- Clear hero value proposition
- Real early database signal and live routing
- Still feels incomplete for a stressed denied patient
- Too much friction between "interesting data" and "action I can take today"

Current progress snapshot:
- `8 / 30` items `done`
- `13 / 30` items `in_progress`
- `8 / 30` items `not_started`
- `1 / 30` items `reconsider`

## 1. Homepage / First Impression

### 1.1 Hero clarity and urgency
- Status: `in_progress`
- Feedback:
  - Hero promise is strong, but needs more momentum and less friction.
  - The first screen should make the next step obvious without requiring sign-in.
- What good looks like:
  - one strong headline
  - one short subhead
  - one dominant primary CTA
  - one clear secondary CTA
  - one visual proof element
- Acceptance criteria:
  - user can understand the product in under 5 seconds
  - user sees a search flow and a story-sharing flow immediately
  - no filler cards on the first screen

### 1.2 Social proof and scale signal
- Status: `not_started`
- Feedback:
  - Add scale framing like yearly denial volume, number of public stories, and why this matters now.
  - Add stronger proof than just "sign in" or generic stats.
- Acceptance criteria:
  - homepage includes one public-record count
  - homepage includes one denial-system scale stat
  - homepage includes one “why this matters now” proof source

### 1.3 Demo-led first-use loop
- Status: `in_progress`
- Feedback:
  - Homepage should show value instantly with search, example chips, suggestions, and maybe one visible sample result.
  - Search should feel like a live demo, not an empty form.
- Acceptance criteria:
  - search examples animate cleanly
  - chips populate the search
  - at least one example result or visible outcome is shown without sign-in

### 1.4 Homepage visual system
- Status: `in_progress`
- Feedback:
  - The overall design still needs to be calmer, more intentional, and less cluttered.
  - Needs better hierarchy, spacing, and a more polished “AI-first” product aesthetic.
- Acceptance criteria:
  - fewer competing card styles
  - more whitespace and layout rhythm
  - visual sections clearly distinguished by spacing, contrast, and purpose

## 2. Navigation and Crawlable Site Structure

### 2.1 Public daughter-page URLs
- Status: `done`
- Notes:
  - `/fight-back`, `/share-your-story`, `/evidence-patterns`, `/data-products`, and `/about-trust` now exist as routed app destinations.

### 2.2 Public discoverability / crawlable structure
- Status: `done`
- Feedback:
  - Site still needs clearer public structure, footer links, and indexable support content.
- Acceptance criteria:
  - footer nav exists
  - basic sitemap structure is visible
  - support pages are reachable without hunting inside the app

## 3. /fight-back

### 3.1 Strong upload-first landing
- Status: `in_progress`
- Feedback:
  - Needs a cleaner “Your denial just got a lawyer” style flow.
  - Upload box should dominate visually.
  - Right rail should show short tactical value, not paragraphs.
- Acceptance criteria:
  - upload is the main object above the fold
  - 3 short “what wins appeals” bullets visible immediately
  - one dominant CTA for upload and appeal generation

### 3.2 Better success guidance
- Status: `in_progress`
- Feedback:
  - Appeal guidance should be sourced from best-practice legal and advocacy materials.
  - Need concrete “what works / what does not” guidance.
- Acceptance criteria:
  - page includes a sourced “success tips” section
  - at least 5 concise appeal best practices
  - tips are grounded in CMS, DOL, PAF, state external-review, or similar sources

### 3.3 Side-by-side appeal proof
- Status: `not_started`
- Feedback:
  - Show weak appeal vs stronger evidence-backed appeal.
- Acceptance criteria:
  - one before/after example
  - one redacted successful appeal structure example

## 4. /share-your-story

### 4.1 Story-first intake
- Status: `done`
- Notes:
  - Story-first intake, seeded search query carryover, optional upload, and editable extracted fields are already in place.

### 4.2 Emotional payoff and contribution framing
- Status: `in_progress`
- Feedback:
  - Need stronger messaging that users are building leverage, not just venting.
- Acceptance criteria:
  - page explains what happens after submission
  - page explains anonymization and public-record contribution clearly
  - page includes stronger “why your story matters” framing

### 4.3 Faster structured input
- Status: `in_progress`
- Feedback:
  - Common denial reasons, plan types, and service categories should be easier to pick.
- Acceptance criteria:
  - add common structured pickers or suggestions
  - reduce time-to-submit for a typical user

## 5. /evidence-patterns

### 5.1 Remove internal jargon
- Status: `in_progress`
- Feedback:
  - Public page should not use builder language like “cleaned slice,” “raw observatory rows,” or “warehouse.”
  - Every module needs a “so what.”
- Acceptance criteria:
  - every chart or card answers a patient question
  - no internal pipeline language appears in public copy

### 5.2 Replace tiny-count widgets with stronger aggregates
- Status: `in_progress`
- Feedback:
  - The page should lean on warehouse-scale patterns, not only tiny public-slice clusters.
- Acceptance criteria:
  - lead modules use broader aggregates like treatment x denial reason, plan type x denial reason, insurer over-index, and trend composition
  - no hero section depends on 2–15 story micro-clusters

### 5.3 Searchable clean story browser
- Status: `in_progress`
- Feedback:
  - Users need a clear story database page with short previews, expansion on demand, and clean filters.
  - Current long raw-text cards feel noisy and untrustworthy.
- Acceptance criteria:
  - story cards show title, short summary, denial tag, insurer/plan tag, and action tag
  - only a short preview is visible by default
  - expansion is user-triggered
  - search/filter UX is clean and readable

### 5.4 True visual dashboard layer
- Status: `not_started`
- Feedback:
  - Need strong visual analytics: denial share, state maps, trends, exports, and appeal citations.
- Acceptance criteria:
  - one visual dashboard page or section exists
  - includes insurer share, state view, trends over time
  - supports export or citation copy for appeals

## 6. /data-products

### 6.1 Keep or kill page decision
- Status: `reconsider`
- Feedback:
  - If we do not have real usable sellable data products yet, this page may hurt trust more than help.
- Decision question:
  - Do we have a credible B2B offer now?
  - If not, should we hide this behind a simpler “for advocates / researchers” placeholder?

### 6.2 Real productization
- Status: `in_progress`
- Feedback:
  - If retained, this page needs real product concepts, not just vague monetization language.
- Acceptance criteria:
  - audience-specific offers for lawyers, hospitals, regulators
  - one sentence each describing actual value
  - realistic CTA like `Request a Demo`

## 7. /about-trust

### 7.1 Clear public-interest framing
- Status: `done`
- Feedback:
  - The page should explain why this exists, how stories are anonymized, and why the database is different.
- Acceptance criteria:
  - one strong “why this exists” paragraph
  - visible privacy posture
  - clear methodology summary

## 8. Data Visualization Layer

### 8.1 Hero-level big-picture view
- Status: `not_started`
- Feedback:
  - Add denial trend line, insurer share, and denial reason breakdown with immediate emotional reassurance.
- Acceptance criteria:
  - one “you are not alone” macro view
  - one insurer share chart
  - one denial reason chart

### 8.2 Interactive filters and drill-downs
- Status: `not_started`
- Feedback:
  - Need insurer, plan type, denial reason, treatment category, state, and date filters that update the visuals in real time.
- Acceptance criteria:
  - multi-select filters
  - fast in-page updates
  - clear reset state

### 8.3 Pattern deep dives
- Status: `not_started`
- Feedback:
  - Need word-pattern views, trend shifts, and stronger evidence modules people can actually attach to appeals.
- Acceptance criteria:
  - exact repeated denial phrase view
  - treatment-specific trend view
  - appeal-ready insight module

### 8.4 Export and citation tools
- Status: `not_started`
- Feedback:
  - Users should be able to export a filtered view or copy an appeal citation.
- Acceptance criteria:
  - export current dashboard view
  - copy ready-made citation text

## 9. Data Quality and BigQuery Analytics

### 9.1 BigQuery-first insight modeling
- Status: `in_progress`
- Notes:
  - Broader question-first marts and anomaly views have started.
  - Public site is not yet fully driven by those stronger summaries.

### 9.2 Promotion gap between warehouse and public site
- Status: `in_progress`
- Feedback:
  - The warehouse has more signal than the public site is showing.
  - Need better promotion logic so useful rows appear in public evidence faster.
- Acceptance criteria:
  - public page uses stronger warehouse-backed aggregates
  - counts shown publicly reflect meaningful warehouse summaries where appropriate

### 9.3 Entity resolution and normalization
- Status: `in_progress`
- Notes:
  - Narrative text no longer contaminates insurer labels.
  - Payer attribution, plan-type capture, and same-treatment clustering still need improvement.

### 9.4 Questions users are asking
- Status: `in_progress`
- Current usable question families:
  - “Is this a prior-auth fight or an exclusion fight?”
  - “Do people with my type of plan get denied this way a lot?”
  - “Does my insurer keep using this excuse?”
  - “What treatment categories are getting blocked most often?”
- Next step:
  - map homepage and evidence modules directly to these questions

## 10. Data-source expansion

### 10.1 Higher-fidelity source density
- Status: `in_progress`
- Feedback:
  - Connected sources exist, but the deeper harvester unlock has not happened yet.
- Acceptance criteria:
  - premium sources produce meaningful volume
  - public evidence quality is less dominated by broad Reddit chatter

### 10.2 Manual-review / partnership sources
- Status: `in_progress`
- Feedback:
  - Facebook, X, Quora, forums, and member-gated patient communities need careful handling.
- Acceptance criteria:
  - track these sources explicitly
  - do not silently overinvest in low-yield or risky lanes

## Immediate next focus

### This sprint
- [ ] Fix the remaining public evidence modules so they render stronger warehouse insights instead of weak tiny-count cards.
- [ ] Create a dedicated data-visualizations / dashboard experience or equivalent evidence dashboard section.
- [ ] Clean up the public story browser so it feels polished and readable on desktop and mobile.
- [ ] Decide whether `/data-products` stays visible in its current form.
- [ ] Tighten homepage proof modules around real user value instead of generic stats.

### Already moving
- [x] Story-first intake is live.
- [x] Public routed daughter pages exist.
- [x] Search-led homepage entry flow exists.
- [x] Live story browser and cleaner story previews have started.
- [x] BigQuery question-first analytics work has started.
