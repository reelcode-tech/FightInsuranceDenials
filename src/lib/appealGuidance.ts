export interface GuidanceLink {
  label: string;
  url: string;
}

export interface NewsCard {
  narrative: string;
  source: string;
  title: string;
  summary: string;
  stat: string;
  pullQuote: string;
  whatThisMeans: string;
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
    narrative: 'The system is failing patients',
    source: 'KFF',
    title: 'Insurance denials are exploding, and patients are paying the price.',
    summary:
      'KFF found prior authorization now ranks as the biggest burden people face when they try to get care, with delays spilling into mental health, finances, and treatment timelines.',
    stat: 'Prior authorization is now the #1 burden to getting care',
    pullQuote:
      'Delays are not just administrative. They hit treatment timelines, mental health, and family finances at the same time.',
    whatThisMeans:
      'If your denial feels exhausting and isolating, that is not a one-off. Patients across the country are hitting the same wall.',
    url: 'https://www.kff.org/public-opinion/kff-health-tracking-poll-prior-authorizations-rank-as-publics-biggest-burden-when-getting-health-care/',
    published: 'Feb 2, 2026',
  },
  {
    narrative: 'Regulators are finally pushing back',
    source: 'CMS',
    title: 'Regulators are forcing insurers to be more specific when they say no.',
    summary:
      'CMS now requires payers to return more specific prior authorization denial reasons and faster responses, which should make vague stonewalling harder to hide behind.',
    stat: 'Plans must return specific denial reasons under the CMS final rule',
    pullQuote:
      'A vague denial is much harder to fight. Specific reasons create a paper trail patients and regulators can actually challenge.',
    whatThisMeans:
      'The rules are getting better, but patients still need to know how to use those reasons against the insurer in an appeal.',
    url: 'https://www.cms.gov/files/document/fact-sheet-cms-interoperability-and-prior-authorization-final-rule-cms-0057-f.pdf',
    published: 'CMS final rule guidance',
  },
  {
    narrative: 'Patients still lack the evidence to fight',
    source: 'Fight Insurance Denials',
    title: 'That is where this database becomes the missing piece.',
    summary:
      'Regulators can force better process, but they cannot hand a patient comparable stories, repeat insurer language, or plan-specific precedent. That is what this database is for.',
    stat: '1,173 published stories already in the record',
    pullQuote:
      'Scattered frustration is easy for insurers to ignore. A searchable public record is much harder to shrug off.',
    whatThisMeans:
      'This turns isolated stories into evidence you can search, compare, and use when you decide whether to appeal or share your own denial.',
    url: '/evidence-patterns',
    published: 'Live observatory signal',
  },
];

export const APPEAL_SUCCESS_TIPS: AppealTip[] = [
  {
    title: 'Demand the exact rule they used to deny you.',
    detail:
      'Do not settle for "not medically necessary" or "not covered." Ask for the plan provision, clinical criteria, formulary policy, or utilization-management rule they actually relied on.',
    whyItWorks:
      "A strong appeal argues against the insurer's real logic, not a vague summary of it. Specific denial reasons are also becoming a clearer regulatory expectation.",
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
      'If the denial says prior authorization, medical necessity, experimental, step therapy, or out-of-network, answer that exact issue with chart notes, treatment history, guidelines, and a specialist letter.',
    whyItWorks:
      "Appeals improve when the record directly answers the insurer's stated reason instead of just repeating that care is important.",
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
    title: 'Watch the deadline like it can end the case.',
    detail:
      'Track denial date, internal appeal deadline, and external review deadline in one place. Medicare, ERISA, marketplace, and state-regulated plans all work differently.',
    whyItWorks:
      'People lose strong cases by missing procedural steps. The timeline is part of the appeal, not an administrative afterthought.',
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
    title: 'Keep a call log and save every document.',
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
