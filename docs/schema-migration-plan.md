# Insurance Denial Observatory Schema Plan

## Working assumptions

- The existing app currently reads and writes the legacy `denials` collection.
- Firestore already exists in project `gen-lang-client-0873843790`, database `ai-studio-d87ac17c-197c-42bb-bade-90f55fdfd75b`.
- We need a migration-safe path that keeps the current app working while introducing the real long-term observatory schema.

## Target collections

- `users`
  - Private profile metadata aligned with Firebase Auth.
- `stories`
  - Primary observatory entity with structured coverage, clinical, narrative, timeline, privacy, source, and benchmark sections.
- `stories/{storyId}/appeals`
  - Appeal history with level, date, outcome, generated letter metadata.
- `stories/{storyId}/events`
  - Audit and workflow timeline.
- `story_documents`
  - Private upload metadata for denial letters, EOBs, and evidence files in Storage.
- `analytics`
  - Global denormalized aggregate docs for homepage and dashboard use.
- `ingestion_runs`
  - Operational provenance for sync jobs and public-source crawls.
- `source_records`
  - Raw harvested records retained for dedupe and traceability.

## Legacy compatibility

The current app still depends on `denials` fields like:

- `insurer`
- `planType`
- `procedure`
- `denialReason`
- `date`
- `status`
- `narrative`
- `tags`
- `isPublic`
- `userId`

To avoid a hard cutover, the repo now includes a mapper:

- [storyMapper.ts](C:\Users\sashi\OneDrive\CODEX%20Projects\FightInsuranceDenials-working\src\lib\storyMapper.ts)

That file exists to support these phases:

1. Continue reading legacy records.
2. Start dual-writing new submissions into `stories`.
3. Backfill or transform old `denials` docs into `stories`.
4. Gradually update UI queries from `denials` to `stories`.

## Mapping summary

Legacy `denials` to `stories`:

- `insurer` -> `coverage.extracted_insurer`
- `planType` -> `coverage.plan_type`
- `procedure` -> `clinical.procedure_condition`
- `denialReason` -> `clinical.denial_reason_normalized`
- `denialQuote` -> `clinical.denial_reason_raw`
- `summary` -> `narrative.patient_narrative_summary`
- `narrative` -> `narrative.why_unfair_patient_quote`
- `date` -> `timeline.date_of_denial`
- `appealDeadline` -> `timeline.appeal_deadline`
- `createdAt` -> `timeline.submission_timestamp`
- `isPublic` + research flags -> `privacy.consent_level`
- `fileUrl` -> `privacy.raw_upload_url`
- `source` + `url` -> `source.source_label` and `source.source_url`

## Next implementation steps

1. Add dual-write for submissions so every new story writes both a `stories` doc and a compatibility `denials` doc.
2. Move dashboard and insights readers to a shared query adapter that can consume either collection.
3. Create admin migration scripts to:
   - normalize insurer names
   - dedupe by source URL and document hash
   - compute benchmark snapshots
   - publish only anonymized stories with `consent_level == public_story`
4. Add Storage rules for private uploads.
5. Add BigQuery export jobs or Cloud Functions for analytics tables.

## Blockers requiring credentials or console access

- Firestore admin inspection and migration execution requires Google Cloud credentials or a Firebase service account.
- Storage rules and bucket inspection require Firebase console or CLI-auth access.
- BigQuery dataset creation requires project-level permissions.
