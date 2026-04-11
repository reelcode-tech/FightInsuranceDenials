CREATE OR REPLACE VIEW `{{PROJECT_ID}}.{{DATASET_ID}}.v_data_quality_monitor` AS
SELECT 'total_rows' AS metric, COUNT(*) AS metric_value
FROM `{{PROJECT_ID}}.{{DATASET_ID}}.raw_web_observations`
UNION ALL
SELECT 'low_signal_rows', COUNTIF(COALESCE(is_low_signal, FALSE))
FROM `{{PROJECT_ID}}.{{DATASET_ID}}.raw_web_observations`
UNION ALL
SELECT 'unknown_insurer_rows', COUNTIF(insurer_normalized = 'Unknown')
FROM `{{PROJECT_ID}}.{{DATASET_ID}}.raw_web_observations`
UNION ALL
SELECT 'unknown_category_rows', COUNTIF(denial_category = 'Unknown')
FROM `{{PROJECT_ID}}.{{DATASET_ID}}.raw_web_observations`
UNION ALL
SELECT 'generic_procedure_rows', COUNTIF(procedure_normalized = 'Insurance denial evidence')
FROM `{{PROJECT_ID}}.{{DATASET_ID}}.raw_web_observations`
UNION ALL
SELECT 'missing_state_rows', COUNTIF(state IS NULL OR state = '')
FROM `{{PROJECT_ID}}.{{DATASET_ID}}.raw_web_observations`
UNION ALL
SELECT 'suspicious_or_state_rows',
  COUNTIF(state = 'OR' AND NOT REGEXP_CONTAINS(LOWER(raw_text), r'\boregon\b'))
FROM `{{PROJECT_ID}}.{{DATASET_ID}}.raw_web_observations`
UNION ALL
SELECT 'clean_pattern_rows',
  COUNT(*)
FROM `{{PROJECT_ID}}.{{DATASET_ID}}.v_patterns_clean`;

