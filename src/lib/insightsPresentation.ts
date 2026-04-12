export type MetricRow = { label: string; value: number };
export type HeatmapRow = { insurer: string; category: string; value: number };
export type ClusterRow = {
  procedure: string;
  insurer: string;
  category: string;
  value: number;
  takeaway: string;
  whyItMatters: string;
};
export type FindingRow = {
  title: string;
  body: string;
  tone: 'high' | 'medium' | 'warning';
};

export type PatternsResponse = {
  status: 'success' | 'error';
  overview: {
    totalRows: number;
    cleanPatternRows: number;
    unknownInsurerPct: number;
    unknownCategoryPct?: number;
    genericProcedurePct?: number;
  };
  findings: FindingRow[];
  topInsurers: MetricRow[];
  topCategories: MetricRow[];
  topProcedures: MetricRow[];
  heatmap: HeatmapRow[];
  procedureClusters: ClusterRow[];
  statePatterns: MetricRow[];
  sourceMix: MetricRow[];
};

export type ProofPoint = {
  eyebrow: string;
  title: string;
  body: string;
};

export type SummaryCard = {
  label: string;
  value: string;
  caption: string;
};

export type DemoSignal = {
  label: string;
  value: string;
};

export type DemoCard = {
  query: string;
  headline: string;
  subhead: string;
  signals: DemoSignal[];
};

function listSummary(rows: MetricRow[], count = 3) {
  return rows
    .slice(0, count)
    .map((item) => item.label)
    .filter(Boolean)
    .join(', ');
}

function humanizeSourceLabel(label: string) {
  const normalized = label.replace(/_/g, ' ');
  const overrides: Record<string, string> = {
    'public patient forum': 'public patient communities',
    'official regulatory': 'official and regulatory sources',
    investigative: 'investigative reporting',
    'social chatter': 'public social posts',
    'complaint platform': 'consumer complaint platforms',
  };
  return overrides[normalized] || normalized;
}

export function buildHomepageProofPoints(patterns: PatternsResponse | null): ProofPoint[] {
  const topInsurer = patterns?.topInsurers?.[0];
  const topCategory = patterns?.topCategories?.[0];
  const topProcedure = patterns?.topProcedures?.[0];

  return [
    {
      eyebrow: 'Most common roadblock',
      title: topCategory ? `${topCategory.label} keeps surfacing.` : 'Prior authorization keeps surfacing.',
      body: topCategory
        ? `${topCategory.value.toLocaleString()} published stories already point to the same roadblock, which means patients are not imagining this pattern.`
        : 'The strongest early signal is still prior authorization and paperwork-driven care delays.',
    },
    {
      eyebrow: 'Who people keep naming',
      title: topInsurer ? `${topInsurer.label} shows up the most.` : 'Named payer patterns are still building.',
      body: patterns?.topInsurers?.length
        ? `The clearest named insurers right now are ${listSummary(patterns.topInsurers)}, which gives patients somewhere concrete to start comparing stories.`
        : 'We only foreground insurer patterns when the payer is named clearly enough to be fair and useful.',
    },
    {
      eyebrow: 'What kind of care gets blocked',
      title: topProcedure ? `${topProcedure.label} is a repeat fight.` : 'Medication access is surfacing first.',
      body: topProcedure
        ? `${topProcedure.value.toLocaleString()} published stories involve ${topProcedure.label.toLowerCase()}, which makes it one of the clearest denial fights in the database.`
        : 'The strongest early clusters are still around medication access, specialty care, and pre-approval fights.',
    },
  ];
}

export function buildHomepageDemo(patterns: PatternsResponse | null): DemoCard {
  const topInsurer = patterns?.topInsurers?.[0];
  const topCategory = patterns?.topCategories?.[0];
  const topProcedure = patterns?.topProcedures?.[0];
  const total = patterns?.overview.cleanPatternRows || 0;

  return {
    query: 'UnitedHealthcare Choice Plus denied Taltz. Anyone else?',
    headline: 'The database should answer that question fast.',
    subhead: topInsurer && topCategory && topProcedure
      ? `We are already seeing repeat stories where ${topInsurer.label} appears alongside ${topCategory.label.toLowerCase()} fights and blocked ${topProcedure.label.toLowerCase()}.`
      : 'Search by insurer, plan, drug, procedure, or denial reason and start from precedent instead of guesswork.',
    signals: [
      {
        label: 'Published stories to compare',
        value: total ? total.toLocaleString() : 'Growing daily',
      },
      {
        label: 'Repeat roadblock',
        value: topCategory?.label || 'Prior Authorization',
      },
      {
        label: 'Care area surfacing most',
        value: topProcedure?.label || 'Prescription medication',
      },
    ],
  };
}

export function buildSummaryCards(patterns: PatternsResponse | null): SummaryCard[] {
  const topInsurer = patterns?.topInsurers?.[0];
  const topCategory = patterns?.topCategories?.[0];
  const topProcedure = patterns?.topProcedures?.[0];

  return [
    {
      label: 'If your denial came before care could start',
      value: patterns?.overview.cleanPatternRows?.toLocaleString() || '0',
      caption: `We already have ${patterns?.overview.cleanPatternRows?.toLocaleString() || '0'} published stories specific enough to compare. Start there instead of starting from scratch.`,
    },
    {
      label: 'The excuse patients keep hearing',
      value: topCategory?.label || 'Prior Authorization',
      caption: topCategory
        ? `${topCategory.value.toLocaleString()} published stories point to this tactic, so it is not just your insurer telling only you this.`
        : 'This is the strongest repeat denial tactic in the record so far.',
    },
    {
      label: 'The kind of care getting blocked most',
      value: topProcedure?.label || 'Prescription medication',
      caption: topProcedure
        ? `${topProcedure.value.toLocaleString()} stories involve this kind of care, which makes it one of the clearest places to compare your case.`
        : 'The record is surfacing medication and treatment access fights first.',
    },
    {
      label: 'The insurer to compare yourself against first',
      value: topInsurer?.label || 'Major carriers',
      caption: topInsurer
        ? `${topInsurer.value.toLocaleString()} published stories already name this insurer, giving you a real precedent lane to inspect.`
        : 'We only highlight insurers once the naming is clear enough to compare.',
    },
  ];
}

export function buildMethodologySummary(patterns: PatternsResponse | null) {
  const topSources = patterns?.sourceMix?.slice(0, 3).map((item) => humanizeSourceLabel(item.label)).join(', ');
  return {
    sourceSummary: topSources || 'public patient communities, complaint platforms, and benchmark sources',
    coverageSummary: patterns?.overview.cleanPatternRows
      ? `${patterns.overview.cleanPatternRows.toLocaleString()} published stories are already strong enough to compare in public.`
      : 'We only publish comparisons when a story is specific enough to help someone else act on it.',
  };
}

export function buildActionQuestions(patterns: PatternsResponse | null) {
  const topCategory = patterns?.topCategories?.[0];
  const topProcedure = patterns?.topProcedures?.[0];
  const topInsurer = patterns?.topInsurers?.[0];

  return [
    {
      title: 'Am I the only one this happened to?',
      body: `No. We already have ${patterns?.overview.cleanPatternRows?.toLocaleString() || '0'} public stories in the database, and they are clustered enough to compare by insurer, treatment, and denial reason.`,
    },
    {
      title: 'What excuse should I expect the insurer to lean on?',
      body: topCategory
        ? `${topCategory.label} is surfacing more than any other named denial pattern right now.`
        : 'Prior authorization and paperwork-driven delays are still the first pattern we see.',
    },
    {
      title: 'What kind of care keeps getting blocked?',
      body: topProcedure
        ? `${topProcedure.label} is the clearest repeat fight in the record so far.`
        : 'Medication access, specialty care, and procedures are surfacing first.',
    },
    {
      title: 'Which insurer should I compare myself against first?',
      body: topInsurer
        ? `${topInsurer.label} is the most frequently named insurer in the published record today.`
        : 'The published record is still building out named insurer comparisons.',
    },
  ];
}

export function buildSourceStory(patterns: PatternsResponse | null) {
  const sourceSummary = buildMethodologySummary(patterns).sourceSummary;
  return [
    {
      title: 'Where the evidence comes from',
      body: `We pull from ${sourceSummary}, then add public-interest benchmarks from groups like CMS, OIG, KFF, state regulators, and condition-specific advocacy communities.`,
    },
    {
      title: 'What we leave out',
      body: 'We do not publish every generic insurance complaint we find. We hold back vague insurance-shopping chatter, weak matches, and stories that are too thin to help someone compare their own denial.',
    },
    {
      title: 'Why this is useful',
      body: 'The goal is not just to count complaints. It is to help patients, reporters, advocates, and watchdogs spot repeated denial behavior they can actually use.',
    },
  ];
}
