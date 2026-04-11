SELECT
  extracted_insurer,
  denial_category,
  procedure_condition,
  COUNT(*) AS story_count,
  ROUND(AVG(COALESCE(quality_score, 0)), 2) AS average_quality_score,
  COUNTIF(anomaly_detected) AS anomaly_flags
FROM `{{PROJECT_ID}}.{{DATASET_ID}}.curated_stories`
GROUP BY extracted_insurer, denial_category, procedure_condition
HAVING COUNT(*) >= 3
ORDER BY story_count DESC, average_quality_score DESC
LIMIT 50;
