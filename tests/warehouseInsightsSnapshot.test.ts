import assert from 'node:assert/strict';
import test from 'node:test';
import { buildWarehouseDashboardSnapshot } from '../src/lib/warehouseInsightsSnapshot';
import type { PatternsResponse } from '../src/lib/insightsPresentation';

const mockPatterns: PatternsResponse = {
  status: 'success',
  overview: {
    totalRows: 14202,
    cleanPatternRows: 1173,
    unknownInsurerPct: 57,
    unknownCategoryPct: 26,
    genericProcedurePct: 18,
  },
  findings: [],
  topInsurers: [{ label: 'Blue Cross Blue Shield', value: 330 }],
  topCategories: [{ label: 'Prior Authorization', value: 2808 }],
  topProcedures: [{ label: 'Prescription medication', value: 1229 }],
  carePatterns: [
    {
      procedure: 'GLP-1 medication',
      category: 'Coverage Exclusion',
      value: 332,
      takeaway: 'GLP-1 fights keep surfacing.',
      whyItMatters: 'Patients often need plan language, not just another resubmission.',
    },
    {
      procedure: 'Therapy services',
      category: 'Out of Network',
      value: 505,
      takeaway: 'Therapy fights are often network fights.',
      whyItMatters: 'Network adequacy and continuity-of-care arguments matter here.',
    },
    {
      procedure: 'Cancer treatment',
      category: 'Medical Necessity',
      value: 473,
      takeaway: 'Cancer denials keep surfacing as medical necessity fights.',
      whyItMatters: 'Clinical documentation and specialist letters matter most here.',
    },
  ],
  planPatterns: [
    {
      planType: 'Medicare Advantage',
      category: 'Administrative',
      value: 247,
      takeaway: 'Medicare Advantage keeps surfacing with admin barriers.',
      whyItMatters: 'Patients need enrollment, auth timing, and denial notice details.',
    },
  ],
  questionInsights: [
    {
      question: 'Is this mainly a paperwork fight or a plan-language fight?',
      answer: 'GLP-1 denials split between prior auth and exclusion.',
      count: 736,
      filter: 'GLP-1 medication',
    },
  ],
  heatmap: [],
  procedureClusters: [],
  statePatterns: [],
  sourceMix: [
    { label: 'public_patient_forum', value: 900 },
    { label: 'official_regulatory', value: 180 },
  ],
};

test('warehouse dashboard snapshot formats live meta and cards from patterns', () => {
  const snapshot = buildWarehouseDashboardSnapshot(mockPatterns, new Date('2026-04-16T12:00:00Z'));

  assert.equal(snapshot.meta.usableRows, '14,202');
  assert.match(snapshot.meta.updatedLabel, /Apr 16, 2026/);
  assert.ok(snapshot.cards.length >= 3);
  assert.equal(snapshot.cards[0].eyebrow, 'Coverage Exclusion');
});

test('warehouse dashboard question cards stay user-facing and count-backed', () => {
  const snapshot = buildWarehouseDashboardSnapshot(mockPatterns, new Date('2026-04-16T12:00:00Z'));

  assert.ok(snapshot.questions[0].question.includes('?'));
  assert.match(snapshot.questions[0].evidence, /^\d[\d,]* matching stories$/);
  assert.ok(snapshot.questions[0].answer.length > 20);
});
