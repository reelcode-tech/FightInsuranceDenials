import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildActionQuestions,
  buildHomepageDemo,
  buildHomepageProofPoints,
  buildSourceStory,
  buildSummaryCards,
  type PatternsResponse,
} from '../src/lib/insightsPresentation';

const mockPatterns: PatternsResponse = {
  status: 'success',
  overview: {
    totalRows: 4200,
    cleanPatternRows: 1484,
    unknownInsurerPct: 72,
    unknownCategoryPct: 57,
    genericProcedurePct: 57,
  },
  findings: [],
  topInsurers: [{ label: 'UnitedHealthcare', value: 88 }],
  topCategories: [{ label: 'Prior Authorization', value: 194 }],
  topProcedures: [{ label: 'Prescription medication', value: 201 }],
  heatmap: [],
  procedureClusters: [],
  statePatterns: [],
  sourceMix: [
    { label: 'public_patient_forum', value: 900 },
    { label: 'official_regulatory', value: 180 },
    { label: 'investigative', value: 70 },
  ],
};

test('homepage proof points stay user-facing and avoid internal slice jargon', () => {
  const proofPoints = buildHomepageProofPoints(mockPatterns);

  assert.equal(proofPoints.length, 3);
  assert.match(proofPoints[0].title, /Prior Authorization/);
  assert.ok(proofPoints.every((point) => !/slice|warehouse|raw rows/i.test(point.body)));
});

test('homepage demo stays action-oriented and user-facing', () => {
  const demo = buildHomepageDemo(mockPatterns);

  assert.match(demo.headline, /repeat play/i);
  assert.equal(demo.signals.length, 3);
  assert.ok(demo.signals.every((item) => !/warehouse|slice/i.test(item.label)));
});

test('summary cards answer public-facing questions', () => {
  const cards = buildSummaryCards(mockPatterns);

  assert.equal(cards[0].label, 'Stories you can compare yourself against');
  assert.match(cards[1].caption, /194/);
  assert.match(cards[2].value, /Prescription medication/);
});

test('action questions turn metrics into end-user questions', () => {
  const questions = buildActionQuestions(mockPatterns);

  assert.equal(questions.length, 4);
  assert.match(questions[0].title, /Am I the only one/);
  assert.match(questions[3].body, /UnitedHealthcare/);
});

test('source story explains source coverage without internal QA language', () => {
  const story = buildSourceStory(mockPatterns);

  assert.equal(story.length, 3);
  assert.ok(story.every((item) => !/cleaned slice|raw observatory/i.test(item.body)));
  assert.match(story[0].body, /public patient communities/);
});
