import { neon } from '@neondatabase/serverless';
import { buildWarehouseDashboardSnapshot } from '../../src/lib/warehouseInsightsSnapshot.js';
import { PUBLIC_STORY_COUNT } from '../../src/lib/publicMetrics.js';
import { enforceRateLimit, sendSafeError } from '../_lib/http.js';
import { fetchPatternsFromNeon } from './patterns.js';

type MetricRow = { label: string; value: number };

function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured in Vercel.');
  }

  return neon(connectionString);
}

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function shortMonthLabel(label: string) {
  const [month, year] = label.split(' ');
  return `${month} ${year?.slice(-2) || ''}`.trim();
}

function buildRollingAverage(values: number[]) {
  return values.map((value, index) => {
    const start = Math.max(0, index - 2);
    const window = values.slice(start, index + 1);
    return Math.round(window.reduce((sum, current) => sum + current, 0) / window.length);
  });
}

function toPercent(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 100);
}

export default async function handler(req: any, res: any) {
  if (!enforceRateLimit(req, res, { key: 'insights-dashboard', limit: 40, windowMs: 60_000 })) {
    return;
  }

  try {
    const sql = getSql();
    const patterns = await fetchPatternsFromNeon();

    const [timelineRows, totalsRows] = await Promise.all([
      sql`
        SELECT
          TO_CHAR(DATE_TRUNC('month', submission_timestamp), 'Mon YYYY') AS label,
          DATE_TRUNC('month', submission_timestamp) AS month_start,
          COUNT(*)::int AS value,
          COUNT(*) FILTER (WHERE status = 'overturned')::int AS overturned_value
        FROM curated_stories
        WHERE status = 'published'
          AND consent_level = 'public_story'
        GROUP BY month_start
        ORDER BY month_start DESC
        LIMIT 12
      `,
      sql`
        SELECT
          COUNT(*) FILTER (WHERE status = 'published' AND consent_level = 'public_story')::int AS published_story_count,
          COUNT(*) FILTER (WHERE status = 'overturned' AND consent_level = 'public_story')::int AS overturned_story_count
        FROM curated_stories
      `,
    ]);

    const insurerShare = patterns.topInsurers.slice(0, 5);
    const otherInsurerValue = Math.max(
      patterns.overview.cleanPatternRows - insurerShare.reduce((sum, item) => sum + item.value, 0),
      0
    );
    const insurerRows = otherInsurerValue
      ? [...insurerShare, { label: 'Others', value: otherInsurerValue }]
      : insurerShare;

    const orderedTimeline = [...(timelineRows as Array<{ label: string; value: number; overturned_value: number }>)].reverse();
    const timelineValues = orderedTimeline.map((row) => toNumber(row.value));
    const rollingAverage = buildRollingAverage(timelineValues);
    const totals = (totalsRows[0] || {}) as { published_story_count?: number; overturned_story_count?: number };
    const publishedStories = PUBLIC_STORY_COUNT || toNumber(totals.published_story_count);
    const appealSuccessRate = toPercent(toNumber(totals.overturned_story_count), publishedStories);

    res.status(200).json({
      status: 'success',
      snapshot: buildWarehouseDashboardSnapshot(patterns),
      dashboard: {
        totals: {
          publishedStories,
          topInsurer: patterns.topInsurers[0]?.label || 'Major insurers',
          topCategory: patterns.topCategories[0]?.label || 'Prior Authorization',
          topProcedure: patterns.topProcedures[0]?.label || 'Prescription medication',
          appealSuccessRate,
        },
        methodology:
          'Counts reflect 1,173 published public stories in the live database. State shading reflects story volume per million residents where available, and success-rate signals reflect stories explicitly marked overturned after appeal.',
        windowLabel: 'Last 12 months',
        filters: {
          insurers: patterns.topInsurers.map((item) => item.label),
          reasons: patterns.topCategories.map((item) => item.label),
          states: patterns.statePatterns.map((item) => item.label),
        },
        charts: {
          insurerShare: insurerRows,
          stateShare: patterns.statePatterns as MetricRow[],
          timeline: orderedTimeline.map((row, index) => ({
            label: row.label,
            shortLabel: shortMonthLabel(row.label),
            value: toNumber(row.value),
            rollingAverage: rollingAverage[index] || toNumber(row.value),
            successRate: toPercent(toNumber(row.overturned_value), toNumber(row.value)),
          })),
        },
      },
    });
  } catch (error) {
    sendSafeError(res, 500, 'We could not load the dashboard snapshot right now.', error, 'insights-dashboard');
  }
}
