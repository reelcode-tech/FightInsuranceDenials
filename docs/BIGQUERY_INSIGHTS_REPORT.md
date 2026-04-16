# BigQuery Insights Report

Last updated: 2026-04-16

This report summarizes the strongest warehouse-scale findings from BigQuery so we can decide what belongs on the public site, what should stay internal, and what still needs better normalization before it is safe to present confidently.

## 1. Usable warehouse signal

Filtered to non-low-signal rows in BigQuery:

- usable rows: `14,202`
- unknown insurer rows: `8,148`
- unknown denial category rows: `3,453`
- generic procedure rows: `2,357`

What this means:
- We have much more signal in the warehouse than the public site is currently surfacing.
- The public evidence layer is under-promoting usable warehouse insight.
- The biggest remaining blocker is still payer attribution.

## 2. Strongest denial categories

Top denial reasons in the usable warehouse:

1. `Prior Authorization` — `2,808`
2. `Medical Necessity` — `2,612`
3. `Coverage Exclusion` — `1,981`
4. `Administrative` — `1,693`
5. `Out of Network` — `1,223`
6. `Eligibility` — `241`
7. `Step Therapy` — `150`
8. `Experimental` — `41`

Public-site implication:
- The site should stop acting like denials are one generic bucket.
- The public evidence experience should clearly separate:
  - prior-authorization fights
  - medical-necessity fights
  - coverage-exclusion fights
  - administrative / eligibility breakdowns

## 3. Strongest treatment and service fights

Top procedure or service buckets:

1. `Prescription medication` — `1,229`
2. `Therapy services` — `1,194`
3. `Cancer treatment and oncology care` — `1,092`
4. `GLP-1 medication` — `893`
5. `Claims processing disputes` — `748`
6. `Surgery` — `548`
7. `Independent medical review` — `496`
8. `Fertility treatment` — `446`
9. `MRI` — `320`
10. `ALS care and durable medical equipment` — `318`
11. `Infusion therapy` — `290`
12. `Breast reconstruction revision care` — `266`

Public-site implication:
- These are large enough to support user-facing modules.
- We should organize public evidence around treatment families, not only insurers.

## 4. Strongest repeat treatment x denial patterns

Most repeated warehouse combinations:

1. `Claims processing disputes + Administrative` — `717`
2. `Therapy services + Out of Network` — `505`
3. `Independent medical review + Medical Necessity` — `496`
4. `Cancer treatment and oncology care + Medical Necessity` — `473`
5. `Cancer treatment and oncology care + Prior Authorization` — `457`
6. `Prescription medication + Prior Authorization` — `454`
7. `GLP-1 medication + Prior Authorization` — `404`
8. `GLP-1 medication + Coverage Exclusion` — `332`
9. `Breast reconstruction revision care + Coverage Exclusion` — `266`
10. `Surgery + Medical Necessity` — `247`
11. `ABA therapy + Medical Necessity` — `216`
12. `Autism therapy + Coverage Exclusion` — `211`
13. `ALS care and durable medical equipment + Prior Authorization` — `209`
14. `Therapy services + Coverage Exclusion` — `205`
15. `Prescription medication + Coverage Exclusion` — `185`

Public-site implication:
- These are much stronger than the tiny public micro-clusters we have been leaning on.
- The evidence page should highlight these broader patterns as “repeat fights patients keep running into.”

## 5. What the data says by treatment type

### GLP-1 medication
- `Prior Authorization` — `404`
- `Coverage Exclusion` — `332`

Interpretation:
- GLP-1 denials are not just a prior-auth story.
- They are also a plan-exclusion story.
- Public question to answer:
  - “Is my GLP-1 denial a paperwork fight or a plan-language fight?”

### Fertility treatment
- `Prior Authorization` — `126`
- `Medical Necessity` — materially lower
- `Coverage Exclusion` — materially lower

Interpretation:
- Fertility denials are primarily surfacing as prior-auth fights in the warehouse.
- Public question to answer:
  - “Are fertility denials mostly about prior authorization barriers?”

### Cancer treatment and oncology care
- `Medical Necessity` — `473`
- `Prior Authorization` — `457`

Interpretation:
- Cancer denials are split between medical-necessity fights and prior-auth delay fights.
- Public question to answer:
  - “Is this cancer denial a clinical-proof fight or a pre-approval delay fight?”

### Therapy services
- `Out of Network` — `505`
- `Coverage Exclusion` — `205`
- `Prior Authorization` — present but not leading

Interpretation:
- Therapy denials are often not just “medical necessity.”
- They are frequently network-access and plan-exclusion fights.
- Public question to answer:
  - “Is my therapy denial really about network access?”

### Surgery
- `Medical Necessity` — `247`
- `Out of Network` — `91`

Interpretation:
- Surgery denials skew strongly medical necessity.
- Public question to answer:
  - “Do surgery denials usually hinge on proving medical necessity?”

## 6. What the data says by plan type

Strong plan-type patterns:

- `Commercial + Medical Necessity` — `634`
- `Medicare Advantage + Prior Authorization` — `301`
- `Medicare Advantage + Administrative` — `247`
- `Medicare Advantage + Medical Necessity` — `233`
- `Employer Sponsored + Medical Necessity` — `223`
- `Medicare Supplement + Administrative` — `150`
- `Medicare + Administrative` — `136`
- `Medicare + Medical Necessity` — `124`
- `Marketplace + Administrative` — `114`
- `Medicare Advantage + Eligibility` — `106`

Interpretation:
- Commercial and employer-sponsored plans skew medical necessity.
- Medicare Advantage is a mixed trap: prior auth, admin, and medical necessity all show up heavily.
- Marketplace plans skew administrative.

Public-site implication:
- We can help users answer:
  - “Is this the kind of denial people with my plan type keep getting?”

## 7. What the data says by insurer family

Strong insurer-family patterns:

- `UnitedHealthcare + Prior Authorization` — `416`
- `UnitedHealthcare + Administrative` — `373`
- `Blue Cross Blue Shield + Medical Necessity` — `330`
- `UnitedHealthcare + Medical Necessity` — `250`
- `Medicare + Administrative` — `207`
- `UnitedHealthcare + Coverage Exclusion` — `191`
- `Blue Cross Blue Shield + Out of Network` — `143`
- `Blue Cross Blue Shield + Coverage Exclusion` — `131`
- `Cigna + Administrative` — `115`
- `Medicare Advantage organizations + Medical Necessity` — `107`
- `ACA marketplace insurers + Administrative` — `107`
- `Medicare + Eligibility` — `75`
- `Tricare + Coverage Exclusion` — `75`

Interpretation:
- UnitedHealthcare is not just a prior-auth story. Administrative denials are also a major repeat pattern.
- Blue Cross Blue Shield shows a stronger medical-necessity and network pattern than the current public page makes obvious.
- Cigna over-indexes on administrative fights in the warehouse.

Public-site implication:
- The public evidence page should highlight insurer-specific denial tendencies, not just top-insurer counts.

## 8. Best public questions we can already answer

These are the strongest user questions the current warehouse can answer well:

1. Is my denial mostly a prior-authorization fight or a plan-exclusion fight?
2. Do people with my type of plan get denied this way a lot?
3. Does my insurer keep using the same excuse repeatedly?
4. What kind of care is getting blocked the most right now?
5. Are therapy denials really about network access more than medicine?
6. Are GLP-1 denials mostly prior-auth barriers or explicit exclusions?
7. Are cancer denials showing up more as medical-necessity disputes or authorization delays?
8. Are Medicare Advantage denials skewing administrative and eligibility problems?

## 9. What should go on the public site next

### Highest-value public modules
- Denial reason share by treatment family
- Denial reason share by plan type
- Insurer-family repeat excuse cards
- Treatment-specific “what this usually means” modules
- State and trend views only after we verify they are stable enough for public use

### What should stay internal for now
- raw anomaly spikes that may partly reflect ingestion timing
- weak or low-volume state slices
- any analysis still heavily dependent on unknown-insurer rows

## 10. Gaps still limiting confidence

1. Unknown insurer remains too high.
2. Public promotion is still weaker than warehouse signal.
3. Some high-value warehouse patterns are not yet visible on the site.
4. We still need cleaner entity resolution and more trustworthy state and plan coverage in certain slices.

## 11. Recommended next implementation steps

1. Replace weak tiny-count evidence modules with warehouse-backed broader aggregates.
2. Add a dedicated data-visualization / dashboard experience.
3. Build public modules around the “best public questions” above.
4. Keep improving payer attribution so more warehouse signal can be surfaced safely.
5. Use this report as the reference point for future evidence-page rewrites.

