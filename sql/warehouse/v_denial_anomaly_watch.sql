CREATE OR REPLACE VIEW `{{PROJECT_ID}}.{{DATASET_ID}}.v_denial_anomaly_watch` AS
WITH weekly AS (
  SELECT
    DATE_TRUNC(DATE(COALESCE(source_published_at, ingested_at, CURRENT_TIMESTAMP())), WEEK(MONDAY)) AS week_start,
    COALESCE(NULLIF(insurer_normalized, ''), 'Unknown') AS insurer_family,
    COALESCE(NULLIF(denial_category, ''), 'Unknown') AS denial_category,
    COALESCE(NULLIF(procedure_normalized, ''), 'Unknown') AS procedure_bucket,
    COUNT(*) AS story_count
  FROM `{{PROJECT_ID}}.{{DATASET_ID}}.raw_web_observations`
  WHERE COALESCE(is_low_signal, FALSE) = FALSE
  GROUP BY 1, 2, 3, 4
),
ranked AS (
  SELECT
    *,
    AVG(story_count) OVER (
      PARTITION BY insurer_family, denial_category, procedure_bucket
      ORDER BY week_start
      ROWS BETWEEN 4 PRECEDING AND 1 PRECEDING
    ) AS trailing_avg,
    MAX(week_start) OVER () AS latest_week
  FROM weekly
)
SELECT
  week_start,
  insurer_family,
  denial_category,
  procedure_bucket,
  story_count,
  trailing_avg,
  SAFE_DIVIDE(story_count, NULLIF(trailing_avg, 0)) AS spike_ratio
FROM ranked
WHERE week_start = latest_week
  AND insurer_family NOT IN ('Unknown', 'Multiple insurers')
  AND denial_category <> 'Unknown'
  AND procedure_bucket NOT IN ('Unknown', 'Insurance denial evidence', 'General healthcare access')
  AND trailing_avg IS NOT NULL
  AND story_count >= 5
  AND SAFE_DIVIDE(story_count, NULLIF(trailing_avg, 0)) >= 1.5;
