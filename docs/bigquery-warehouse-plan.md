# BigQuery Warehouse Plan

## Goal

Use BigQuery as the analytical warehouse for Fight Insurance Denials so we can ingest and analyze tens of thousands of public denial-related observations without leaning on Firestore reads.

## Dataset

- Project: `gen-lang-client-0851977632`
- Dataset: `fight_insurance_denials`

## Core Tables

### `raw_web_observations`

Raw source-level observations before curation.

Use for:
- ingesting public narrative evidence at scale
- retaining provenance
- storing text fingerprints and quality scores
- dedupe and enrichment workflows

### `curated_stories`

Normalized public stories promoted into the product.

Use for:
- homepage counters
- observatory search
- benchmarks
- AI action center retrieval

### `source_records`

Catalog of public benchmark and investigative sources.

Use for:
- compliance and traceability
- source weighting
- transparency page methodology

### `benchmark_snapshots`

Precomputed benchmark facts.

Use for:
- “your denial matches X similar cases”
- overturn-rate facts
- insurer + category + procedure guidance

### `insurer_daily_metrics`

Daily rollups for anomaly and trend detection.

Use for:
- insurer dashboards
- state and time-series charts
- B2B reports

## Why This Is Better Than Firestore For Analytics

- cheaper for large analytical scans
- better suited to aggregation and anomaly queries
- easier to partition and cluster by date, insurer, and denial category
- lets Firestore or Postgres stay focused on product operations instead of warehouse work

## Next Steps

1. Create the BigQuery dataset and core tables.
2. Add an export script from current Firestore/Firebase records into warehouse tables.
3. Add source-specific ingestion scripts that write to `raw_web_observations`.
4. Build SQL transforms from raw observations into `curated_stories` and `benchmark_snapshots`.
5. Point homepage and insights views at warehouse-derived analytics instead of recomputing from app data.
