import { createHash } from 'crypto';
import {
  computeQualityScore,
  inferInsurerFromNarrativeText,
  inferDenialCategory,
  isLowSignalRecord,
  normalizeDenialReasonText,
  normalizePlanType,
  normalizeProcedureLabel,
} from './normalization';
import { getBigQueryAccessToken, runBigQuerySql } from '../../scripts/_bigqueryClient';

const DATASET_ID = process.env.BIGQUERY_DATASET_ID || 'fight_insurance_denials';

const TARGET_SUBREDDITS = [
  'HealthInsurance',
  'medicare',
  'ChronicIllness',
  'disability',
  'IVF',
  'BreastCancer',
  'cancer',
  'LongCovid',
  'rareDiseases',
  'ChronicPain',
  'Fibromyalgia',
  'Endo',
  'PCOS',
  'Infertility',
  'AskDocs',
  'autismparents',
  'autism',
  'MultipleSclerosis',
  'UlcerativeColitis',
  'CrohnsDisease',
  'EhlersDanlos',
  'POTS',
  'depression',
  'Anxiety',
  'mentalhealth',
  'Ozempic',
  'Mounjaro',
  'Zepbound',
];

const SEARCH_TERMS = [
  'denied',
  'appeal',
  '"prior authorization"',
  '"not medically necessary"',
  '"claim denied"',
  '"coverage denied"',
  '"step therapy"',
  '"out of network"',
  '"mental health parity"',
  '"ABA therapy"',
  'wegovy insurance',
  'zepbound insurance',
];
const SUBREDDITS_PER_PASS = 3;
const TERMS_PER_PASS = 2;
const PULLPUSH_PAGE_SIZE = 100;

const RELEVANCE_PATTERNS = [
  /denied/i,
  /appeal/i,
  /coverage denied/i,
  /claim denied/i,
  /\beob\b/i,
  /explanation of benefits/i,
  /prior auth/i,
  /prior authorization/i,
  /not medically necessary/i,
  /not covered/i,
  /coverage denied/i,
  /claim denied/i,
  /claim rejection/i,
  /step therapy/i,
  /out of network/i,
  /formular/i,
  /preauth/i,
  /authorization/i,
  /benefit(s)?/i,
  /pharmacy benefit/i,
];

const INSURANCE_CONTEXT_PATTERNS = [
  /insurance/i,
  /insurer/i,
  /coverage/i,
  /claim/i,
  /prior auth/i,
  /prior authorization/i,
  /out of network/i,
  /medicare/i,
  /medicaid/i,
  /plan\b/i,
  /payer/i,
];

const ACCESS_BLOCK_PATTERNS = [
  /denied/i,
  /appeal/i,
  /rejected/i,
  /refused/i,
  /not medically necessary/i,
  /not covered/i,
  /coverage denied/i,
  /claim denied/i,
  /claim rejection/i,
  /step therapy/i,
  /out of network/i,
  /prior auth/i,
  /prior authorization/i,
  /preauth/i,
  /authorization/i,
  /cannot get/i,
  /can't get/i,
  /couldn'?t get/i,
  /won't cover/i,
  /wouldn'?t cover/i,
  /miss my next/i,
];

const GENERIC_INSURANCE_PATTERNS = [
  /turn 26/i,
  /which plan/i,
  /what plan/i,
  /marketplace quote/i,
  /late enrollment/i,
  /open enrollment/i,
  /do y'?all/i,
  /recommendations for/i,
  /what do i do about/i,
  /shopping for/i,
  /need a plan/i,
  /\birmaa\b/i,
  /\bssa[- ]?44\b/i,
  /authorized representative/i,
  /advanced nomination/i,
  /critical illness insurance/i,
  /ada request/i,
];

const STATE_PATTERNS: Array<[RegExp, string]> = [
  [/\bcalifornia\b|\bca\b/i, 'CA'],
  [/\btexas\b|\btx\b/i, 'TX'],
  [/\bflorida\b|\bfl\b/i, 'FL'],
  [/\bnew york\b|\bny\b/i, 'NY'],
  [/\billinois\b|\bil\b/i, 'IL'],
  [/\bwashington\b|\bwa\b/i, 'WA'],
  [/\boregon\b|\bor\b/i, 'OR'],
];

function inferProcedure(text: string) {
  return normalizeProcedureLabel(text);
}

function extractInsurer(text: string) {
  return inferInsurerFromNarrativeText(text);
}

function inferPlanType(text: string) {
  return normalizePlanType(text);
}

function inferErisaStatus(text: string) {
  if (/\berisa\b/i.test(text)) return 'ERISA';
  if (/employer|job.?based|through work|group plan/i.test(text)) return 'ERISA';
  if (/medicare|medicaid|marketplace|obamacare/i.test(text)) return 'Non-ERISA';
  return 'Unknown';
}

function inferState(text: string) {
  for (const [pattern, state] of STATE_PATTERNS) {
    if (pattern.test(text)) return state;
  }
  return null;
}

function sanitizeText(input: string) {
  return input.replace(/\s+/g, ' ').trim();
}

function seemsRelevant(text: string) {
  const hasInsuranceContext = INSURANCE_CONTEXT_PATTERNS.some((pattern) => pattern.test(text));
  const hasDenialSignal = ACCESS_BLOCK_PATTERNS.some((pattern) => pattern.test(text)) || RELEVANCE_PATTERNS.some((pattern) => pattern.test(text));
  const looksGeneric = GENERIC_INSURANCE_PATTERNS.some((pattern) => pattern.test(text)) && !hasDenialSignal;
  return hasInsuranceContext && hasDenialSignal && !looksGeneric;
}

function buildFingerprint(parts: string[]) {
  return createHash('sha1').update(parts.join('|')).digest('hex').slice(0, 24);
}

function toObservation(post: any, subreddit: string) {
  const title = sanitizeText(post.title || '');
  const body = sanitizeText(post.selftext || '');
  const permalink = post.permalink?.startsWith('http') ? post.permalink : `https://www.reddit.com${post.permalink || ''}`;
  const text = `${title} ${body}`.trim();

  if (!text || !seemsRelevant(text)) return null;

  const insurer = extractInsurer(text);
  const procedure = inferProcedure(text);
  const normalizedReason = normalizeDenialReasonText(text);
  const denialCategory = inferDenialCategory({
    denialReason: text,
    procedure,
    summary: title,
    narrative: body,
  });
  const recordForScoring = {
    insurer,
    procedure,
    denialReason: denialCategory === 'Unknown' ? normalizedReason : denialCategory,
    summary: title,
    narrative: body,
    source: `Reddit r/${subreddit}`,
    url: permalink,
    planType: inferPlanType(text),
    isERISA: inferErisaStatus(text),
    medicalNecessityFlag: /medical necessity|not medically necessary/i.test(text),
  };
  const lowSignal = isLowSignalRecord(recordForScoring);
  let qualityScore = computeQualityScore(recordForScoring);
  if (body.length > 300) qualityScore += 10;
  if (/appeal|external review|overturned|upheld/i.test(text)) qualityScore += 5;
  if (qualityScore > 100) qualityScore = 100;

  return {
    observation_id: `reddit_${subreddit.toLowerCase()}_${post.id}`,
    canonical_url: permalink,
    source_type: 'reddit',
    source_label: `Reddit r/${subreddit}`,
    source_weight: 'public_patient_forum',
    title: title || `Reddit post from r/${subreddit}`,
    raw_text: text.slice(0, 5000),
    story_excerpt: (body || title).slice(0, 1200),
    insurer_raw: insurer === 'Unknown' ? null : insurer,
    insurer_normalized: insurer,
    procedure_raw: procedure,
    procedure_normalized: procedure,
    denial_reason_raw: text.slice(0, 500),
    denial_category: denialCategory,
    state: inferState(text),
    plan_type: recordForScoring.planType,
    erisa_status: recordForScoring.isERISA,
    appeal_outcome: /overturned/i.test(text) ? 'overturned' : /upheld/i.test(text) ? 'upheld' : null,
    quality_score: qualityScore,
    is_low_signal: lowSignal,
    fingerprint: buildFingerprint([subreddit, title.toLowerCase(), procedure, insurer]),
    ingested_at: new Date().toISOString(),
    source_published_at: post.created_utc ? new Date(post.created_utc * 1000).toISOString() : null,
  };
}

async function fetchSubredditSearch(subreddit: string, term: string, limit: number) {
  const encoded = encodeURIComponent(term);
  const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encoded}&restrict_sr=1&sort=new&limit=${limit}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'FightInsuranceDenials/1.0',
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Reddit search failed for r/${subreddit} ${term}: ${response.status}`);
  }

  const payload: any = await response.json();
  return payload?.data?.children?.map((child: any) => child.data) || [];
}

async function fetchPullPushPage(subreddit: string, size: number, before?: number) {
  const params = new URLSearchParams({
    subreddit,
    size: String(size),
  });
  if (before) params.set('before', String(before));

  const url = `https://api.pullpush.io/reddit/search/submission/?${params.toString()}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'FightInsuranceDenials/1.0',
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`PullPush fetch failed for r/${subreddit}: ${response.status}`);
  }

  const payload: any = await response.json();
  return payload?.data || [];
}

async function insertRows(rows: Array<{ insertId: string; json: Record<string, unknown> }>) {
  if (rows.length === 0) return { inserted: 0, errors: [] as unknown[] };

  const { projectId, accessToken } = await getBigQueryAccessToken();
  const response = await fetch(
    `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets/${DATASET_ID}/tables/raw_web_observations/insertAll`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        kind: 'bigquery#tableDataInsertAllRequest',
        skipInvalidRows: true,
        ignoreUnknownValues: false,
        rows,
      }),
    }
  );

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`BigQuery Reddit insert failed: ${response.status} ${text}`);
  }

  const payload = text ? JSON.parse(text) : {};
  return {
    inserted: rows.length,
    errors: payload.insertErrors || [],
  };
}

export async function ingestRedditToBigQuery(options?: {
  subreddits?: string[];
  terms?: string[];
  limitPerTerm?: number;
}) {
  const allSubreddits = options?.subreddits || TARGET_SUBREDDITS;
  const allTerms = options?.terms || SEARCH_TERMS;
  const limitPerTerm = options?.limitPerTerm || 12;
  const rotationSeed = new Date().getUTCHours();
  const subredditOffset = rotationSeed % allSubreddits.length;
  const termOffset = rotationSeed % allTerms.length;
  const subreddits = Array.from({ length: Math.min(SUBREDDITS_PER_PASS, allSubreddits.length) }, (_, index) => {
    return allSubreddits[(subredditOffset + index) % allSubreddits.length];
  });
  const terms = Array.from({ length: Math.min(TERMS_PER_PASS, allTerms.length) }, (_, index) => {
    return allTerms[(termOffset + index) % allTerms.length];
  });

  const seen = new Set<string>();
  const observations: Array<Record<string, unknown>> = [];

  for (const subreddit of subreddits) {
    for (const term of terms) {
      try {
        const posts = await fetchSubredditSearch(subreddit, term, limitPerTerm);
        for (const post of posts) {
          if (!post?.id || seen.has(post.id)) continue;
          seen.add(post.id);
          const observation = toObservation(post, subreddit);
          if (observation) {
            observations.push(observation);
          }
        }
      } catch (error) {
        console.error(`[Warehouse] Reddit ingest failed for r/${subreddit} term ${term}:`, error);
      }
    }
  }

  const rows = observations.map((observation) => ({
    insertId: String(observation.observation_id),
    json: observation,
  }));

  const result = await insertRows(rows);
  return {
    scanned: seen.size,
    relevant: observations.length,
    inserted: result.inserted,
    errors: result.errors.length,
  };
}

export async function backfillHistoricalRedditToBigQuery(options?: {
  subreddits?: string[];
  pagesPerSubreddit?: number;
  pageSize?: number;
}) {
  const subreddits = options?.subreddits || TARGET_SUBREDDITS;
  const pagesPerSubreddit = options?.pagesPerSubreddit || 6;
  const pageSize = Math.min(options?.pageSize || PULLPUSH_PAGE_SIZE, 250);
  const seen = new Set<string>();
  const observations: Array<Record<string, unknown>> = [];
  let scanned = 0;
  let failures = 0;

  for (const subreddit of subreddits) {
    let before: number | undefined;
    for (let page = 0; page < pagesPerSubreddit; page += 1) {
      try {
        const posts = await fetchPullPushPage(subreddit, pageSize, before);
        if (!posts.length) break;

        scanned += posts.length;
        for (const post of posts) {
          if (!post?.id || seen.has(post.id)) continue;
          seen.add(post.id);
          const observation = toObservation(post, subreddit);
          if (observation) observations.push(observation);
        }

        const oldestTimestamp = posts.reduce((min: number | null, post: any) => {
          const created = Number(post?.created_utc || 0);
          if (!created) return min;
          if (min === null || created < min) return created;
          return min;
        }, null);

        if (!oldestTimestamp) break;
        before = oldestTimestamp - 1;
      } catch (error) {
        failures += 1;
        console.error(`[Warehouse] PullPush backfill failed for r/${subreddit} page ${page + 1}:`, error);
        break;
      }
    }
  }

  const rows = observations.map((observation) => ({
    insertId: String(observation.observation_id),
    json: observation,
  }));

  const result = await insertRows(rows);
  return {
    scanned,
    relevant: observations.length,
    inserted: result.inserted,
    errors: result.errors.length,
    failures,
  };
}

export async function fetchRedditWarehouseCounts() {
  const { projectId } = await getBigQueryAccessToken();
  const { rows } = await runBigQuerySql(`
    SELECT COUNT(*) AS reddit_observation_count
    FROM \`${projectId}.${DATASET_ID}.raw_web_observations\`
    WHERE source_type = 'reddit'
  `);
  return Number(rows[0]?.reddit_observation_count || 0);
}
