SELECT
  source_label,
  COUNT(*) AS observation_count,
  ROUND(AVG(COALESCE(quality_score, 0)), 2) AS average_quality_score
FROM `{{PROJECT_ID}}.{{DATASET_ID}}.raw_web_observations`
GROUP BY source_label
ORDER BY observation_count DESC, average_quality_score DESC
LIMIT 50;
