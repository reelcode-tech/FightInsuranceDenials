# FightInsuranceDenials Todo

## Active Priorities
- [ ] Follow `TESTING.md` on every change: add regression coverage for fixes, run test/build gates, and verify the real failing path after deploy.
- [ ] Keep refining the homepage so it feels premium, emotionally grounded, and visually coherent on desktop and mobile.
- [ ] Replace the current hero image with a stronger healthcare-denial emotional image or a custom-generated visual if the current source still misses the feeling.
- [x] Tighten the homepage first screen so value, trust, and the two primary actions are clear within 5 seconds.
- [ ] Keep growing public-source ingestion toward 10,000+ raw observations while improving precision, not just volume.
- [ ] Improve extraction quality so fewer rows fall into Unknown insurer, Unknown category, or generic procedure buckets.
- [ ] Keep syncing BigQuery -> Neon -> public observatory automatically.
- [ ] Harden the public site before broader launch: uploads, rate limiting, auth boundaries, logging, secrets, abuse controls.

## Data Engine
- [ ] Add non-Reddit ingestion modules for AARP public threads.
- [ ] Add non-Reddit ingestion modules for Breastcancer.org public discussions.
- [ ] Add ingestion modules for ConsumerAffairs insurer complaint pages.
- [ ] Add ingestion modules for BBB complaint data where public pages are accessible.
- [x] Expand trusted-source seeding for GLP-1, cancer, autism, mental health, ALS, and Alzheimer’s communities and advocacy organizations.
- [x] Add a trusted public observation pack so official and community sources keep widening even when Reddit slows down.
- [x] Validate the seven source-family ingestion lanes (California IMR, Mayo Clinic Connect, GLP-1 coverage, mental health parity, cancer/rare disease, court intelligence, public Facebook discovery).
- [ ] Add better rate-limit handling and backoff for Reddit/PullPush ingestion.
- [ ] Add source weighting and confidence scoring that flows into the observatory UI.
- [ ] Add dedupe fingerprints across source text, URLs, insurer, procedure, and denial reason.
- [ ] Build periodic warehouse transforms that promote stronger rows into curated stories automatically.
- [ ] Add more benchmark snapshot generation for insurer + procedure + denial category combinations.
- [x] Add stricter pruning so generic insurance-shopping chatter is archived out of the public record instead of surfacing as denial evidence.
- [x] Expand the trusted-source pack with stronger GLP-1, IBD, autism, mental health, ADHD, and ALS denial sources.

## Product / UX
- [ ] Finish the Share Your Story intake so venting, voice-to-text, structured fields, upload, and consent feel cohesive.
- [ ] Strengthen Fight Back so upload-first appeal generation feels premium and trustworthy.
- [ ] Surface precedent-aware appeal evidence more clearly in the appeal output UI.
- [x] Improve Evidence Patterns storytelling so findings, methodology, and source context are obvious to non-technical visitors.
- [ ] Build a cleaner B2B / Data Products page with real productized offerings and pricing logic.
- [ ] Strengthen About / Transparency / Privacy with methodology, taxonomy, privacy boundaries, and trust language.
- [ ] Remove any stale or conflicting design remnants from older versions of the site.
- [x] Add a living source inventory so we can track active lanes, cautious/manual lanes, and partnership-only sources in one place.

## Deployment
- [x] Point Vercel production to the current GitHub branch/workflow instead of stale code.
- [x] Restore live production observatory APIs so Vercel serves real Neon-backed data instead of crashing routes.
- [x] Re-verify live production observatory APIs after the redesign pass so homepage and evidence pages are reading real Neon-backed data.
- [ ] Add required production environment variables to Vercel.
- [ ] Add `CRON_SECRET` in Vercel so the nightly ingest cron can run in production.
- [ ] Keep the local always-on warehouse daemon running hourly until production cron is fully armed.
- [ ] Finish and verify local login persistence for the warehouse daemon.
- [ ] Validate production auth domains and Firebase config.
- [x] Confirm fightinsurancedenials.com serves the current build and not the stale sidebar version.
- [ ] Set up a cleaner preview -> production promotion workflow for future checkpoints.

## Security / Hardening
- [ ] Add request rate limiting to public endpoints.
- [ ] Add spam / abuse protections for story submission.
- [ ] Validate and constrain file uploads by type, size, and processing path.
- [ ] Audit public vs private data boundaries around stories and uploads.
- [ ] Review secrets handling for local, Vercel, Firebase, BigQuery, and Neon.
- [ ] Add safe error handling so sensitive internals are not exposed to end users.
- [ ] Add basic audit/logging strategy without leaking health-related details.

## Done Recently
- [x] Expand high-fidelity source packs for AARP, Mayo Clinic Connect, Breastcancer.org, Cancer Survivors Network, and Myeloma Beacon, then rerun normalization and warehouse autopilot.
- [x] Add regression tests that enforce a meaningful minimum amount of seeded coverage across the higher-fidelity source families.
- [x] Add stronger payer inference from plan and PBM clues, then rerun the Neon normalization backfill across raw and curated rows.
- [x] Expand the higher-fidelity source pack with CalPERS appeal rights, Myeloma Beacon, and HealthBoards denial examples.
- [x] Rerun warehouse autopilot after the normalization pass so new source-family rows and better payer inference flow into the public record.
- [x] Tighten the public storytelling layout using cleaner Claude/Granola-style hierarchy: larger hero, simpler product loop, fewer repetitive cards, and more meaningful evidence framing.
- [x] Restructure the homepage around one sharp promise, one search-to-proof demo, and fewer repeated card layouts.
- [x] Rewrite Evidence Patterns around patient questions and "so what" takeaways instead of internal analytics language.
- [x] Add regression coverage for the new homepage demo and public-facing summary copy.
- [x] Expand the source-family pack with California CDI IMR rights material, Mounjaro coverage communities, Mental Health America, ProPublica autism-treatment reporting, and another public Facebook discovery lane.
- [x] Add shared presentation helpers and regression tests so homepage and evidence copy stay user-facing instead of drifting back into internal analytics jargon.
- [x] Rework the homepage around a cleaner action-first hero, clearer next steps, and stronger proof from the database.
- [x] Reframe Evidence Patterns around patient questions, actionable findings, and source/methodology explanation.
- [x] Expand the validated source-family pack with Mayo, Autism Speaks, and Alzheimer’s Association appeal evidence.
- [x] Set up BigQuery warehouse tables and analytics views.
- [x] Set up Neon operational schema.
- [x] Wire warehouse-backed Insights / Evidence Patterns data into the app.
- [x] Add precedent-aware appeal generation using warehouse evidence context.
- [x] Push the working branch to GitHub as `codex/schema-foundation`.
- [x] Connect the real domain in Vercel / Cloudflare.
- [x] Restore the stronger homepage hook and simpler observatory positioning copy.
- [x] Prove production Neon connectivity with a live database canary and move the public observatory APIs onto self-contained serverless handlers.

