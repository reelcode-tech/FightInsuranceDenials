import { FieldValue } from 'firebase-admin/firestore';
import type { DenialRecord } from '../src/types';
import { legacyDenialToStory } from '../src/lib/storyMapper';
import { normalizeLegacyDenial, normalizedRecordToStoryPatch } from '../src/lib/normalization';
import { admin, getAdminDb } from './_firebaseAdmin';

const db = getAdminDb();

function stableId(input: string) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 28);
}

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)).filter((item) => item !== undefined) as T;
  }

  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, stripUndefined(v)])
    ) as T;
  }

  return value;
}

const expandedRecords: Array<Partial<DenialRecord> & Record<string, any>> = [
  {
    insurer: 'Medicare Advantage organizations',
    procedure: 'Prior authorization requests and payment decisions',
    denialReason: 'Coverage denials on requests that met Medicare rules',
    summary: 'HHS OIG found that some Medicare Advantage organizations denied prior authorization requests and payment requests that met Medicare coverage rules, underscoring systemic review failures.',
    narrative: 'Official watchdog evidence source documenting wrongful denials within Medicare Advantage workflows.',
    status: 'denied',
    tags: ['curated', 'oig', 'official', 'medicare-advantage', 'high-signal'],
    isPublic: true,
    source: 'HHS OIG',
    url: 'https://oig.hhs.gov/reports/all/2022/some-medicare-advantage-organization-denials-of-prior-authorization-requests-raise-concerns-about-beneficiary-access-to-care/',
    planType: 'Medicare Advantage',
    isERISA: 'Non-ERISA',
    medicalNecessityFlag: true,
  },
  {
    insurer: 'ACA marketplace insurers',
    procedure: 'In-network claims across HealthCare.gov plans',
    denialReason: 'Claim denial rates and low appeal uptake',
    summary: 'KFF compiled HealthCare.gov insurer disclosures showing substantial claim denials and extremely low appeal rates, making it useful for benchmark framing.',
    narrative: 'Benchmark source highlighting how often claims are denied and how rarely consumers make it through the appeals process.',
    status: 'denied',
    tags: ['curated', 'kff', 'benchmark', 'marketplace', 'high-signal'],
    isPublic: true,
    source: 'KFF',
    url: 'https://www.kff.org/private-insurance/issue-brief/claims-denials-and-appeals-in-aca-marketplace-plans/',
    planType: 'Marketplace',
    isERISA: 'Non-ERISA',
  },
  {
    insurer: 'Medicare Advantage organizations',
    procedure: 'Prior authorization review and denials',
    denialReason: 'High-volume prior authorization denials with most appealed denials overturned',
    summary: 'KFF analyzed Medicare Advantage prior authorization data and highlighted that a small share of denied requests are appealed, but most appealed denials are partially or fully overturned.',
    narrative: 'Benchmark source supporting the core user promise that appeals can work even when initial denials feel final.',
    status: 'denied',
    tags: ['curated', 'kff', 'benchmark', 'medicare-advantage', 'high-signal'],
    isPublic: true,
    source: 'KFF',
    url: 'https://www.kff.org/medicare/issue-brief/medicare-advantage-and-prior-authorization/',
    planType: 'Medicare Advantage',
    isERISA: 'Non-ERISA',
  },
  {
    insurer: 'New York-regulated health plans',
    procedure: 'External appeal filings and outcomes',
    denialReason: 'Insurer denials reversed during external appeal process',
    summary: 'The New York DFS annual reporting pages publish counts of external appeals, reversals, and insurer-level outcomes that can inform overturn-rate baselines.',
    narrative: 'Official state benchmark source with real external appeal outcomes instead of anecdote alone.',
    status: 'denied',
    tags: ['curated', 'ny-dfs', 'external-appeal', 'benchmark', 'official'],
    isPublic: true,
    source: 'NY DFS Annual Reports',
    url: 'https://www.dfs.ny.gov/reports_and_publications/dfs_annual_reports/cpfe_annualrep_2021',
    planType: 'Non-ERISA',
    isERISA: 'Non-ERISA',
  },
  {
    insurer: 'Commercial health insurers',
    procedure: 'Claims denials and prior authorization burdens',
    denialReason: 'Administrative friction and access barriers',
    summary: 'AMA survey reporting continues to show that prior authorization burdens delay care, increase burnout, and can produce patient harm, making it a useful context source for observatory narratives.',
    narrative: 'Professional survey source that supports the lived-experience side of the database with clinician-reported consequences.',
    status: 'denied',
    tags: ['curated', 'ama', 'survey', 'prior-auth', 'context'],
    isPublic: true,
    source: 'American Medical Association',
    url: 'https://www.ama-assn.org/practice-management/prior-authorization/2024-ama-prior-authorization-physician-survey',
    planType: 'Unknown',
    isERISA: 'Unknown',
  },
  {
    insurer: 'UnitedHealthcare',
    procedure: 'Skilled nursing and post-acute care coverage',
    denialReason: 'Algorithm-guided early discharge or denial pressure',
    summary: 'Public reporting around NaviHealth and UnitedHealthcare has documented allegations that algorithmic decision support influenced post-acute coverage limits and denials.',
    narrative: 'Investigative source aligned with the project’s focus on opaque automated denial logic.',
    status: 'denied',
    tags: ['curated', 'investigative', 'algorithmic-denials', 'high-signal'],
    isPublic: true,
    source: 'STAT / public reporting',
    url: 'https://www.statnews.com/2023/11/14/unitedhealth-navihealth-lawsuit-medicare-advantage/',
    planType: 'Medicare Advantage',
    isERISA: 'Non-ERISA',
  },
  {
    insurer: 'Multiple insurers',
    procedure: 'Mental health and substance use treatment',
    denialReason: 'Parity-related limitations and medical-necessity disputes',
    summary: 'Federal parity enforcement materials and investigative coverage help categorize mental health denials where utilization review conflicts with parity requirements.',
    narrative: 'High-value legal framing source for future parity-rights detection and appeal guidance.',
    status: 'denied',
    tags: ['curated', 'mental-health', 'parity', 'legal-benchmark'],
    isPublic: true,
    source: 'DOL / public guidance',
    url: 'https://www.dol.gov/agencies/ebsa/laws-and-regulations/laws/mental-health-and-substance-use-disorder-parity',
    planType: 'Employer Sponsored',
    isERISA: 'ERISA',
    medicalNecessityFlag: true,
  },
];

async function main() {
  let added = 0;

  for (const raw of expandedRecords) {
    const normalized = normalizeLegacyDenial(raw);
    const story = legacyDenialToStory(normalized);
    const patch = normalizedRecordToStoryPatch(normalized);

    const storyDoc = stripUndefined({
      ...story,
      ...patch,
      status: 'published',
      timeline: {
        ...story.timeline,
        submission_timestamp: FieldValue.serverTimestamp(),
      },
      privacy: {
        ...story.privacy,
        consent_level: 'public_story',
        is_anonymized: true,
        contains_pii: false,
        public_story_ready: true,
      },
      benchmark: {
        similar_cases_count: 0,
        overturn_rate: 0,
        methodology_version: 'expanded-seed-v1',
        updated_at: FieldValue.serverTimestamp(),
      },
    });

    const recordKey = stableId(String(raw.url || `${raw.insurer}-${raw.procedure}`));
    const storyRef = db.collection('stories').doc(`seed_${recordKey}`);
    const storyId = storyRef.id;

    await storyRef.set({
      ...storyDoc,
      story_id: storyId,
    }, { merge: true });

    await db.collection('denials').doc(`seed_${recordKey}`).set({
      ...normalized,
      story_id: storyId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      isPublic: true,
      consentLevel: 'public_story',
      consentResearch: true,
    }, { merge: true });

    added++;
  }

  console.log(JSON.stringify({ added }, null, 2));
  await Promise.all(admin.apps.map((app) => app.delete()));
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
