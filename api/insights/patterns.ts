import { neon } from '@neondatabase/serverless';

type MetricRow = { label: string; value: number };
type HeatmapRow = { insurer: string; category: string; value: number };
type ClusterRow = { procedure: string; insurer: string; category: string; value: number };
type CarePatternRow = { procedure: string; category: string; value: number; takeaway: string; whyItMatters: string };
type FindingRow = { title: string; body: string; tone: 'high' | 'medium' | 'warning' };
type ActionablePatternRow = {
  insurer: string;
  category: string;
  procedure: string;
  value: number;
  takeaway: string;
  whyItMatters: string;
};

function asNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function clusterTakeaway(category: string, procedure: string, insurer: string) {
  const categoryKey = (category || '').toLowerCase();
  const procedureName = procedure || 'care';
  const insurerName = insurer || 'this insurer';

  if (categoryKey.includes('prior')) {
    return {
      takeaway: `${insurerName} keeps forcing extra approval steps before ${procedureName.toLowerCase()} can move.`,
      whyItMatters: 'Patients fighting this usually need physician notes, failed-treatment history, and plan-language support earlier than they think.',
    };
  }

  if (categoryKey.includes('medical necessity')) {
    return {
      takeaway: `${insurerName} repeatedly demands proof that ${procedureName.toLowerCase()} is medically necessary even when clinicians support it.`,
      whyItMatters: "That often means appeals need stronger clinical documentation and direct rebuttals to the insurer's own wording.",
    };
  }

  if (categoryKey.includes('out of network')) {
    return {
      takeaway: `${insurerName} keeps pushing ${procedureName.toLowerCase()} fights into out-of-network chaos.`,
      whyItMatters: 'This can point to continuity-of-care, gap exception, or network adequacy arguments instead of a standard resubmission.',
    };
  }

  if (categoryKey.includes('coverage exclusion')) {
    return {
      takeaway: `${insurerName} keeps treating ${procedureName.toLowerCase()} as excluded or not covered care.`,
      whyItMatters: 'That usually means patients need the plan document, formulary language, and comparable-case precedent in hand.',
    };
  }

  if (categoryKey.includes('eligibility')) {
    return {
      takeaway: `${insurerName} is surfacing repeat eligibility breakdowns around ${procedureName.toLowerCase()}.`,
      whyItMatters: 'These fights often hinge on enrollment records, employer timing, or mistaken coverage lapses rather than medicine itself.',
    };
  }

  return {
    takeaway: `${insurerName} keeps surfacing alongside ${procedureName.toLowerCase()} denials.`,
    whyItMatters: 'A repeat pattern like this gives patients and advocates something concrete to compare against instead of feeling isolated.',
  };
}

function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured in Vercel.');
  }

  return neon(connectionString);
}

async function fetchPatternsFromNeon() {
  const sql = getSql();

  const [
    overviewCounts,
    topInsurers,
    topCategories,
    topProcedures,
    carePatterns,
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
        ) AS generic_procedure_rows
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
      SELECT procedure_condition AS procedure, denial_category AS category, COUNT(*)::int AS value
      FROM curated_stories
      WHERE status = 'published'
        AND consent_level = 'public_story'
        AND COALESCE(denial_category, '') NOT IN ('', 'Unknown')
        AND COALESCE(procedure_condition, '') NOT IN ('', 'Unknown', 'Insurance denial evidence')
      GROUP BY procedure_condition, denial_category
      ORDER BY value DESC
      LIMIT 10
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

  const topInsurerRows = topInsurers as MetricRow[];
  const topCategoryRows = topCategories as MetricRow[];
  const topProcedureRows = topProcedures as MetricRow[];
  const carePatternRows: CarePatternRow[] = (carePatterns as Array<{ procedure: string; category: string; value: number }>).map((row) => ({
    ...row,
    ...clusterTakeaway(row.category, row.procedure, ''),
  }));

  const findings: FindingRow[] = [
    topInsurerRows[0]
      ? {
          title: `${topInsurerRows[0].label} is showing up more than any other named insurer`,
          body: `${topInsurerRows[0].label} appears in ${topInsurerRows[0].value} public stories, which makes it one of the clearest repeat payers to watch right now.`,
          tone: 'high',
        }
      : {
          title: 'The record is still early, but repeat patterns are starting to show',
          body: 'We already have enough signal to track repeated denial fights, even though the observatory still needs more source breadth and better extraction.',
          tone: 'warning',
        },
    topCategoryRows[0]
      ? {
          title: `${topCategoryRows[0].label} keeps surfacing as the main denial playbook`,
          body: `${topCategoryRows[0].label} now leads the record, which suggests many people are fighting process, paperwork, or pre-approval barriers instead of a single isolated medical judgment.`,
          tone: 'medium',
        }
      : {
          title: 'We still need better categorization before every pattern is public-proof',
          body: 'The stories are real, but not every row is labeled cleanly enough yet to treat it as public-facing evidence.',
          tone: 'warning',
        },
    topProcedureRows[0]
      ? {
          title: `${topProcedureRows[0].label} is the care fight surfacing most often`,
          body: `${topProcedureRows[0].label} is currently the biggest care bucket in the record, which tells us people are repeatedly getting blocked around this kind of treatment rather than in one edge case.`,
          tone: 'medium',
        }
      : {
          title: 'Care-type labeling is still maturing',
          body: 'We can already see real treatment clusters, but too many rows still land in generic buckets to make every chart useful yet.',
          tone: 'warning',
        },
  ];

  const actionablePatterns: ActionablePatternRow[] = (procedureClusters as unknown as ClusterRow[]).map((cluster) => ({
    ...cluster,
    ...clusterTakeaway(cluster.category, cluster.procedure, cluster.insurer),
  }));

  return {
    status: 'success' as const,
    overview: {
      totalRows,
      cleanPatternRows: asNumber((overviewRow as any).clean_pattern_rows),
      unknownInsurerPct,
      unknownCategoryPct,
      genericProcedurePct,
    },
    findings,
    topInsurers: topInsurerRows,
    topCategories: topCategoryRows,
    topProcedures: topProcedureRows,
    carePatterns: carePatternRows,
    heatmap: heatmap as unknown as HeatmapRow[],
    procedureClusters: actionablePatterns,
    statePatterns: statePatterns as unknown as MetricRow[],
    sourceMix: sourceMix as unknown as MetricRow[],
  };
}

export default async function handler(_req: any, res: any) {
  try {
    const payload = await fetchPatternsFromNeon();
    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
