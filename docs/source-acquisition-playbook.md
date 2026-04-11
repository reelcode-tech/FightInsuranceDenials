# Source Acquisition Playbook

## Mission

Build the best cleaned public-interest database of health insurance denials by combining:

- official benchmarks
- investigative reporting
- public patient narratives
- complaint-platform evidence

The competitive advantage is not raw scraping volume alone. It is:

- finding fragmented evidence across many silos
- normalizing it into a common schema
- deduping and weighting it
- turning it into usable benchmarks and anomaly detection

## Source Strategy

### Tier 1: Benchmark Truth

Pull aggressively from:

- CMS
- HHS OIG
- KFF
- state insurance departments
- DOL parity resources
- NAIC-linked reporting references

Use for:

- reversal rates
- denial categories
- timelines
- state rules
- insurer-level benchmark framing

### Tier 2: High-Signal Narrative

Pull aggressively from:

- ProPublica
- STAT
- AARP
- Breastcancer.org
- targeted Reddit communities

Use for:

- quoted denial logic
- patient harm narratives
- procedure and drug access patterns
- insurer-specific tactics

### Tier 3: Complaint Clustering

Pull selectively from:

- ConsumerAffairs
- BBB

Use for:

- insurer clustering
- admin failure patterns
- escalation patterns

Do not over-weight these sources in benchmarks.

## Extraction Rules

Always try to pull:

- canonical URL
- source type
- title
- raw text or excerpt
- insurer raw and normalized
- procedure raw and normalized
- denial reason raw
- denial category
- plan type if present
- ERISA status if inferable
- appeal outcome if explicit
- quality score
- low-signal flag

## Cleaning Rules

- Remove obvious non-health-insurance records
- Remove low-context complaint spam
- Normalize insurer aliases immediately
- Normalize denial categories immediately
- Keep raw text, but separate it from curated story fields
- Assign source weight at ingestion time
- Use deterministic IDs and fingerprints so repeated imports are cheap

## BigQuery Flow

1. New web observations go into `raw_web_observations`
2. SQL or ETL promotes stronger records into `curated_stories`
3. Benchmarks and rollups populate `benchmark_snapshots`
4. Daily trend and anomaly facts populate `insurer_daily_metrics`

## Smart Growth Principle

We do not need every mention on the internet.

We need the highest-yield mix of:

- broad source coverage
- strong normalization
- careful dedupe
- reliable benchmark generation

That is how we become the single place where fragmented denial reality becomes usable intelligence.
