export interface GuidanceLink {
  label: string;
  url: string;
}

export interface NewsCard {
  source: string;
  title: string;
  summary: string;
  url: string;
  published: string;
}

export interface AppealTip {
  title: string;
  detail: string;
  whyItWorks: string;
  links: GuidanceLink[];
}

export const HOMEPAGE_NEWS: NewsCard[] = [
  {
    source: 'CMS',
    title: 'CMS is pushing payers to give a specific reason when they deny prior authorization.',
    summary:
      'Federal prior authorization rules now put more pressure on plans to return a specific denial reason. That matters because vague denials are much harder to challenge.',
    url: 'https://www.cms.gov/files/document/fact-sheet-cms-interoperability-and-prior-authorization-final-rule-cms-0057-f.pdf',
    published: 'CMS final rule guidance',
  },
  {
    source: 'KFF',
    title: "KFF says prior authorization is now the public's biggest insurance burden.",
    summary:
      'A February 2026 KFF poll found prior authorization ranks as the biggest burden in getting care, and many people say denials or delays damage their mental health and finances.',
    url: 'https://www.kff.org/public-opinion/kff-health-tracking-poll-prior-authorizations-rank-as-publics-biggest-burden-when-getting-health-care/',
    published: 'Feb 2, 2026',
  },
  {
    source: 'KFF',
    title: 'Medicare Advantage prior authorization still points to the same access problem.',
    summary:
      "KFF's Medicare Advantage analysis keeps surfacing the same issue: large volumes of prior authorization requests, denials, and appeals that beneficiaries often do not feel equipped to navigate.",
    url: 'https://www.kff.org/medicare/issue-brief/medicare-advantage-and-prior-authorization/',
    published: 'KFF Medicare analysis',
  },
];

export const APPEAL_SUCCESS_TIPS: AppealTip[] = [
  {
    title: 'Ask for the exact rule they used to deny you.',
    detail:
      `Do not settle for "not medically necessary" or "not covered." Ask for the plan provision, clinical criteria, coverage policy, or utilization-management guideline they relied on.`,
    whyItWorks:
      "A stronger appeal argues against the insurer's actual logic, not a vague summary of it. Specific denial reasons are also becoming an explicit regulatory expectation.",
    links: [
      {
        label: 'CMS prior authorization final rule guidance',
        url: 'https://www.cms.gov/files/document/fact-sheet-cms-interoperability-and-prior-authorization-final-rule-cms-0057-f.pdf',
      },
      {
        label: 'Department of Labor claims guidance',
        url: 'https://www.dol.gov/agencies/ebsa/about-ebsa/our-activities/resource-center/publications/filing-a-claim-for-your-health-benefits',
      },
    ],
  },
  {
    title: "Match your doctor's evidence to the denial reason.",
    detail:
      'If the denial says prior authorization, medical necessity, experimental, or out-of-network, answer that exact issue with chart notes, treatment history, guidelines, and a specialist letter.',
    whyItWorks:
      'Appeals improve when the record directly answers the insurer’s stated reason instead of just repeating that care is important.',
    links: [
      {
        label: 'Patient Advocate Foundation appeal tips',
        url: 'https://www.patientadvocate.org/download-view/tips-for-appealing-insurance-denials/',
      },
      {
        label: 'California IMR program overview',
        url: 'https://www.insurance.ca.gov/01-consumers/110-health/60-resources/01-imr/',
      },
    ],
  },
  {
    title: 'Watch the deadline like it can end the case, because it often can.',
    detail:
      'Track denial date, internal appeal deadline, and external review deadline in one place. Medicare, ERISA, marketplace, and state-regulated plans all work differently.',
    whyItWorks:
      'People lose good cases by missing a procedural step. The timeline is part of the appeal, not an administrative afterthought.',
    links: [
      {
        label: 'CMS appeal rights fact sheet',
        url: 'https://www.cms.gov/cciio/resources/fact-sheets-and-faqs/appeals06152012a',
      },
      {
        label: 'Department of Labor filing a claim guide',
        url: 'https://www.dol.gov/agencies/ebsa/about-ebsa/our-activities/resource-center/publications/filing-a-claim-for-your-health-benefits',
      },
    ],
  },
  {
    title: 'Keep a call log and document who said what.',
    detail:
      'Save denial notices, call dates, reference numbers, representative names, and any statement about policy, timing, or documentation requirements.',
    whyItWorks:
      'Administrative and coding disputes often turn on missing records, mixed messages, or insurer delay. A good chronology can make those failures visible.',
    links: [
      {
        label: 'Patient Advocate Foundation appeal tips',
        url: 'https://www.patientadvocate.org/download-view/tips-for-appealing-insurance-denials/',
      },
    ],
  },
  {
    title: 'Ask who made the denial and what credentials they had.',
    detail:
      'If a medical director or reviewer signed the denial, ask for their qualifications and whether their specialty matches your condition or treatment.',
    whyItWorks:
      'That can expose situations where a denial sounds clinical but was made by someone without the right specialty expertise to overrule treating clinicians.',
    links: [
      {
        label: 'Department of Labor filing a claim guide',
        url: 'https://www.dol.gov/agencies/ebsa/about-ebsa/our-activities/resource-center/publications/filing-a-claim-for-your-health-benefits',
      },
      {
        label: 'Patient Advocate Foundation appeal tips',
        url: 'https://www.patientadvocate.org/download-view/tips-for-appealing-insurance-denials/',
      },
    ],
  },
  {
    title: 'Escalate beyond the plan when the plan keeps stonewalling.',
    detail:
      'If the insurer upholds the denial or misses required timelines, look at external review, state insurance regulators, EBSA, or parity-enforcement routes depending on the plan type.',
    whyItWorks:
      'The strongest leverage sometimes comes after the internal appeal, especially for medical-necessity, parity, and network-access fights.',
    links: [
      {
        label: 'California IMR program',
        url: 'https://www.insurance.ca.gov/01-consumers/110-health/60-resources/01-imr/',
      },
      {
        label: 'Department of Labor mental health benefits guide',
        url: 'https://www.dol.gov/agencies/ebsa/about-ebsa/our-activities/resource-center/publications/understanding-your-mental-health-and-substance-use-disorder-benefits',
      },
    ],
  },
];
