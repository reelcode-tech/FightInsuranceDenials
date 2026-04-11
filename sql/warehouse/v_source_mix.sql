CREATE OR REPLACE VIEW `{{PROJECT_ID}}.{{DATASET_ID}}.v_source_mix` AS
SELECT
  source_type,
  source_label,
  COUNT(*) AS story_count,
  ROUND(AVG(quality_score), 1) AS avg_quality_score,
  COUNTIF(insurer_normalized = 'Unknown') AS unknown_insurer_count,
  COUNTIF(denial_category = 'Unknown') AS unknown_category_count
FROM `{{PROJECT_ID}}.{{DATASET_ID}}.raw_web_observations`
WHERE COALESCE(is_low_signal, FALSE) = FALSE
GROUP BY source_type, source_label;

