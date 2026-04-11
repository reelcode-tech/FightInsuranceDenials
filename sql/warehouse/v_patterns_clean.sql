CREATE OR REPLACE VIEW `{{PROJECT_ID}}.{{DATASET_ID}}.v_patterns_clean` AS
SELECT
  observation_id,
  canonical_url,
  source_type,
  source_label,
  source_weight,
  title,
  story_excerpt,
  raw_text,
  insurer_normalized,
  procedure_normalized,
  denial_category,
  denial_reason_raw,
  state,
  plan_type,
  erisa_status,
  quality_score,
  source_published_at,
  ingested_at,
  CASE
    WHEN insurer_normalized IN ('Unknown', 'Multiple insurers') THEN FALSE
    ELSE TRUE
  END AS has_named_insurer,
  CASE
    WHEN denial_category = 'Unknown' THEN FALSE
    ELSE TRUE
  END AS has_specific_category,
  CASE
    WHEN procedure_normalized = 'Insurance denial evidence' THEN FALSE
    ELSE TRUE
  END AS has_specific_procedure,
  CASE
    WHEN state = 'OR' AND NOT REGEXP_CONTAINS(LOWER(raw_text), r'\boregon\b') THEN FALSE
    WHEN state IS NULL OR state = '' THEN FALSE
    ELSE TRUE
  END AS trustworthy_state
FROM `{{PROJECT_ID}}.{{DATASET_ID}}.raw_web_observations`
WHERE COALESCE(is_low_signal, FALSE) = FALSE
  AND quality_score >= 70;

