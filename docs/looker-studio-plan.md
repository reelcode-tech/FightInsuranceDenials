# Looker Studio Plan

Use BigQuery views instead of raw tables for dashboards.

Recommended views:

- `v_patterns_clean`
  - Main clean evidence layer for charts and table exploration.
- `v_insurer_category_heatmap`
  - Best for insurer x denial-category heatmaps.
- `v_procedure_clusters`
  - Best for procedures, drugs, surgeries, and treatment cluster charts.
- `v_state_patterns_clean`
  - Use carefully; only rows with more trustworthy state extraction.
- `v_source_mix`
  - Monitor source composition and source quality.
- `v_data_quality_monitor`
  - Explicitly show where the dataset is still weak.

Recommended first Looker Studio dashboards:

1. Observatory Overview
   - Total clean pattern rows
   - Top insurers
   - Top denial categories
   - Top procedures
   - Source mix

2. Evidence Patterns
   - Insurer x denial category heatmap
   - Procedure clusters
   - Insurer x procedure table
   - Filters for source, insurer, denial category

3. Data Quality
   - Unknown insurer rate
   - Unknown category rate
   - Generic procedure rate
   - Missing/suspicious state extraction

Key caution:

Do not present state insights without the quality dashboard next to them. `OR` is currently over-extracted and can mislead.
