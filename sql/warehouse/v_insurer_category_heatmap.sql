CREATE OR REPLACE VIEW `{{PROJECT_ID}}.{{DATASET_ID}}.v_insurer_category_heatmap` AS
SELECT
  insurer_normalized AS insurer,
  denial_category,
  COUNT(*) AS story_count,
  ROUND(AVG(quality_score), 1) AS avg_quality_score
FROM `{{PROJECT_ID}}.{{DATASET_ID}}.v_patterns_clean`
WHERE has_named_insurer
  AND has_specific_category
GROUP BY insurer, denial_category
HAVING story_count >= 3;

