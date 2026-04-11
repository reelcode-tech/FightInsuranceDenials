CREATE OR REPLACE VIEW `{{PROJECT_ID}}.{{DATASET_ID}}.v_procedure_clusters` AS
SELECT
  procedure_normalized AS procedure,
  insurer_normalized AS insurer,
  denial_category,
  COUNT(*) AS story_count,
  ROUND(AVG(quality_score), 1) AS avg_quality_score
FROM `{{PROJECT_ID}}.{{DATASET_ID}}.v_patterns_clean`
WHERE has_specific_procedure
GROUP BY procedure, insurer, denial_category
HAVING story_count >= 3;

