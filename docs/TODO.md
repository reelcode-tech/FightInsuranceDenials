# FightInsuranceDenials Todo

## Active Priorities
- [ ] Redesign the homepage hero so it feels human, emotionally grounded, and visually coherent on desktop and mobile.
- [ ] Replace the current hero image with a stronger healthcare-denial emotional image or a custom-generated visual if the current source still misses the feeling.
- [ ] Tighten the homepage first screen so value, trust, and the two primary actions are clear within 5 seconds.
- [ ] Keep growing public-source ingestion toward 10,000+ raw observations while improving precision, not just volume.
- [ ] Improve extraction quality so fewer rows fall into Unknown insurer, Unknown category, or generic procedure buckets.
- [ ] Keep syncing BigQuery -> Neon -> public observatory automatically.
- [ ] Harden the public site before broader launch: uploads, rate limiting, auth boundaries, logging, secrets, abuse controls.

## Data Engine
- [ ] Add non-Reddit ingestion modules for AARP public threads.
- [ ] Add non-Reddit ingestion modules for Breastcancer.org public discussions.
- [ ] Add ingestion modules for ConsumerAffairs insurer complaint pages.
- [ ] Add ingestion modules for BBB complaint data where public pages are accessible.
- [ ] Expand trusted-source seeding for GLP-1, cancer, autism, mental health, ALS, and Alzheimer’s communities and advocacy organizations.
- [ ] Add better rate-limit handling and backoff for Reddit/PullPush ingestion.
- [ ] Add source weighting and confidence scoring that flows into the observatory UI.
- [ ] Add dedupe fingerprints across source text, URLs, insurer, procedure, and denial reason.
- [ ] Build periodic warehouse transforms that promote stronger rows into curated stories automatically.
- [ ] Add more benchmark snapshot generation for insurer + procedure + denial category combinations.

## Product / UX
- [ ] Finish the Share Your Story intake so venting, voice-to-text, structured fields, upload, and consent feel cohesive.
- [ ] Strengthen Fight Back so upload-first appeal generation feels premium and trustworthy.
- [ ] Surface precedent-aware appeal evidence more clearly in the appeal output UI.
- [ ] Improve Evidence Patterns storytelling so findings, methodology, and data quality are obvious to non-technical visitors.
- [ ] Build a cleaner B2B / Data Products page with real productized offerings and pricing logic.
- [ ] Strengthen About / Transparency / Privacy with methodology, taxonomy, privacy boundaries, and trust language.
- [ ] Remove any stale or conflicting design remnants from older versions of the site.

## Deployment
- [x] Point Vercel production to the current GitHub branch/workflow instead of stale code.
- [ ] Add required production environment variables to Vercel.
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
- [x] Set up BigQuery warehouse tables and analytics views.
- [x] Set up Neon operational schema.
- [x] Wire warehouse-backed Insights / Evidence Patterns data into the app.
- [x] Add precedent-aware appeal generation using warehouse evidence context.
- [x] Push the working branch to GitHub as `codex/schema-foundation`.
- [x] Connect the real domain in Vercel / Cloudflare.
- [x] Restore the stronger homepage hook and simpler observatory positioning copy.

