import { FieldValue } from 'firebase-admin/firestore';
import { admin, getAdminDb } from './_firebaseAdmin';

const db = getAdminDb();

const sourceRecords = [
  {
    source_record_id: 'cms-prior-auth-final-rule',
    source_type: 'cms_mrf',
    canonical_url: 'https://www.cms.gov/newsroom/press-releases/cms-finalizes-rule-expand-access-health-information-and-improve-prior-authorization-process',
    title: 'CMS final rule on interoperability and prior authorization',
    raw_text: 'Official CMS source describing expanded prior authorization transparency, API exchange, and decision timeline expectations.',
  },
  {
    source_record_id: 'cms-um-audits',
    source_type: 'cms_mrf',
    canonical_url: 'https://www.cms.gov/medicare/audits-compliance/part-c/part-d-compliance-audits/part-c-utilization-management-um-audits',
    title: 'CMS Part C utilization management audits',
    raw_text: 'Official CMS oversight source for Medicare Advantage utilization management and prior authorization practices.',
  },
  {
    source_record_id: 'cms-prior-auth-reporting-template',
    source_type: 'cms_mrf',
    canonical_url: 'https://www.cms.gov/files/document/prior-authorization-metrics-reporting-overview-template.pdf',
    title: 'CMS prior authorization metrics reporting overview template',
    raw_text: 'Official reporting template describing utilization and turnaround metrics that can support observatory benchmarks.',
  },
  {
    source_record_id: 'healthcare-gov-internal-appeals',
    source_type: 'other_public_web',
    canonical_url: 'https://www.healthcare.gov/appeal-insurance-company-decision/internal-appeals/',
    title: 'HealthCare.gov internal appeals guidance',
    raw_text: 'Official consumer guidance on internal appeals after insurer denial decisions.',
  },
  {
    source_record_id: 'healthcare-gov-external-review',
    source_type: 'other_public_web',
    canonical_url: 'https://www.healthcare.gov/appeal-insurance-company-decision/external-review/',
    title: 'HealthCare.gov external review guidance',
    raw_text: 'Official consumer guidance on external review rights after internal appeal outcomes.',
  },
  {
    source_record_id: 'ny-dfs-appeals-guide',
    source_type: 'manual_research',
    canonical_url: 'https://www.dfs.ny.gov/consumers/appealing-a-health-plan-decision',
    title: 'New York DFS appeal guide',
    raw_text: 'Official New York external appeal rights page covering medical necessity, experimental treatment, and out-of-network disputes.',
  },
  {
    source_record_id: 'propublica-claimfile',
    source_type: 'propublica',
    canonical_url: 'https://projects.propublica.org/claimfile/',
    title: 'ProPublica Claim File Helper',
    raw_text: 'Public-interest tool for helping patients request the files behind denial decisions.',
  },
  {
    source_record_id: 'reddit-data-api-terms',
    source_type: 'other_public_web',
    canonical_url: 'https://redditinc.com/policies/data-api-terms',
    title: 'Reddit Data API Terms',
    raw_text: 'Compliance source governing what can and cannot be done with Reddit-sourced content.',
  },
  {
    source_record_id: 'hhs-oig-ma-prior-auth-denials',
    source_type: 'manual_research',
    canonical_url: 'https://oig.hhs.gov/reports/all/2022/some-medicare-advantage-organization-denials-of-prior-authorization-requests-raise-concerns-about-beneficiary-access-to-care/',
    title: 'HHS OIG Medicare Advantage prior authorization denials report',
    raw_text: 'Official watchdog report documenting that some Medicare Advantage denials met Medicare coverage rules and should not have been denied.',
  },
  {
    source_record_id: 'kff-aca-claims-denials-appeals',
    source_type: 'manual_research',
    canonical_url: 'https://www.kff.org/private-insurance/issue-brief/claims-denials-and-appeals-in-aca-marketplace-plans/',
    title: 'KFF claims denials and appeals in ACA marketplace plans',
    raw_text: 'Benchmark source summarizing insurer-reported claims denials, denial rates, and very low appeal usage in marketplace plans.',
  },
  {
    source_record_id: 'kff-medicare-advantage-prior-auth',
    source_type: 'manual_research',
    canonical_url: 'https://www.kff.org/medicare/issue-brief/medicare-advantage-and-prior-authorization/',
    title: 'KFF Medicare Advantage and prior authorization',
    raw_text: 'Benchmark source summarizing Medicare Advantage prior authorization volume, denial rates, and overturn patterns for appealed denials.',
  },
  {
    source_record_id: 'ny-dfs-cpfe-annual-report',
    source_type: 'manual_research',
    canonical_url: 'https://www.dfs.ny.gov/reports_and_publications/dfs_annual_reports/cpfe_annualrep_2021',
    title: 'New York DFS Consumer Protection and Financial Enforcement annual report',
    raw_text: 'Public annual reporting page containing external appeal counts and reversal benchmarks for New York-regulated health coverage disputes.',
  },
  {
    source_record_id: 'ama-prior-auth-survey-2024',
    source_type: 'manual_research',
    canonical_url: 'https://www.ama-assn.org/practice-management/prior-authorization/2024-ama-prior-authorization-physician-survey',
    title: 'AMA prior authorization physician survey 2024',
    raw_text: 'Context source describing clinician-reported delay, harm, and burden linked to prior authorization workflows.',
  },
  {
    source_record_id: 'dol-mhpaea-guidance',
    source_type: 'manual_research',
    canonical_url: 'https://www.dol.gov/agencies/ebsa/laws-and-regulations/laws/mental-health-and-substance-use-disorder-parity',
    title: 'DOL mental health parity overview',
    raw_text: 'Legal benchmark source relevant to categorizing denials affecting mental health and substance use disorder treatment.',
  },
  {
    source_record_id: 'stat-united-navihealth',
    source_type: 'other_public_web',
    canonical_url: 'https://www.statnews.com/2023/11/14/unitedhealth-navihealth-lawsuit-medicare-advantage/',
    title: 'STAT reporting on UnitedHealth and NaviHealth algorithmic denials',
    raw_text: 'Investigative reporting source describing allegations that algorithmic tools influenced post-acute care coverage limits and denials.',
  },
];

async function main() {
  let upserted = 0;

  for (const record of sourceRecords) {
    await db.collection('source_records').doc(record.source_record_id).set({
      ...record,
      created_at: FieldValue.serverTimestamp(),
    }, { merge: true });
    upserted++;
  }

  console.log(JSON.stringify({ upserted }, null, 2));
  await Promise.all(admin.apps.map((app) => app.delete()));
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
