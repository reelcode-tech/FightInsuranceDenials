# Public Source Matrix

This is the working source map for expanding the observatory without drifting into legally risky or low-value scraping.

## Scrape Now

These sources are public, relevant, and likely to yield either structured benchmarks or useful patient narratives after cleanup.

### Official / Benchmark Sources

- CMS prior authorization rules and reporting materials
- HHS OIG reports on Medicare Advantage denials and prior authorization
- New York DFS appeal guidance and annual reporting
- KFF analyses built on insurer-reported denial and appeal data
- DOL mental health parity materials

### Investigative / Public Interest Sources

- ProPublica health insurance investigations
- STAT reporting on algorithmic or systemic denial patterns

### Public Narrative Communities

- Reddit
  - Prioritize targeted terms and relevant subreddits over broad subreddit crawling
  - Weight as public narrative evidence, not ground truth
- AARP community forums
  - High-value for Medicare Advantage and older-user pain points
- Breastcancer.org community
  - High-value for treatment access, reconstruction, imaging, drug, and appeals narratives
- ConsumerAffairs
  - Useful for insurer-specific complaint clustering
- BBB complaints
  - Useful for insurer response patterns and recurring administrative failures

## Manual Review Only

These sources may be public but need heavier curation before anything becomes a structured observatory record.

- YouTube comments on denial-related investigative or advocacy videos
- Public Facebook page comments from insurers, advocates, and news outlets
- Public X / Threads discussions
- Condition-specific forums with mixed insurance and treatment chatter

## Partnership Needed

These are promising but should be approached through formal access, export, or partnership rather than scraping.

- PatientsLikeMe
- HealthUnlocked
- Private Facebook groups
- Closed caregiver or diagnosis-specific communities
- Any member-only support network where users reasonably expect a more private context

## Do Not Treat As Primary Evidence

These may still be useful for keyword discovery, but should not become the backbone of the observatory.

- Generic complaint spam sites
- Low-context review farms
- Posts without identifiable insurer, denial reason, procedure, or appeal facts
- Anything clearly about non-health insurance

## Data Weighting Model

Every ingested record should carry a source weight.

- `official_regulatory`
  - Highest trust for benchmarking, overturn rates, deadlines, and policy rules
- `investigative`
  - High trust for systemic pattern identification
- `public_patient_forum`
  - Medium trust for narrative evidence and issue discovery
- `complaint_platform`
  - Lower trust, useful for clustering and language mining
- `social_chatter`
  - Lowest trust, useful mainly for discovery and anomaly hints

## What To Pull From Each Source

- Official sources
  - Insurer
  - jurisdiction
  - denial category
  - appeal volume
  - reversal rate
  - timeline rules
- Investigative sources
  - tactic
  - insurer
  - procedure or service line
  - quoted denial logic
  - affected population
- Public narrative communities
  - insurer
  - procedure
  - denial reason language
  - state if present
  - appeal outcome if present
  - emotional tone and harm markers

## Cleanup Rules

- Drop posts with no insurer and no procedure unless they add clear benchmark or legal value
- Drop off-topic insurance chatter
- Deduplicate by canonical URL first, then by text fingerprint
- Normalize insurer names and denial categories at ingestion time
- Keep raw narrative text, but derive structured fields and a quality score immediately
