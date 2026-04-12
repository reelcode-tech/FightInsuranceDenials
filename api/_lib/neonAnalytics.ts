import { neon } from '@neondatabase/serverless';

type MetricRow = { label: string; value: number };
type HeatmapRow = { insurer: string; category: string; value: number };
type ClusterRow = { procedure: string; insurer: string; category: string; value: number };
type FindingRow = { title: string; body: string; tone: 'high' | 'medium' | 'warning' };
type ActionablePatternRow = {
  insurer: string;
  category: string;
  procedure: string;
  value: number;
  takeaway: string;
  whyItMatters: string;
};

function clusterTakeaway(category: string, procedure: string, insurer: string) {
  const categoryKey = (category || '').toLowerCase();
  const procedureName = procedure || 'care';
  const insurerName = insurer || 'this insurer';

  if (categoryKey.includes('prior')) {
    return {
      takeaway: `${insurerName} keeps forcing extra approval steps before ${procedureName.toLowerCase()} can move.`,
      whyItMatters: 'That usually means patients need physician notes, failed-treatment history, and plan-language evidence sooner, not later.',
    };
  }

  if (categoryKey.includes('medical necessity')) {
    return {
      takeaway: `${insurerName} is repeatedly making patients prove ${procedureName.toLowerCase()} is medically necessary even when clinicians support it.`,
      whyItMatters: 'That often points to appeals that need stronger clinical documentation and side-by-side insurer language rebuttals.',
    };
  }

  if (categoryKey.includes('out of network')) {
    return {
      takeaway: `${insurerName} shows a repeat pattern of pushing ${procedureName.toLowerCase()} fights into out-of-network chaos.`,
      whyItMatters: 'That can disrupt treatment midstream, so patients often need continuity-of-care, gap exception, or network adequacy arguments.',
    };
  }

  if (categoryKey.includes('coverage exclusion')) {
    return {
      takeaway: `${insurerName} keeps treating ${procedureName.toLowerCase()} as excluded or not covered care.`,
      whyItMatters: 'That matters because people may need plan documents, formulary evidence, and comparable-case precedent, not just another resubmission.',
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
    whyItMatters: 'A repeat pattern like this gives patients and advocates something concrete to compare against instead of feeling like they are the only one.',
  };
}

let sqlClient: ReturnType<typeof neon> | null = null;

function getSql() {
  if (sqlClient) return sqlClient;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured in Vercel.');
  }

  sqlClient = neon(connectionString);
  return sqlClient;
}

function asNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export async function fetchObservatorySummaryFromNeon() {
  const sql = getSql();

  const [countResult, topCategoryResult, featuredResult] = await Promise.all([
    sql`
      SELECT
        (SELECT COUNT(*)::int FROM raw_web_observations) AS raw_observation_count,
        (SELECT COUNT(*)::int FROM source_records) AS source_record_count,
        (
          SELECT COUNT(*)::int
          FROM curated_stories
          WHERE status = 'published' AND consent_level = 'public_story'
        ) AS total_visible_count
    `,
    sql`
      SELECT denial_category, COUNT(*)::int AS record_count
      FROM curated_stories
      WHERE status = 'published'
        AND consent_level = 'public_story'
        AND COALESCE(denial_category, '') NOT IN ('', 'Unknown')
      GROUP BY denial_category
      ORDER BY record_count DESC
      LIMIT 1
    `,
    sql`
      SELECT
        story_id,
        extracted_insurer,
        procedure_condition,
        denial_reason_raw,
        patient_narrative_summary,
        source_label,
        source_url
      FROM curated_stories
      WHERE status = 'published'
        AND consent_level = 'public_story'
        AND COALESCE(patient_narrative_summary, '') !~* '(turn 26|which plan|what plan|late enrollment|open enrollment|shopping for|marketplace quote|recommendations for)'
        AND (
          COALESCE(denial_category, '') NOT IN ('', 'Unknown')
          OR COALESCE(denial_reason_raw, '') ~* '(denied|prior auth|prior authorization|not medically necessary|out of network|coverage denied|claim denied|step therapy)'
        )
      ORDER BY quality_score DESC, submission_timestamp DESC
      LIMIT 3
    `,
  ]);

  const counts = countResult[0] || {};
  return {
    status: 'success',
    rawObservationCount: asNumber(counts.raw_observation_count),
    sourceRecordCount: asNumber(counts.source_record_count),
    totalVisibleCount: asNumber(counts.total_visible_count),
    topCategory: topCategoryResult[0]?.denial_category || 'Coverage Denial',
    featuredStories: (featuredResult as any[]).map((row: any) => ({
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
  const sql = getSql();

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
  const totalRows = asNumber(overviewRow.total_rows);
  const unknownInsurerPct = totalRows ? Math.round((asNumber(overviewRow.unknown_insurer_rows) / totalRows) * 100) : 0;
  const unknownCategoryPct = totalRows ? Math.round((asNumber(overviewRow.unknown_category_rows) / totalRows) * 100) : 0;
  const genericProcedurePct = totalRows ? Math.round((asNumber(overviewRow.generic_procedure_rows) / totalRows) * 100) : 0;

  const topInsurerRows = topInsurers as MetricRow[];
  const topCategoryRows = topCategories as MetricRow[];
  const topProcedureRows = topProcedures as MetricRow[];

  const findings: FindingRow[] = [
    topInsurerRows[0]
      ? {
          title: `${topInsurerRows[0].label} is showing up more than any other named insurer`,
          body: `${topInsurerRows[0].label} appears in ${topInsurerRows[0].value} public stories we can actually stand behind, which makes it one of the clearest repeat payers to watch right now.`,
          tone: 'high',
        }
      : {
          title: 'The record is still early, but the repeat patterns are starting to show',
          body: 'We already have enough signal to track repeated denial fights, even though the observatory still needs more source breadth and better extraction.',
          tone: 'warning',
        },
    topCategoryRows[0]
      ? {
          title: `${topCategoryRows[0].label} keeps surfacing as the main denial playbook`,
          body: `${topCategoryRows[0].label} now leads the record, which suggests a lot of people are not just fighting medical judgment. They are fighting process, paperwork, gatekeeping, or pre-approval barriers.`,
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
          body: `${topProcedureRows[0].label} is currently the biggest care bucket in the record, which tells us people are repeatedly getting blocked around this kind of treatment rather than in one isolated edge case.`,
          tone: 'medium',
        }
      : {
          title: 'Care-type labeling is still maturing',
          body: 'We can already see real treatment clusters, but too many rows still land in generic buckets to make every chart useful yet.',
          tone: 'warning',
        },
    {
      title: 'We are showing what repeats clearly, not pretending every row is perfect',
      body: `A lot of raw posts still need better labeling, which is why we only promote the clearer repeat patterns into the public record instead of throwing every scraped row on the page.`,
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
      cleanPatternRows: asNumber(overviewRow.clean_pattern_rows),
      unknownInsurerPct,
      unknownCategoryPct,
      genericProcedurePct,
    },
    findings,
    topInsurers: topInsurerRows,
    topCategories: topCategoryRows,
    topProcedures: topProcedureRows,
    heatmap: heatmap as unknown as HeatmapRow[],
    procedureClusters: actionablePatterns,
    statePatterns: statePatterns as unknown as MetricRow[],
    sourceMix: sourceMix as unknown as MetricRow[],
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
