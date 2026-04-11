export type PublicSourcePriority =
  | 'scrape_now'
  | 'manual_review_only'
  | 'partnership_needed'
  | 'do_not_prioritize';

export type PublicSourceWeight =
  | 'official_regulatory'
  | 'investigative'
  | 'public_patient_forum'
  | 'complaint_platform'
  | 'social_chatter';

export interface PublicSourceCatalogEntry {
  id: string;
  name: string;
  priority: PublicSourcePriority;
  weight: PublicSourceWeight;
  access: 'public' | 'public_but_sensitive' | 'gated';
  notes: string;
  exampleUrls: string[];
}

export const PUBLIC_SOURCE_CATALOG: PublicSourceCatalogEntry[] = [
  {
    id: 'cms',
    name: 'CMS prior authorization and reporting materials',
    priority: 'scrape_now',
    weight: 'official_regulatory',
    access: 'public',
    notes: 'Best for benchmarks, timelines, categories, and policy-grounded observatory facts.',
    exampleUrls: [
      'https://www.cms.gov/newsroom/press-releases/cms-finalizes-rule-expand-access-health-information-and-improve-prior-authorization-process',
      'https://www.cms.gov/files/document/prior-authorization-metrics-reporting-overview-template.pdf',
    ],
  },
  {
    id: 'hhs-oig',
    name: 'HHS OIG reports',
    priority: 'scrape_now',
    weight: 'official_regulatory',
    access: 'public',
    notes: 'High-value official reports on denial and prior authorization failures.',
    exampleUrls: [
      'https://oig.hhs.gov/reports/all/2022/some-medicare-advantage-organization-denials-of-prior-authorization-requests-raise-concerns-about-beneficiary-access-to-care/',
    ],
  },
  {
    id: 'ny-dfs',
    name: 'New York DFS',
    priority: 'scrape_now',
    weight: 'official_regulatory',
    access: 'public',
    notes: 'Excellent for external appeal guidance, reversal stats, and consumer-rights workflows.',
    exampleUrls: [
      'https://www.dfs.ny.gov/consumers/appealing-a-health-plan-decision',
      'https://www.dfs.ny.gov/reports_and_publications/dfs_annual_reports/cpfe_annualrep_2021',
    ],
  },
  {
    id: 'kff',
    name: 'KFF denial and appeals analysis',
    priority: 'scrape_now',
    weight: 'official_regulatory',
    access: 'public',
    notes: 'Useful benchmark synthesis from insurer-reported or federal data.',
    exampleUrls: [
      'https://www.kff.org/private-insurance/issue-brief/claims-denials-and-appeals-in-aca-marketplace-plans/',
      'https://www.kff.org/medicare/issue-brief/medicare-advantage-and-prior-authorization/',
    ],
  },
  {
    id: 'propublica',
    name: 'ProPublica',
    priority: 'scrape_now',
    weight: 'investigative',
    access: 'public',
    notes: 'High-signal investigative evidence for systemic denial tactics.',
    exampleUrls: [
      'https://projects.propublica.org/claimfile/',
      'https://www.propublica.org/article/cigna-pxdx-medical-review-denial-errors',
    ],
  },
  {
    id: 'stat-news',
    name: 'STAT health reporting',
    priority: 'scrape_now',
    weight: 'investigative',
    access: 'public',
    notes: 'Useful for insurer algorithm, utilization management, and post-acute care reporting.',
    exampleUrls: [
      'https://www.statnews.com/2023/11/14/unitedhealth-navihealth-lawsuit-medicare-advantage/',
    ],
  },
  {
    id: 'patient-advocate-foundation',
    name: 'Patient Advocate Foundation',
    priority: 'scrape_now',
    weight: 'official_regulatory',
    access: 'public',
    notes: 'Strong for appeal templates, consumer steps, and denial taxonomy support.',
    exampleUrls: [
      'https://www.patientadvocate.org/explore-our-resources/insurance-denials-appeals/where-to-start-if-insurance-has-denied-your-service-and-will-not-pay/',
    ],
  },
  {
    id: 'als-association',
    name: 'The ALS Association insurance and appeals resources',
    priority: 'scrape_now',
    weight: 'official_regulatory',
    access: 'public',
    notes: 'Strong source for appeals help, DME coverage, home infusion, payer toolkits, and denial support in a high-cost disease area.',
    exampleUrls: [
      'https://www.als.org/support/als-insurance-navigator/legal-assistance',
      'https://www.als.org/order-portal/resource-guide/understanding-insurance-and-benefits-when-you-have-als',
    ],
  },
  {
    id: 'alzheimers-association',
    name: "Alzheimer's Association insurance and care coverage resources",
    priority: 'scrape_now',
    weight: 'official_regulatory',
    access: 'public',
    notes: 'High-value for dementia care coverage, Medicare GUIDE, long-term care, and appeal-related planning.',
    exampleUrls: [
      'https://www.alz.org/Help-Support/Caregiving/Financial-Legal-Planning/Insurance',
      'https://www.alz.org/help-support/caregiving/financial-legal-planning/medicare-guide-program-for-dementia-care',
    ],
  },
  {
    id: 'obesity-action-coalition',
    name: 'Obesity Action Coalition coverage and obesity medication resources',
    priority: 'scrape_now',
    weight: 'official_regulatory',
    access: 'public',
    notes: 'High-value for GLP-1 coverage fights, obesity treatment access, plan exclusions, and prior authorization barriers.',
    exampleUrls: [
      'https://www.obesityaction.org/action-through-advocacy/access-to-care/access-to-obesity-care-and-treatments/',
      'https://www.obesityaction.org/resources/weight-bias-in-health-insurance-coverage/',
    ],
  },
  {
    id: 'cancercare',
    name: 'CancerCare financial and insurance navigation resources',
    priority: 'scrape_now',
    weight: 'official_regulatory',
    access: 'public',
    notes: 'Useful for oncology access barriers, treatment affordability, appeals support, and insurer navigation in cancer care.',
    exampleUrls: [
      'https://www.cancercare.org/publications/62-understanding_the_cost_of_care_and_your_health_insurance',
      'https://www.cancercare.org/questions/329',
    ],
  },
  {
    id: 'autism-speaks',
    name: 'Autism Speaks insurance and ABA coverage resources',
    priority: 'scrape_now',
    weight: 'official_regulatory',
    access: 'public',
    notes: 'High-value for autism therapy, ABA access, mandates, and insurer friction around developmental and behavioral care.',
    exampleUrls: [
      'https://www.autismspeaks.org/insurance-coverage-autism',
      'https://www.autismspeaks.org/tool-kit-excerpt/what-if-my-insurance-company-denies-coverage',
    ],
  },
  {
    id: 'nami',
    name: 'NAMI mental health insurance and parity resources',
    priority: 'scrape_now',
    weight: 'official_regulatory',
    access: 'public',
    notes: 'Important for mental health parity, therapy coverage, psychiatric medication access, and appeals involving depression, anxiety, and behavioral care.',
    exampleUrls: [
      'https://www.nami.org/Your-Journey/Individuals-with-Mental-Illness/Getting-Mental-Health-Support/Understanding-Health-Insurance',
      'https://www.nami.org/Advocacy/Policy-Priorities/Improving-Health/Mental-Health-Parity',
    ],
  },
  {
    id: 'ama',
    name: 'American Medical Association',
    priority: 'scrape_now',
    weight: 'official_regulatory',
    access: 'public',
    notes: 'Use for burden metrics and physician-reported prior authorization impacts.',
    exampleUrls: [
      'https://www.ama-assn.org/practice-management/prior-authorization/2024-ama-prior-authorization-physician-survey',
    ],
  },
  {
    id: 'dol-parity',
    name: 'Department of Labor parity guidance',
    priority: 'scrape_now',
    weight: 'official_regulatory',
    access: 'public',
    notes: 'Important for mental health parity categorization and legal benchmarking.',
    exampleUrls: [
      'https://www.dol.gov/agencies/ebsa/laws-and-regulations/laws/mental-health-and-substance-use-disorder-parity',
    ],
  },
  {
    id: 'aarp',
    name: 'AARP community forums',
    priority: 'scrape_now',
    weight: 'public_patient_forum',
    access: 'public',
    notes: 'Valuable for Medicare and older-user narratives; useful for emotional language and recurring issues.',
    exampleUrls: [
      'https://community.aarp.org/t5/Medicare-Insurance/United-Healthcare/m-p/2604984',
    ],
  },
  {
    id: 'breastcancer-org',
    name: 'Breastcancer.org community',
    priority: 'scrape_now',
    weight: 'public_patient_forum',
    access: 'public',
    notes: 'Strong treatment-access narratives with specific procedures, drugs, and insurer conflict.',
    exampleUrls: [
      'https://community.breastcancer.org/en/discussion/880142/share-your-insurance-claims-denial-story',
      'https://community.breastcancer.org/en/discussion/885091/insurance-denial',
    ],
  },
  {
    id: 'healthinsurance-reddit',
    name: 'Reddit r/HealthInsurance',
    priority: 'scrape_now',
    weight: 'public_patient_forum',
    access: 'public',
    notes: 'Best Reddit source for health-plan denials, claim confusion, and appeals.',
    exampleUrls: [
      'https://www.reddit.com/r/HealthInsurance/',
    ],
  },
  {
    id: 'medicare-reddit',
    name: 'Reddit r/Medicare',
    priority: 'scrape_now',
    weight: 'public_patient_forum',
    access: 'public',
    notes: 'Good for Medicare Advantage and older-user appeal pain points.',
    exampleUrls: [
      'https://www.reddit.com/r/medicare/',
    ],
  },
  {
    id: 'chronic-illness-reddit',
    name: 'Reddit chronic illness communities',
    priority: 'scrape_now',
    weight: 'public_patient_forum',
    access: 'public',
    notes: 'Useful for medication, infusion, and specialist-access denial narratives.',
    exampleUrls: [
      'https://www.reddit.com/r/ChronicIllness/',
    ],
  },
  {
    id: 'cancerforums',
    name: 'Cancer support forums',
    priority: 'manual_review_only',
    weight: 'public_patient_forum',
    access: 'public_but_sensitive',
    notes: 'Potentially valuable, but require careful review and conservative extraction.',
    exampleUrls: [
      'https://community.breastcancer.org/',
    ],
  },
  {
    id: 'themighty',
    name: 'The Mighty chronic illness and mental health stories',
    priority: 'manual_review_only',
    weight: 'public_patient_forum',
    access: 'public_but_sensitive',
    notes: 'Useful for emotional language, mental health coverage struggles, therapy reimbursement, and medication-access narratives, but should be reviewed conservatively.',
    exampleUrls: [
      'https://themighty.com/topic/mental-health/',
      'https://themighty.com/topic/chronic-illness/',
    ],
  },
  {
    id: 'aarp-medicare-forums',
    name: 'AARP Medicare insurance boards',
    priority: 'scrape_now',
    weight: 'public_patient_forum',
    access: 'public',
    notes: 'Rich source for Medicare and retiree-plan friction, especially with major carriers.',
    exampleUrls: [
      'https://community.aarp.org/t5/Medicare-Insurance/bd-p/MedicareInsurance',
    ],
  },
  {
    id: 'reddit',
    name: 'Reddit',
    priority: 'scrape_now',
    weight: 'public_patient_forum',
    access: 'public',
    notes: 'Use targeted terms and compliant retrieval only; good for issue discovery and patient frustration patterns.',
    exampleUrls: [
      'https://www.reddit.com/r/HealthInsurance/',
    ],
  },
  {
    id: 'naic-mcas',
    name: 'NAIC MCAS reporting references',
    priority: 'scrape_now',
    weight: 'official_regulatory',
    access: 'public',
    notes: 'Important benchmark lead for state-level claims denial and appeals reporting.',
    exampleUrls: [
      'https://content.naic.org/mcas_market_conduct_annual_statement.htm',
    ],
  },
  {
    id: 'state-insurance-departments',
    name: 'State insurance department appeal and complaint pages',
    priority: 'scrape_now',
    weight: 'official_regulatory',
    access: 'public',
    notes: 'Excellent source of external appeal rights, complaint taxonomies, and annual reports.',
    exampleUrls: [
      'https://www.dfs.ny.gov/consumers/appealing-a-health-plan-decision',
    ],
  },
  {
    id: 'consumeraffairs',
    name: 'ConsumerAffairs',
    priority: 'scrape_now',
    weight: 'complaint_platform',
    access: 'public',
    notes: 'Useful for insurer-level complaint clustering, but lower trust than patient forums or official sources.',
    exampleUrls: [
      'https://www.consumeraffairs.com/insurance/united_health_care.html',
      'https://www.consumeraffairs.com/insurance/cigna_health.html',
    ],
  },
  {
    id: 'bbb',
    name: 'BBB complaints',
    priority: 'scrape_now',
    weight: 'complaint_platform',
    access: 'public',
    notes: 'Helpful for recurring administrative failure patterns and company responses.',
    exampleUrls: [
      'https://www.bbb.org/us/mn/minnetonka/profile/health-insurance/unitedhealth-group-0704-21000358/complaints',
    ],
  },
  {
    id: 'news-commentary',
    name: 'Public comments on insurer and healthcare investigative news',
    priority: 'manual_review_only',
    weight: 'social_chatter',
    access: 'public',
    notes: 'Useful for discovery and language mining, but should not be treated as primary evidence.',
    exampleUrls: [
      'https://www.youtube.com/',
    ],
  },
  {
    id: 'patientslikeme',
    name: 'PatientsLikeMe',
    priority: 'partnership_needed',
    weight: 'public_patient_forum',
    access: 'gated',
    notes: 'Treat as a partnership target, not a scraping target.',
    exampleUrls: [
      'https://www.patientslikeme.com/research/faq',
    ],
  },
  {
    id: 'healthunlocked',
    name: 'HealthUnlocked',
    priority: 'partnership_needed',
    weight: 'public_patient_forum',
    access: 'gated',
    notes: 'Promising network, but should be approached through formal collaboration or exports.',
    exampleUrls: [
      'https://support.healthunlocked.com/article/149-terms-for-community-partners',
    ],
  },
  {
    id: 'private-facebook-groups',
    name: 'Private Facebook groups',
    priority: 'partnership_needed',
    weight: 'social_chatter',
    access: 'gated',
    notes: 'Potentially rich, but sensitive and not appropriate for ad hoc scraping.',
    exampleUrls: [
      'https://www.facebook.com/help/412300192139228/',
    ],
  },
];
