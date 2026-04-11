# Neon Operational Plan

## Why Neon

Neon is the new operational database for Fight Insurance Denials.

It will replace Firestore for the structured product data that should live in a relational store:

- user-linked cases
- curated stories
- raw observation staging
- appeal records
- benchmark snapshots

## Why This Helps

- avoids Firestore read-cap pain
- makes ingestion and dedupe more predictable
- gives us SQL joins and indexes for structured denial data
- pairs naturally with BigQuery for warehouse analytics

## Split Of Responsibilities

### Neon

Use for:

- operational source of truth
- normalized story and case records
- user-linked private workflows
- appeal generation and tracking
- curated public observatory reads

### BigQuery

Use for:

- analytical warehouse
- source-scale observation storage
- heavy aggregations
- trend and anomaly analysis
- B2B exports and reporting

## Core Neon Tables

- `source_records`
- `raw_web_observations`
- `curated_stories`
- `benchmark_snapshots`
- `insurer_daily_metrics`
- `app_users`
- `user_cases`
- `appeals`

## Migration Direction

1. Keep current app running.
2. Use Neon for new operational schema.
3. Use BigQuery for scaled ingestion and analytics.
4. Gradually retire Firestore from the critical path.
