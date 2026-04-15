# Source Inventory

This file tracks where the observatory is learning from, what is already automated, what is still only lightly seeded, and which lanes require manual review or partnership instead of scraping.

## Status legend
- `live_harvester`: automated lane is actively ingesting on the current pipeline
- `seeded_only`: source is represented in the data, but only via manual or static seed packs
- `needs_harvester`: strong candidate with enough value to justify a dedicated connector
- `manual_review`: use carefully, public-only review, or legal/compliance review before automation
- `partnership_only`: do not scrape directly; pursue partnership, consented data sharing, or manual citation only

## Live automated lanes

### Core public communities and complaint sources
| Source | Status | Current note |
| --- | --- | --- |
| Reddit denial and condition communities | `live_harvester` | Largest volume driver, still too noisy in broad communities |
| AARP Medicare Insurance Forum | `live_harvester` | Higher-fidelity stories, currently around 10 live records |
| Breastcancer.org Community | `live_harvester` | Strong payer + treatment signal, currently around 8 live records |
| ConsumerAffairs insurer complaint pages | `live_harvester` | Useful insurer naming, still moderate noise |
| Better Business Bureau complaint pages | `seeded_only` | Tracked as a target, but not yet producing rows in the active dataset |

### Official, benchmark, and policy sources
| Source | Status | Current note |
| --- | --- | --- |
| CMS prior authorization / denial rules | `live_harvester` | Benchmark and policy context, not patient-story heavy |
| HHS OIG | `live_harvester` | Structured oversight and audit signal |
| KFF / KFF Health News | `live_harvester` | Benchmark and news lane; use for "why now" cards and policy framing |
| NY DFS and other state insurance resources | `live_harvester` | Useful regulator and external-review context |
| Department of Labor parity guidance | `live_harvester` | Strong for mental health parity framing |
| Patient Advocate Foundation | `live_harvester` | Advocacy and appeals best-practice source |
| California DMHC IMR | `seeded_only` | Very high-value source, but only lightly represented so far |
| CalPERS appeal and independent-review rights | `seeded_only` | Good benchmark lane, not yet harvested deeply |

### Investigative and legal intelligence
| Source | Status | Current note |
| --- | --- | --- |
| ProPublica | `live_harvester` | Good high-trust journalism and complaint signal |
| STAT | `live_harvester` | Investigative lane for policy and systemic denials |
| CourtListener | `seeded_only` | Great legal and pattern lane, but deeper harvesting still missing |

## Higher-fidelity patient and condition communities

### Already represented in the data
| Source | Status | Current note |
| --- | --- | --- |
| Mayo Clinic Connect | `live_harvester` | Very clean narratives, currently around 10 live records |
| Cancer Survivors Network | `live_harvester` | Useful oncology denial stories, currently around 6 live records |
| Myeloma Beacon Forum | `live_harvester` | Small but high-value rare-disease treatment lane |
| HealthBoards | `live_harvester` | Small and still sparse, but strong denial-specific threads |
| Autism Speaks | `seeded_only` | Good support and appeal content, limited story volume so far |
| Alzheimer's Association | `seeded_only` | Good public-support and benefits content |
| The ALS Association | `seeded_only` | Good benefits and access signal |
| Mental Health America | `seeded_only` | Better as an advocacy benchmark than a complaint feed |

### Clear next harvesters to build
| Source | Status | Why it matters |
| --- | --- | --- |
| Cancer Support Community | `seeded_only` | Now represented in the source pack; next step is a real thread/resource harvester |
| JDRF / Breakthrough T1D | `seeded_only` | Now represented in the source pack; next step is deeper diabetes-access harvesting |
| T1International | `seeded_only` | Now represented in the source pack; next step is stronger insulin-access harvesting |
| ADHD / depression / anxiety public communities | `needs_harvester` | Mental health and neurodivergence care denials are clearly underrepresented |
| GLP-1 and obesity medication communities beyond Reddit | `needs_harvester` | High-denial, high-volume, strong plan-specific patterns |

## New candidate lanes from current research

| Source | Status | Why it matters |
| --- | --- | --- |
| PAF / PAN TotalAssist | `seeded_only` | Added to the source pack; next step is a deeper access-barrier harvester |
| KFF Health News "Bill of the Month" | `seeded_only` | Added to the source pack; next step is issue-level story harvesting |
| Dollar For | `seeded_only` | Added to the source pack; next step is deeper hospital-billing and charity-care harvesting |
| FAIR Health Consumer | `seeded_only` | Added to the source pack; next step is connecting issue guides into appeal logic |
| Commonwealth Fund insurance denial research | `seeded_only` | Added to the source pack; next step is benchmark and news-card extraction |
| ValuePenguin denial and appeals research | `seeded_only` | Added to the source pack; next step is benchmark extraction and comparison logic |
| JMIR paper `e73427` | `needs_harvester` | Research-grade signal on complaint and patient-voice patterns |
| Quora health insurance denial questions | `manual_review` | Can reveal repeated phrasing and pain points, but quality varies heavily |
| insurance-forums.com and similar boards | `manual_review` | Lower volume, older discussions, but sometimes explicit claims and appeal detail |
| Public X / Twitter complaint threads | `manual_review` | Good for rapid signal and hashtags, but noisy and context-light |
| ProPublica / investigative article comments | `manual_review` | Can surface repeat experiences, but quality and moderation vary |

## Manual-review or cautious discovery lanes

| Source | Status | Notes |
| --- | --- | --- |
| Public Facebook advocacy pages | `manual_review` | Public-only, no private or closed groups |
| Public Facebook groups | `manual_review` | Must verify public visibility and relevance; no private scraping |
| Nextdoor public references | `manual_review` | Very cautious lane, likely too local and noisy without explicit public visibility |
| YouTube comments on denial investigations | `manual_review` | Better as discovery than primary evidence |
| Smart Patients | `manual_review` | Valuable community, but treat carefully and prefer cited public content only |
| Inspire | `manual_review` | Very strong candidate for partnership; avoid blind scraping |

## Partnership-only or do-not-scrape-private lanes

| Source | Status | Notes |
| --- | --- | --- |
| Private Facebook groups | `partnership_only` | No scraping; consented or partnered access only |
| Inspire private or member-gated content | `partnership_only` | Prefer partnership or explicit permission |
| PatientsLikeMe | `partnership_only` | Do not scrape |
| HealthUnlocked private or restricted communities | `partnership_only` | Do not scrape |

## Current high-fidelity source counts

Snapshot from the live Neon published slice on `2026-04-14`:

| Source | Published rows |
| --- | ---: |
| AARP Medicare Insurance Forum | 10 |
| Mayo Clinic Connect | 10 |
| Breastcancer.org Community | 8 |
| Alzheimer's Association | 6 |
| Cancer Survivors Network | 6 |
| Autism Speaks | 4 |
| The ALS Association | 4 |
| Myeloma Beacon Forum | 3 |
| ProPublica | 2 |
| ConsumerAffairs | 1 |
| California DMHC IMR | 1 |
| HealthBoards | 1 |
| Mental Health America | 1 |

## What the tracker is telling us

- The higher-fidelity sources are cleaner than Reddit, but still under-harvested.
- The next unlock is not another one-off seed. It is dedicated thread harvesters for:
  - AARP
  - Mayo Clinic Connect
  - Breastcancer.org
  - Cancer Survivors Network
  - California DMHC IMR
  - mental-health and diabetes-access communities
- Public Facebook, X, Quora, and insurance boards should be treated as discovery or manual-review lanes first, not trusted volume lanes.
