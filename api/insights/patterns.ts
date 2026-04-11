import { neon } from '@neondatabase/serverless';

function asNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

type MetricRow = { label: string; value: number };
type HeatmapRow = { insurer: string; category: string; value: number };
type ClusterRow = { procedure: string; insurer: string; category: string; value: number };

export default async function handler(_req: any, res: any) {
  try {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      res.status(500).json({
        status: 'error',
        error: 'DATABASE_URL is not configured in Vercel.',
      });
      return;
    }

    const sql = neon(connectionString);

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
      sql`
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
      `,
      sql`
        SELECT extracted_insurer AS label, COUNT(*)::int AS value
        FROM curated_stories
        WHERE status = 'published'
          AND consent_level = 'public_story'
          AND COALESCE(extracted_insurer, '') NOT IN ('', 'Unknown', 'Multiple insurers')
        GROUP BY extracted_insurer
        ORDER BY value DESC
        LIMIT 6
      `,
      sql`
        SELECT denial_category AS label, COUNT(*)::int AS value
        FROM curated_stories
        WHERE status = 'published'
          AND consent_level = 'public_story'
          AND COALESCE(denial_category, '') NOT IN ('', 'Unknown')
        GROUP BY denial_category
        ORDER BY value DESC
        LIMIT 6
      `,
      sql`
        SELECT procedure_condition AS label, COUNT(*)::int AS value
        FROM curated_stories
        WHERE status = 'published'
          AND consent_level = 'public_story'
          AND COALESCE(procedure_condition, '') NOT IN ('', 'Unknown', 'Insurance denial evidence')
        GROUP BY procedure_condition
        ORDER BY value DESC
        LIMIT 6
      `,
      sql`
        SELECT extracted_insurer AS insurer, denial_category AS category, COUNT(*)::int AS value
        FROM curated_stories
        WHERE status = 'published'
          AND consent_level = 'public_story'
          AND COALESCE(extracted_insurer, '') NOT IN ('', 'Unknown', 'Multiple insurers')
          AND COALESCE(denial_category, '') NOT IN ('', 'Unknown')
        GROUP BY extracted_insurer, denial_category
        ORDER BY value DESC
        LIMIT 12
      `,
      sql`
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
      `,
      sql`
        SELECT state AS label, COUNT(*)::int AS value
        FROM curated_stories
        WHERE status = 'published'
          AND consent_level = 'public_story'
          AND COALESCE(state, '') NOT IN ('', 'Unknown', 'OR')
        GROUP BY state
        ORDER BY value DESC
        LIMIT 8
      `,
      sql`
        SELECT source_type AS label, COUNT(*)::int AS value
        FROM curated_stories
        WHERE status = 'published' AND consent_level = 'public_story'
        GROUP BY source_type
        ORDER BY value DESC
      `,
    ]);

    const overviewRow = overviewCounts[0] || {};
    const totalRows = asNumber((overviewRow as any).total_rows);
    const unknownInsurerPct = totalRows ? Math.round((asNumber((overviewRow as any).unknown_insurer_rows) / totalRows) * 100) : 0;
    const unknownCategoryPct = totalRows ? Math.round((asNumber((overviewRow as any).unknown_category_rows) / totalRows) * 100) : 0;
    const genericProcedurePct = totalRows ? Math.round((asNumber((overviewRow as any).generic_procedure_rows) / totalRows) * 100) : 0;

    const topInsurerRows = topInsurers as unknown as MetricRow[];
    const topCategoryRows = topCategories as unknown as MetricRow[];
    const topProcedureRows = topProcedures as unknown as MetricRow[];

    const findings = [
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

    res.status(200).json({
      status: 'success',
      overview: {
        totalRows,
        cleanPatternRows: asNumber((overviewRow as any).clean_pattern_rows),
        unknownInsurerPct,
        unknownCategoryPct,
        genericProcedurePct,
        suspiciousOrStateRows: asNumber((overviewRow as any).suspicious_or_state_rows),
      },
      findings,
      topInsurers: topInsurerRows,
      topCategories: topCategoryRows,
      topProcedures: topProcedureRows,
      heatmap: heatmap as unknown as HeatmapRow[],
      procedureClusters: procedureClusters as unknown as ClusterRow[],
      statePatterns: statePatterns as unknown as MetricRow[],
      sourceMix: sourceMix as unknown as MetricRow[],
      dataQuality: [
        { metric: 'total_rows', value: totalRows },
        { metric: 'clean_pattern_rows', value: asNumber((overviewRow as any).clean_pattern_rows) },
        { metric: 'unknown_insurer_rows', value: asNumber((overviewRow as any).unknown_insurer_rows) },
        { metric: 'unknown_category_rows', value: asNumber((overviewRow as any).unknown_category_rows) },
        { metric: 'generic_procedure_rows', value: asNumber((overviewRow as any).generic_procedure_rows) },
        { metric: 'missing_state_rows', value: asNumber((overviewRow as any).missing_state_rows) },
        { metric: 'suspicious_or_state_rows', value: asNumber((overviewRow as any).suspicious_or_state_rows) },
        { metric: 'low_signal_rows', value: asNumber((overviewRow as any).low_signal_rows) },
      ],
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
