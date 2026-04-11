# Firestore Quota Note

## What we hit

The current Firestore database is enforcing the free-tier daily read-unit ceiling:

- `RESOURCE_EXHAUSTED`
- `Free daily read units per project (free tier database)`

This means we can still build the product and keep writing smarter scripts, but any read-heavy migration, dedupe pass, or analytics rebuild has to be careful or it will stall until the daily quota resets.

## What this means for the observatory

- Write-heavy, idempotent seed scripts are fine.
- Repeated full-collection scans are not fine on this database as currently configured.
- The app should prefer precomputed analytics docs over recalculating from raw collections on every page load.
- Ingestion should use deterministic document IDs and provenance records to avoid duplicate-check reads.

## Practical mitigation

1. Keep the public observatory on precomputed `analytics/current`.
2. Use deterministic IDs for curated seed imports.
3. Batch future migrations into off-peak windows instead of repeated ad hoc scans.
4. If possible, move the production observatory data to a Firestore database configuration that is not locked to free-tier read ceilings, or export analytical workloads to BigQuery.

## Why BigQuery matters

This project will eventually win on cross-source analysis, not CRUD. Once enough structured records exist, BigQuery becomes the right place for:

- insurer and procedure trend queries
- overturn-rate benchmarking
- anomaly detection across time windows
- partner-grade exports for employers, lawyers, hospitals, and regulators
