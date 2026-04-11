# Warehouse Sync Plan

## Goal

Keep BigQuery as the analytical warehouse and Neon as the operational relational store.

## Direction

- BigQuery ingests broad public-source observations at scale.
- Neon receives synced operational subsets for:
  - curated product reads
  - user-facing workflows
  - appeal and case management
  - app-friendly SQL access

## Current Sync Scripts

- `sync-bigquery-source-records-to-neon.ts`
- `sync-bigquery-raw-observations-to-neon.ts`
- `inspect-neon-counts.ts`

## Sync Order

1. sync `source_records`
2. sync `raw_web_observations`
3. promote stronger records into `curated_stories`
4. populate `benchmark_snapshots`
5. populate `insurer_daily_metrics`

## Why This Matters

This lets us:

- ingest widely without stressing the app database
- keep operational reads fast and predictable
- preserve the option to run heavy analytics in BigQuery
- avoid the Firestore read-cap trap entirely
