import { neon } from '@neondatabase/serverless';
import { enforceRateLimit, sendSafeError } from '../_lib/http.js';

type MetricRow = { label: string; value: number };
type HeatmapRow = { insurer: string; category: string; value: number };
type ClusterRow = { procedure: string; insurer: string; category: string; value: number };
type CarePatternRow = { procedure: string; category: string; value: number; takeaway: string; whyItMatters: string };
type PlanPatternRow = { planType: string; category: string; value: number; takeaway: string; whyItMatters: string };
type FindingRow = { title: string; body: string; tone: 'high' | 'medium' | 'warning' };
type ActionablePatternRow = {
  insurer: string;
  category: string;
  procedure: string;
  value: number;
  takeaway: string;
  whyItMatters: string;
};
type QuestionInsightRow = {
  question: string;
  answer: string;
  count: number;
  filter: string;
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

function planPatternTakeaway(category: string, planType: string) {
  const categoryKey = (category || '').toLowerCase();
  const planName = planType || 'this plan type';

  if (categoryKey.includes('prior')) {
    return {
      takeaway: `${planName} plans keep turning this into a prior-authorization fight before care can even move.`,
      whyItMatters: 'If your plan type shows up here, gather the actual plan criteria, approval timeline, and every failed step before you file your appeal.',
    };
  }

  if (categoryKey.includes('eligibility')) {
    return {
      takeaway: `${planName} plans are surfacing repeated eligibility and coverage-activation problems.`,
      whyItMatters: 'That often means the appeal needs enrollment records, employer timing, or proof that coverage should have been active.',
    };
  }

  if (categoryKey.includes('medical necessity')) {
    return {
      takeaway: `${planName} plans keep demanding stronger proof that care is medically necessary.`,
      whyItMatters: 'That is a documentation fight: specialist letters, guidelines, chart notes, and direct rebuttals to the plan rationale all matter.',
    };
  }

  return {
    takeaway: `${planName} plans keep surfacing alongside the same denial excuse.`,
    whyItMatters: 'That is useful because it turns a private frustration into a repeat pattern you can compare your own letter against.',
  };
}

function buildQuestionInsights(
  carePatterns: CarePatternRow[],
  planPatterns: PlanPatternRow[],
  heatmap: HeatmapRow[]
): QuestionInsightRow[] {
  const questionRows: QuestionInsightRow[] = [];

  const strongestCareFight = carePatterns[0];
  if (strongestCareFight) {
    questionRows.push({
      question: `Is ${strongestCareFight.category.toLowerCase()} the main way patients are being blocked from ${strongestCareFight.procedure.toLowerCase()}?`,
      answer: strongestCareFight.takeaway,
      count: strongestCareFight.value,
      filter: `${strongestCareFight.procedure} ${strongestCareFight.category}`,
    });
  }

  const planFight = planPatterns[0];
  if (planFight) {
    questionRows.push({
      question: `Do ${planFight.planType} plans keep using ${planFight.category.toLowerCase()} to delay care?`,
      answer: planFight.takeaway,
      count: planFight.value,
      filter: `${planFight.planType} ${planFight.category}`,
    });
  }

  const insurerFight = heatmap[0];
  if (insurerFight) {
    questionRows.push({
      question: `Is ${insurerFight.insurer} leaning on ${insurerFight.category.toLowerCase()} more than anyone else?`,
      answer: buildHeatmapTakeaway(insurerFight),
      count: insurerFight.value,
      filter: `${insurerFight.insurer} ${insurerFight.category}`,
    });
  }

  return questionRows;
}

function buildHeatmapTakeaway(item: HeatmapRow) {
  const category = item.category.toLowerCase();
  if (category.includes('prior')) {
    return `${item.insurer} keeps forcing extra approval steps before care can move, which usually means the appeal needs plan criteria, doctor notes, and failed-treatment history lined up early.`;
  }
  if (category.includes('out of network')) {
    return `${item.insurer} keeps pushing these cases into out-of-network chaos, which often turns the fight into continuity-of-care or network adequacy rather than a routine resubmission.`;
  }
  if (category.includes('medical necessity')) {
    return `${item.insurer} keeps framing the fight as medical necessity, so the strongest appeals usually center on specialist letters, clinical guidelines, and rebutting the insurer's exact wording.`;
  }
  if (category.includes('coverage exclusion')) {
    return `${item.insurer} keeps treating care as excluded, which usually means the policy language itself becomes part of the argument.`;
  }
  return `${item.insurer} is surfacing alongside a repeat denial excuse often enough to compare your own case against it.`;
}

function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured in Vercel.');
  }

  return neon(connectionString);
}

export async function fetchPatternsFromNeon() {
  const sql = getSql();

  const [
    overviewCounts,
    topInsurers,
    topCategories,
    topProcedures,
    carePatterns,
    planPatterns,
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
      SELECT plan_type AS "planType", denial_category AS category, COUNT(*)::int AS value
      FROM curated_stories
      WHERE status = 'published'
        AND consent_level = 'public_story'
        AND COALESCE(plan_type, '') NOT IN ('', 'Unknown')
        AND COALESCE(denial_category, '') NOT IN ('', 'Unknown')
      GROUP BY plan_type, denial_category
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
  const planPatternRows: PlanPatternRow[] = (planPatterns as Array<{ planType: string; category: string; value: number }>).map((row) => ({
    ...row,
    ...planPatternTakeaway(row.category, row.planType),
  }));
  const heatmapRows = heatmap as unknown as HeatmapRow[];

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
  const questionInsights = buildQuestionInsights(carePatternRows, planPatternRows, heatmapRows);

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
    planPatterns: planPatternRows,
    questionInsights,
    heatmap: heatmapRows,
    procedureClusters: actionablePatterns,
    statePatterns: statePatterns as unknown as MetricRow[],
    sourceMix: sourceMix as unknown as MetricRow[],
  };
}

export default async function handler(_req: any, res: any) {
  if (!enforceRateLimit(_req, res, { key: 'insights-patterns', limit: 40, windowMs: 60_000 })) {
    return;
  }

  try {
    const payload = await fetchPatternsFromNeon();
    res.status(200).json(payload);
  } catch (error) {
    sendSafeError(res, 500, 'We could not load evidence patterns right now.', error, 'insights-patterns');
  }
}
