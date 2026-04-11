CREATE OR REPLACE VIEW `{{PROJECT_ID}}.{{DATASET_ID}}.v_state_patterns_clean` AS
SELECT
  state,
  insurer_normalized AS insurer,
  denial_category,
  procedure_normalized AS procedure,
  COUNT(*) AS story_count
FROM `{{PROJECT_ID}}.{{DATASET_ID}}.v_patterns_clean`
WHERE trustworthy_state
  AND has_named_insurer
GROUP BY state, insurer, denial_category, procedure;

