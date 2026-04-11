SELECT
  source_type,
  COUNT(*) AS source_count
FROM `{{PROJECT_ID}}.{{DATASET_ID}}.source_records`
GROUP BY source_type
ORDER BY source_count DESC;
