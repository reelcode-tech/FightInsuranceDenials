CREATE OR REPLACE VIEW `{{PROJECT_ID}}.{{DATASET_ID}}.v_denial_question_mart` AS
WITH normalized AS (
  SELECT
    COALESCE(NULLIF(insurer_normalized, ''), 'Unknown') AS insurer_family,
    COALESCE(NULLIF(plan_type, ''), 'Unknown') AS plan_type,
    COALESCE(NULLIF(denial_category, ''), 'Unknown') AS denial_category,
    COALESCE(NULLIF(procedure_normalized, ''), 'Unknown') AS procedure_bucket,
    COALESCE(NULLIF(source_label, ''), 'Unknown source') AS source_label,
    DATE(COALESCE(source_published_at, ingested_at, CURRENT_TIMESTAMP())) AS event_date
  FROM `{{PROJECT_ID}}.{{DATASET_ID}}.raw_web_observations`
  WHERE COALESCE(is_low_signal, FALSE) = FALSE
)
SELECT
  'procedure_denial' AS question_type,
  procedure_bucket AS primary_dimension,
  denial_category AS secondary_dimension,
  COUNT(*) AS story_count,
  MIN(event_date) AS first_seen_date,
  MAX(event_date) AS latest_seen_date
FROM normalized
WHERE procedure_bucket NOT IN ('Unknown', 'Insurance denial evidence', 'General healthcare access')
  AND denial_category <> 'Unknown'
GROUP BY 1, 2, 3

UNION ALL

SELECT
  'plan_denial' AS question_type,
  plan_type AS primary_dimension,
  denial_category AS secondary_dimension,
  COUNT(*) AS story_count,
  MIN(event_date) AS first_seen_date,
  MAX(event_date) AS latest_seen_date
FROM normalized
WHERE plan_type <> 'Unknown'
  AND denial_category <> 'Unknown'
GROUP BY 1, 2, 3

UNION ALL

SELECT
  'insurer_denial' AS question_type,
  insurer_family AS primary_dimension,
  denial_category AS secondary_dimension,
  COUNT(*) AS story_count,
  MIN(event_date) AS first_seen_date,
  MAX(event_date) AS latest_seen_date
FROM normalized
WHERE insurer_family NOT IN ('Unknown', 'Multiple insurers')
  AND denial_category <> 'Unknown'
GROUP BY 1, 2, 3;
