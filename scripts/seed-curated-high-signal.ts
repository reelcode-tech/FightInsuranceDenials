import admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import type { DenialRecord } from '../src/types';
import { legacyDenialToStory } from '../src/lib/storyMapper';
import { normalizeLegacyDenial, normalizedRecordToStoryPatch } from '../src/lib/normalization';

const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({ projectId: firebaseConfig.projectId });
}

const db = getFirestore(admin.app(), firebaseConfig.firestoreDatabaseId);

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

const curatedRecords: Array<Partial<DenialRecord> & Record<string, any>> = [
  {
    insurer: 'Cigna',
    procedure: 'PXDX bulk claim review workflow',
    denialReason: 'Automated claim rejection without individualized file review',
    summary: 'ProPublica reported that Cigna used its PXDX system to reject certain claims in bulk, with former insiders describing denials issued without opening patient files.',
    narrative: 'Systemic evidence source documenting an automated denial workflow tied to common tests and procedures.',
    status: 'denied',
    tags: ['curated', 'propublica', 'systemic', 'high-signal'],
    isPublic: true,
    source: 'ProPublica',
    url: 'https://www.propublica.org/article/cigna-pxdx-medical-health-insurance-rejection-claims',
    planType: 'Unknown',
    isERISA: 'Unknown',
    medicalNecessityFlag: true,
  },
  {
    insurer: 'UnitedHealthcare',
    procedure: 'Ulcerative colitis treatment regimen',
    denialReason: 'Not medically necessary',
    summary: 'ProPublica detailed a case in which United reviewed a costly ulcerative colitis treatment regimen and denied coverage as not medically necessary.',
    narrative: 'Patient-level investigative case involving a high-dollar account and disputed medical-necessity reasoning.',
    status: 'denied',
    tags: ['curated', 'propublica', 'patient-story', 'high-signal'],
    isPublic: true,
    source: 'ProPublica',
    url: 'https://www.propublica.org/article/unitedhealth-healthcare-insurance-denial-ulcerative-colitis',
    planType: 'Employer Sponsored',
    isERISA: 'ERISA',
    medicalNecessityFlag: true,
  },
  {
    insurer: 'UnitedHealthcare',
    procedure: 'Residential eating disorder treatment',
    denialReason: 'Coverage terminated after insurer-selected psychiatric review',
    summary: 'ProPublica reported on mental health denials where insurer-linked doctors were criticized by courts for their judgment in treatment reviews.',
    narrative: 'Systemic evidence source centered on mental health parity and physician review quality.',
    status: 'denied',
    tags: ['curated', 'propublica', 'mental-health', 'high-signal'],
    isPublic: true,
    source: 'ProPublica',
    url: 'https://www.propublica.org/article/mental-health-insurance-denials-unitedhealthcare-cigna-doctors',
    planType: 'Unknown',
    isERISA: 'Unknown',
    medicalNecessityFlag: true,
  },
  {
    insurer: 'UnitedHealthcare',
    procedure: 'Applied Behavior Analysis (ABA) therapy',
    denialReason: 'Coverage limitations for autism therapy',
    summary: 'ProPublica reported on UnitedHealth limiting access to ABA therapy for children with autism despite protected-benefit arguments and investigations.',
    narrative: 'Systemic evidence source tied to autism treatment denials and regulatory scrutiny.',
    status: 'denied',
    tags: ['curated', 'propublica', 'autism', 'high-signal'],
    isPublic: true,
    source: 'ProPublica',
    url: 'https://www.propublica.org/article/unitedhealthcare-insurance-autism-denials-applied-behavior-analysis-medicaid',
    planType: 'Medicaid',
    isERISA: 'Non-ERISA',
  },
  {
    insurer: 'UnitedHealthcare',
    procedure: 'State-law-protected testing and treatment',
    denialReason: 'State consumer protection did not apply to self-funded ERISA plan',
    summary: 'ProPublica highlighted how state laws can fail to protect patients when a denial arises under self-funded ERISA coverage.',
    narrative: 'Systemic evidence source useful for ERISA benchmarking and legal segmentation.',
    status: 'denied',
    tags: ['curated', 'propublica', 'erisa', 'high-signal'],
    isPublic: true,
    source: 'ProPublica',
    url: 'https://www.propublica.org/article/health-insurance-denials-breaking-state-laws',
    planType: 'Employer Sponsored',
    isERISA: 'ERISA',
  },
  {
    insurer: 'Multiple insurers',
    procedure: 'Claim file disclosure after denial',
    denialReason: 'Opaque denial process and hidden claim file materials',
    summary: 'ProPublica’s Claim File Helper documents the records patients can request to understand denial decisions and appeal more effectively.',
    narrative: 'Supportive evidence source for transparency and appeal workflow tooling.',
    status: 'denied',
    tags: ['curated', 'propublica', 'claim-file', 'tooling'],
    isPublic: true,
    source: 'ProPublica',
    url: 'https://projects.propublica.org/claimfile/',
    planType: 'Unknown',
    isERISA: 'Unknown',
  },
  {
    insurer: 'Medicare Advantage organizations',
    procedure: 'Prior authorization utilization management criteria',
    denialReason: 'Use of internal coverage criteria in prior authorization',
    summary: 'CMS now requires Medicare Advantage organizations to submit annual utilization-management data describing internal coverage criteria used in prior authorization workflows.',
    narrative: 'Official transparency source for payer-level utilization-management logic.',
    status: 'denied',
    tags: ['curated', 'cms', 'prior-auth', 'official'],
    isPublic: true,
    source: 'CMS',
    url: 'https://www.cms.gov/medicare/audits-compliance/part-c/part-d-compliance-audits/part-c-utilization-management-um-audits',
    planType: 'Medicare Advantage',
    isERISA: 'Non-ERISA',
  },
  {
    insurer: 'Impacted payers',
    procedure: 'Electronic prior authorization workflows',
    denialReason: 'Delayed or opaque prior authorization decisioning',
    summary: 'CMS finalized rules expanding prior authorization transparency, timelines, and electronic exchange requirements for impacted payers.',
    narrative: 'Official policy source supporting observatory benchmarks around prior authorization timelines and data access.',
    status: 'denied',
    tags: ['curated', 'cms', 'prior-auth', 'official'],
    isPublic: true,
    source: 'CMS',
    url: 'https://www.cms.gov/newsroom/press-releases/cms-finalizes-rule-expand-access-health-information-and-improve-prior-authorization-process',
    planType: 'Unknown',
    isERISA: 'Unknown',
  },
  {
    insurer: 'Qualified Health Plans and Medicare Advantage organizations',
    procedure: 'Prior authorization metrics reporting',
    denialReason: 'Prior authorization volume, denial, and turnaround reporting requirements',
    summary: 'CMS provides a reporting overview template for prior authorization metrics that can support benchmark and observatory schema design.',
    narrative: 'Official reporting-framework source for denial-rate analytics and turnaround metrics.',
    status: 'denied',
    tags: ['curated', 'cms', 'analytics', 'official'],
    isPublic: true,
    source: 'CMS',
    url: 'https://www.cms.gov/files/document/prior-authorization-metrics-reporting-overview-template.pdf',
    planType: 'Unknown',
    isERISA: 'Unknown',
  },
  {
    insurer: 'New York-regulated health plans',
    procedure: 'External appeal for medical necessity, experimental, or out-of-network denial',
    denialReason: 'Final adverse determination subject to external appeal',
    summary: 'New York DFS explains and administers external appeals for denials based on medical necessity, experimental treatment, and out-of-network disputes.',
    narrative: 'Official appeals-rights source useful for workflow deadlines and category labeling.',
    status: 'denied',
    tags: ['curated', 'ny-dfs', 'external-appeal', 'official'],
    isPublic: true,
    source: 'NY DFS',
    url: 'https://www.dfs.ny.gov/consumers/appealing-a-health-plan-decision',
    planType: 'Non-ERISA',
    isERISA: 'Non-ERISA',
    medicalNecessityFlag: true,
  },
  {
    insurer: 'New York health insurers',
    procedure: 'External appeal decisions and consumer guide benchmarks',
    denialReason: 'External appeal overturn and reversal patterns',
    summary: 'The New York consumer guide publishes insurer-level external appeal figures, including reversed and upheld decisions, which can inform benchmark tables.',
    narrative: 'Official benchmarking source for insurer- and state-level overturn rates.',
    status: 'denied',
    tags: ['curated', 'ny-dfs', 'benchmark', 'official'],
    isPublic: true,
    source: 'NY DFS',
    url: 'https://www.dfs.ny.gov/consumers/health_insurance/guide_2016',
    planType: 'Non-ERISA',
    isERISA: 'Non-ERISA',
  },
  {
    insurer: 'EviCore-affiliated payer programs',
    procedure: 'Prior authorization review requests',
    denialReason: 'Utilization review denial patterns by indication and reason',
    summary: 'EviCore publishes annual utilization statistics including denial reasons, procedure categories, and geography-specific summaries where required by state law.',
    narrative: 'Vendor transparency source that can support procedure-level and reason-level denial analytics.',
    status: 'denied',
    tags: ['curated', 'evicore', 'prior-auth', 'high-signal'],
    isPublic: true,
    source: 'EviCore',
    url: 'https://www.evicore.com/annual-utilization-statistics',
    planType: 'Unknown',
    isERISA: 'Unknown',
  },
  {
    insurer: 'UnitedHealthcare',
    procedure: 'Medicare Advantage member complaints and denial experiences',
    denialReason: 'Coverage obstacles and appeal frustration',
    summary: 'Public AARP community threads surface recurring member complaints and can be used as low-weight public narrative evidence after heavy filtering.',
    narrative: 'Public community source; useful for narrative signals but should be weighted lower than official or investigative sources.',
    status: 'denied',
    tags: ['curated', 'aarp', 'public-forum', 'low-weight'],
    isPublic: true,
    source: 'AARP Community Forums',
    url: 'https://community.aarp.org/t5/Medicare-Insurance/United-Healthcare/td-p/2604675',
    planType: 'Medicare Advantage',
    isERISA: 'Non-ERISA',
  },
];

async function main() {
  let added = 0;
  let skipped = 0;

  for (const raw of curatedRecords) {
    const existing = await db.collection('denials').where('url', '==', raw.url).limit(1).get();
    if (!existing.empty) {
      skipped++;
      continue;
    }

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
        methodology_version: 'seed-v1',
        updated_at: FieldValue.serverTimestamp(),
      },
    });

    const storyRef = await db.collection('stories').add(storyDoc);

    await storyRef.set({ story_id: storyRef.id }, { merge: true });

    await db.collection('denials').add({
      ...stripUndefined(normalized),
      story_id: storyRef.id,
      createdAt: FieldValue.serverTimestamp(),
    });

    added++;
  }

  console.log(JSON.stringify({ attempted: curatedRecords.length, added, skipped }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
