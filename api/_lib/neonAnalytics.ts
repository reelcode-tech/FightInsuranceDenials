import { Pool } from 'pg';

type MetricRow = { label: string; value: number };
type HeatmapRow = { insurer: string; category: string; value: number };
type ClusterRow = { procedure: string; insurer: string; category: string; value: number };
type QualityRow = { metric: string; value: number };
type FindingRow = { title: string; body: string; tone: 'high' | 'medium' | 'warning' };

let pool: Pool | null = null;

function getPool() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured in Vercel.');
  }

  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  return pool;
}

function asNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export async function fetchObservatorySummaryFromNeon() {
  const db = getPool();

  const [countResult, topCategoryResult, featuredResult] = await Promise.all([
    db.query(`
      SELECT
        (SELECT COUNT(*)::int FROM raw_web_observations) AS raw_observation_count,
        (SELECT COUNT(*)::int FROM source_records) AS source_record_count,
        (
          SELECT COUNT(*)::int
          FROM curated_stories
          WHERE status = 'published' AND consent_level = 'public_story'
        ) AS total_visible_count
    `),
    db.query(`
      SELECT denial_category, COUNT(*)::int AS record_count
      FROM curated_stories
      WHERE status = 'published'
        AND consent_level = 'public_story'
        AND COALESCE(denial_category, '') NOT IN ('', 'Unknown')
      GROUP BY denial_category
      ORDER BY record_count DESC
      LIMIT 1
    `),
    db.query(`
      SELECT
        story_id,
        extracted_insurer,
        procedure_condition,
        denial_reason_raw,
        patient_narrative_summary,
        source_label,
        source_url
      FROM curated_stories
      WHERE status = 'published' AND consent_level = 'public_story'
      ORDER BY quality_score DESC, submission_timestamp DESC
      LIMIT 3
    `),
  ]);

  const counts = countResult.rows[0] || {};
  return {
    status: 'success',
    rawObservationCount: asNumber(counts.raw_observation_count),
    sourceRecordCount: asNumber(counts.source_record_count),
    totalVisibleCount: asNumber(counts.total_visible_count),
    topCategory: topCategoryResult.rows[0]?.denial_category || 'Coverage Denial',
    featuredStories: featuredResult.rows.map((row) => ({
      id: row.story_id,
      insurer: row.extracted_insurer || 'Private carrier',
      procedure: row.procedure_condition || 'Medical service denial',
      denialReason: row.denial_reason_raw || 'Coverage denial',
      summary: row.patient_narrative_summary || row.denial_reason_raw || 'A denial story from the public observatory.',
      source: row.source_label || 'Public source',
      url: row.source_url || undefined,
      status: 'denied',
      tags: [],
      isPublic: true,
      createdAt: null,
      date: '',
      narrative: '',
      planType: '',
    })),
  };
}

export async function fetchPatternsFromNeon() {
  const db = getPool();

  const [
    overviewCounts,
    topInsurers,
    topCategories,
    topProcedures,
    heatmap,
    procedureClusters,
    statePatterns,
    sourceMix,
  ] = await Promise.all([
    db.query(`
      SELECT
        (SELECT COUNT(*)::int FROM raw_web_observations) AS total_rows,
        (
          SELECT COUNT(*)::int
          FROM curated_stories
          WHERE status = 'published' AND consent_level = 'public_story'
        ) AS clean_pattern_rows,
        (
          SELECT COUNT(*)::int
          FROM raw_web_observations
          WHERE COALESCE(insurer_normalized, '') IN ('', 'Unknown', 'Multiple insurers')
        ) AS unknown_insurer_rows,
        (
          SELECT COUNT(*)::int
          FROM raw_web_observations
          WHERE COALESCE(denial_category, '') IN ('', 'Unknown')
        ) AS unknown_category_rows,
        (
          SELECT COUNT(*)::int
          FROM raw_web_observations
          WHERE COALESCE(procedure_normalized, '') IN ('', 'Unknown', 'Insurance denial evidence')
        ) AS generic_procedure_rows,
        (
          SELECT COUNT(*)::int
          FROM raw_web_observations
          WHERE COALESCE(state, '') IN ('', 'Unknown')
        ) AS missing_state_rows,
        (
          SELECT COUNT(*)::int
          FROM raw_web_observations
          WHERE state = 'OR'
        ) AS suspicious_or_state_rows,
        (
          SELECT COUNT(*)::int
          FROM raw_web_observations
          WHERE is_low_signal = TRUE
        ) AS low_signal_rows
    `),
    db.query(`
      SELECT extracted_insurer AS label, COUNT(*)::int AS value
      FROM curated_stories
      WHERE status = 'published'
        AND consent_level = 'public_story'
        AND COALESCE(extracted_insurer, '') NOT IN ('', 'Unknown', 'Multiple insurers')
      GROUP BY extracted_insurer
      ORDER BY value DESC
      LIMIT 6
    `),
    db.query(`
      SELECT denial_category AS label, COUNT(*)::int AS value
      FROM curated_stories
      WHERE status = 'published'
        AND consent_level = 'public_story'
        AND COALESCE(denial_category, '') NOT IN ('', 'Unknown')
      GROUP BY denial_category
      ORDER BY value DESC
      LIMIT 6
    `),
    db.query(`
      SELECT procedure_condition AS label, COUNT(*)::int AS value
      FROM curated_stories
      WHERE status = 'published'
        AND consent_level = 'public_story'
        AND COALESCE(procedure_condition, '') NOT IN ('', 'Unknown', 'Insurance denial evidence')
      GROUP BY procedure_condition
      ORDER BY value DESC
      LIMIT 6
    `),
    db.query(`
      SELECT extracted_insurer AS insurer, denial_category AS category, COUNT(*)::int AS value
      FROM curated_stories
      WHERE status = 'published'
        AND consent_level = 'public_story'
        AND COALESCE(extracted_insurer, '') NOT IN ('', 'Unknown', 'Multiple insurers')
        AND COALESCE(denial_category, '') NOT IN ('', 'Unknown')
      GROUP BY extracted_insurer, denial_category
      ORDER BY value DESC
      LIMIT 12
    `),
    db.query(`
      SELECT procedure_condition AS procedure, extracted_insurer AS insurer, denial_category AS category, COUNT(*)::int AS value
      FROM curated_stories
      WHERE status = 'published'
        AND consent_level = 'public_story'
        AND COALESCE(extracted_insurer, '') NOT IN ('', 'Unknown', 'Multiple insurers')
        AND COALESCE(denial_category, '') NOT IN ('', 'Unknown')
        AND COALESCE(procedure_condition, '') NOT IN ('', 'Unknown', 'Insurance denial evidence')
      GROUP BY procedure_condition, extracted_insurer, denial_category
      ORDER BY value DESC
      LIMIT 10
    `),
    db.query(`
      SELECT state AS label, COUNT(*)::int AS value
      FROM curated_stories
      WHERE status = 'published'
        AND consent_level = 'public_story'
        AND COALESCE(state, '') NOT IN ('', 'Unknown', 'OR')
      GROUP BY state
      ORDER BY value DESC
      LIMIT 8
    `),
    db.query(`
      SELECT source_type AS label, COUNT(*)::int AS value
      FROM curated_stories
      WHERE status = 'published' AND consent_level = 'public_story'
      GROUP BY source_type
      ORDER BY value DESC
    `),
  ]);

  const overviewRow = overviewCounts.rows[0] || {};
  const totalRows = asNumber(overviewRow.total_rows);
  const unknownInsurerPct = totalRows ? Math.round((asNumber(overviewRow.unknown_insurer_rows) / totalRows) * 100) : 0;
  const unknownCategoryPct = totalRows ? Math.round((asNumber(overviewRow.unknown_category_rows) / totalRows) * 100) : 0;
  const genericProcedurePct = totalRows ? Math.round((asNumber(overviewRow.generic_procedure_rows) / totalRows) * 100) : 0;

  const topInsurerRows = topInsurers.rows as MetricRow[];
  const topCategoryRows = topCategories.rows as MetricRow[];
  const topProcedureRows = topProcedures.rows as MetricRow[];

  const findings: FindingRow[] = [
    topInsurerRows[0]
      ? {
          title: `${topInsurerRows[0].label} leads the visible insurer slice`,
          body: `${topInsurerRows[0].label} appears in ${topInsurerRows[0].value} cleaned public stories, ahead of ${topInsurerRows[1]?.label || 'other carriers'} in the current record.`,
          tone: 'high',
        }
      : {
          title: 'The cleaned public slice is still small',
          body: 'We have enough signal to start tracking patterns, but the public observatory still needs more source breadth and cleaner extraction.',
          tone: 'warning',
        },
    topCategoryRows[0]
      ? {
          title: `${topCategoryRows[0].label} is surfacing as the strongest denial pattern`,
          body: `${topCategoryRows[0].label} is beating many classic medical-necessity narratives in the current public slice, which suggests a lot of denial pressure is still administrative and process-driven.`,
          tone: 'medium',
        }
      : {
          title: 'Category extraction still needs work',
          body: 'We are collecting meaningful stories, but a lot of raw rows still need better denial-category normalization before they become public-facing evidence.',
          tone: 'warning',
        },
    topProcedureRows[0]
      ? {
          title: `${topProcedureRows[0].label} is the biggest visible treatment bucket`,
          body: `${topProcedureRows[0].label} is currently the largest procedure cluster in the public record, with other treatment areas stacking up behind it as the observatory grows.`,
          tone: 'medium',
        }
      : {
          title: 'Procedure labeling is still maturing',
          body: 'We can already see real treatment clusters, but too many rows still land in generic procedure buckets.',
          tone: 'warning',
        },
    {
      title: 'The data is useful, but not clean enough to overclaim certainty',
      body: `${unknownInsurerPct}% of raw rows still lack a confident insurer, ${unknownCategoryPct}% still lack a clean category, and ${genericProcedurePct}% still fall into generic procedure buckets.`,
      tone: 'warning',
    },
  ];

  const dataQuality: QualityRow[] = [
    { metric: 'total_rows', value: totalRows },
    { metric: 'clean_pattern_rows', value: asNumber(overviewRow.clean_pattern_rows) },
    { metric: 'unknown_insurer_rows', value: asNumber(overviewRow.unknown_insurer_rows) },
    { metric: 'unknown_category_rows', value: asNumber(overviewRow.unknown_category_rows) },
    { metric: 'generic_procedure_rows', value: asNumber(overviewRow.generic_procedure_rows) },
    { metric: 'missing_state_rows', value: asNumber(overviewRow.missing_state_rows) },
    { metric: 'suspicious_or_state_rows', value: asNumber(overviewRow.suspicious_or_state_rows) },
    { metric: 'low_signal_rows', value: asNumber(overviewRow.low_signal_rows) },
  ];

  return {
    status: 'success' as const,
    overview: {
      totalRows,
      cleanPatternRows: asNumber(overviewRow.clean_pattern_rows),
      unknownInsurerPct,
      unknownCategoryPct,
      genericProcedurePct,
      suspiciousOrStateRows: asNumber(overviewRow.suspicious_or_state_rows),
    },
    findings,
    topInsurers: topInsurerRows,
    topCategories: topCategoryRows,
    topProcedures: topProcedureRows,
    heatmap: heatmap.rows as HeatmapRow[],
    procedureClusters: procedureClusters.rows as ClusterRow[],
    statePatterns: statePatterns.rows as MetricRow[],
    sourceMix: sourceMix.rows as MetricRow[],
    dataQuality,
  };
}

export async function fetchAiStatusFromEnv() {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const provider = process.env.AI_PROVIDER || 'auto';

  if (!hasGemini && !hasOpenAI) {
    return { status: 'error', message: 'No AI provider configured', provider: null };
  }

  return {
    status: 'success',
    provider: provider === 'auto' ? (hasGemini ? 'gemini' : 'openai') : provider,
    engine: provider === 'auto' ? (hasGemini ? 'gemini' : 'openai') : provider,
  };
}
