SELECT
  extracted_insurer,
  COUNT(*) AS story_count,
  ROUND(AVG(COALESCE(quality_score, 0)), 2) AS average_quality_score
FROM `{{PROJECT_ID}}.{{DATASET_ID}}.curated_stories`
GROUP BY extracted_insurer
ORDER BY story_count DESC, average_quality_score DESC
LIMIT 20;
