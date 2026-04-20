# Lessons Learned

Last updated: 2026-04-20

## 1. More connectors did not fix the product

Adding shallow sources increased activity but did not automatically create stronger public evidence. The real bottleneck was:
- normalization quality
- promotion into usable public evidence
- better evidence modeling
- better presentation

## 2. Tiny clusters are weak public product

The site was over-indexing on small insurer + procedure + category counts. Patients need broader, stronger patterns they can actually use.

Better modules:
- denial reason by treatment type
- denial reason by plan type
- insurer-family repeat excuse patterns
- state / regional reporting concentration
- trend and success-rate overlays where the data supports it

## 3. The warehouse is stronger than the site

BigQuery / warehouse findings have been consistently more useful than the public-site surfaces. A large part of the work is not finding more data, but turning existing signal into public evidence and visual explanations.

## 4. The user cares deeply about visual trust

“Improved copy” is not enough.

The user repeatedly wanted:
- fewer words
- stronger hierarchy
- more charts
- calmer, more premium visuals
- less AI-looking repetition

If the design does not visibly change, the work will not feel real to them.

## 5. Always verify the real repo and branch first

One session started inside a stale sandbox checkout that did not contain the latest production work. Always verify:
- local path
- branch
- latest commit
- whether production is already ahead of the local checkout

## 6. Count consistency matters

Visible metrics must not drift between homepage, evidence patterns, and data visualizations. The product now uses `1,173` as the public-story source of truth.

## 7. Production verification needs a better browser workflow

Deploys succeeded, but screenshot/video proof and live browser-level verification are still weaker than they should be. This remains an open process improvement.
