export type WarehouseInsightCard = {
  eyebrow: string;
  title: string;
  body: string;
  countLabel: string;
  countValue: string;
};

export type WarehouseQuestionCard = {
  question: string;
  answer: string;
  evidence: string;
};

export const WAREHOUSE_SNAPSHOT_META = {
  updatedLabel: 'Warehouse snapshot updated Apr 16, 2026',
  usableRows: '14,202',
  source: 'Curated BigQuery summary, filtered to non-low-signal rows',
};

export const WAREHOUSE_INSIGHT_CARDS: WarehouseInsightCard[] = [
  {
    eyebrow: 'GLP-1 denials',
    title: 'GLP-1 medication denials are not just prior-auth fights.',
    body: 'The stronger warehouse view shows these denials split between prior authorization and explicit coverage exclusions. That means many patients are fighting plan language, not just paperwork.',
    countLabel: 'Prior auth + exclusion stories',
    countValue: '736',
  },
  {
    eyebrow: 'Therapy services',
    title: 'Therapy denials are often network-access fights in disguise.',
    body: 'The biggest therapy pattern is out-of-network denials, not just clinical disagreement. That changes what kind of appeal evidence matters.',
    countLabel: 'Therapy + out-of-network stories',
    countValue: '505',
  },
  {
    eyebrow: 'Cancer care',
    title: 'Cancer treatment denials are split between medical necessity and prior authorization.',
    body: 'That means patients need both stronger clinical documentation and a strategy for breaking authorization delays.',
    countLabel: 'Cancer-care repeat patterns',
    countValue: '930',
  },
  {
    eyebrow: 'Medicare Advantage',
    title: 'Medicare Advantage keeps surfacing as a multi-front denial problem.',
    body: 'The warehouse shows prior authorization, administrative, and medical-necessity fights all clustering in this plan type. Patients are not dealing with just one tactic.',
    countLabel: 'Top Medicare Advantage denial stories',
    countValue: '781',
  },
];

export const WAREHOUSE_QUESTION_CARDS: WarehouseQuestionCard[] = [
  {
    question: 'Is my denial mainly a paperwork fight or a plan-language fight?',
    answer:
      'For GLP-1 medication, the warehouse shows both prior authorization and coverage exclusion at very high volume. If your denial mentions exclusion language, a purely clinical rebuttal will not be enough.',
    evidence: 'GLP-1 medication: 404 prior auth + 332 coverage exclusion',
  },
  {
    question: 'Do people with my type of plan keep getting denied the same way?',
    answer:
      'Yes. Commercial and employer-sponsored plans skew medical necessity, while Medicare Advantage adds a heavier mix of prior auth and administrative barriers.',
    evidence: 'Commercial + Medical Necessity: 634 | Medicare Advantage top three: 301 / 247 / 233',
  },
  {
    question: 'Is my insurer using a repeat excuse, or is this just my case?',
    answer:
      'The warehouse shows clear repeat excuse patterns. UnitedHealthcare is showing up heavily in prior authorization and administrative denials, while Blue Cross Blue Shield is skewing more toward medical necessity.',
    evidence: 'UHC + Prior Auth: 416 | UHC + Administrative: 373 | BCBS + Medical Necessity: 330',
  },
];
