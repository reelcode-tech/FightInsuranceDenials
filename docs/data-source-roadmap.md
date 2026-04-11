# Data Source Roadmap

## Priority 1: safest + highest signal

- Patient document uploads
  - Best source for high-confidence denial records.
  - Pair OCR extraction with human confirmation and strong anonymization.

- Curated Reddit intake
  - Keep using Reddit only for retrieval, structured observatory records, and human-reviewed normalization.
  - Avoid using Reddit content as model-training corpus without explicit rights clearance.
  - Focus on precise subreddits and query terms tied to denials, prior auth, external review, ERISA, step therapy, specialty drugs, and out-of-network disputes.

- ProPublica investigations
  - Use as a curated systemic-evidence stream, not as bulk patient-case data.

- CMS and HHS public policy data
  - Prior authorization rules, transparency materials, No Surprises Act guidance, and appeal process materials are useful for benchmark and compliance overlays.

## Priority 2: high-value structured data

- CMS Transparency in Coverage machine-readable files
  - Valuable for expected-coverage and negotiated-rate context.
  - Requires a dedicated parser and should likely flow through a separate enrichment table instead of direct story ingestion.

- State-level external appeal data and complaint data
  - Excellent for overturn-rate benchmarking and regional trends.
  - New York DFS-style external review datasets are especially valuable.

- APCD access where permitted
  - Long lead-time, but strong research value.

## Priority 3: later or legally sensitive

- X, TikTok, Facebook Groups, PatientsLikeMe, Nextdoor
  - Valuable for signals, but access, permissions, and terms vary.
  - Use only after we define a platform-by-platform compliance policy.

## Ingestion design

For every source record, store:

- original source URL
- source type
- external record ID
- raw text or excerpt
- extraction version
- normalization version
- quality score
- low-signal flag
- duplicate fingerprint

## Cleanse strategy

Every imported record should pass through:

1. source-specific parser
2. insurer normalization
3. denial-category inference
4. low-signal / junk detection
5. duplicate scoring
6. privacy/anonymization checks
7. benchmark eligibility scoring

## Current live database observations

As of April 10, 2026, the current Firestore `denials` collection contains:

- 96 total records
- heavy concentration from Reddit sources
- high `Unknown` rates for insurer, procedure, and denial reason
- mixed schema keys such as `denialReason` and `reason`

This confirms we should treat current data as a noisy seed set and only promote normalized, higher-confidence records into the long-term `stories` collection.
