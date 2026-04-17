import type { PatternsResponse } from './insightsPresentation';

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

export type WarehouseSnapshotMeta = {
  updatedLabel: string;
  usableRows: string;
  source: string;
};

export type WarehouseDashboardSnapshot = {
  meta: WarehouseSnapshotMeta;
  cards: WarehouseInsightCard[];
  questions: WarehouseQuestionCard[];
};

function formatCount(value: number) {
  return value.toLocaleString();
}

function formatUpdatedLabel(date: Date) {
  return `Warehouse snapshot updated ${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
}

function buildSourceLabel(patterns: PatternsResponse) {
  const sourceSummary = patterns.sourceMix
    .slice(0, 2)
    .map((item) => item.label.replace(/_/g, ' '))
    .join(' + ');

  return sourceSummary ? `Live observatory snapshot from ${sourceSummary}` : 'Live observatory snapshot';
}

function buildInsightCards(patterns: PatternsResponse): WarehouseInsightCard[] {
  const cards: WarehouseInsightCard[] = [];
  const careCards = patterns.carePatterns.slice(0, 3).map((pattern) => ({
    eyebrow: pattern.category,
    title: `${pattern.procedure} denials are repeating in the same way.`,
    body: pattern.whyItMatters,
    countLabel: 'Matching stories',
    countValue: formatCount(pattern.value),
  }));
  const planCard = patterns.planPatterns[0]
    ? {
        eyebrow: patterns.planPatterns[0].planType,
        title: `${patterns.planPatterns[0].planType} plans keep surfacing with ${patterns.planPatterns[0].category.toLowerCase()}.`,
        body: patterns.planPatterns[0].whyItMatters,
        countLabel: 'Matching stories',
        countValue: formatCount(patterns.planPatterns[0].value),
      }
    : null;

  cards.push(...careCards);
  if (planCard) cards.push(planCard);
  return cards.slice(0, 4);
}

function buildQuestionCards(patterns: PatternsResponse): WarehouseQuestionCard[] {
  const directQuestions = patterns.questionInsights.slice(0, 3).map((item) => ({
    question: item.question,
    answer: item.answer,
    evidence: `${formatCount(item.count)} matching stories`,
  }));

  if (directQuestions.length) return directQuestions;

  const fallbackCategory = patterns.topCategories[0];
  const fallbackProcedure = patterns.topProcedures[0];
  const fallbackInsurer = patterns.topInsurers[0];

  return [
    fallbackCategory
      ? {
          question: `How often does ${fallbackCategory.label.toLowerCase()} keep surfacing?`,
          answer: `${fallbackCategory.label} is one of the strongest repeat denial reasons in the live public record right now.`,
          evidence: `${formatCount(fallbackCategory.value)} published stories`,
        }
      : null,
    fallbackProcedure
      ? {
          question: `Is ${fallbackProcedure.label.toLowerCase()} a repeat fight or a one-off?`,
          answer: `${fallbackProcedure.label} is surfacing often enough to compare your denial against other patients' stories.`,
          evidence: `${formatCount(fallbackProcedure.value)} published stories`,
        }
      : null,
    fallbackInsurer
      ? {
          question: `Does ${fallbackInsurer.label} keep using the same excuses?`,
          answer: `${fallbackInsurer.label} is named often enough in the public record to start from precedent instead of guesswork.`,
          evidence: `${formatCount(fallbackInsurer.value)} published stories`,
        }
      : null,
  ].filter(Boolean) as WarehouseQuestionCard[];
}

export function buildWarehouseDashboardSnapshot(
  patterns: PatternsResponse,
  updatedAt: Date = new Date()
): WarehouseDashboardSnapshot {
  return {
    meta: {
      updatedLabel: formatUpdatedLabel(updatedAt),
      usableRows: formatCount(patterns.overview.totalRows),
      source: buildSourceLabel(patterns),
    },
    cards: buildInsightCards(patterns),
    questions: buildQuestionCards(patterns),
  };
}
