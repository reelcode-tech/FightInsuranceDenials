import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSeededStoryNarrative, mergeStoryExtraction } from '../src/lib/storyIntake';

test('buildSeededStoryNarrative starts from an existing first-person statement cleanly', () => {
  const result = buildSeededStoryNarrative('I have UHC and got denied Taltz');
  assert.equal(
    result,
    'I have UHC and got denied Taltz\n\nHas anyone else gone through this denial? Here is what happened to me:',
  );
});

test('buildSeededStoryNarrative adds a first-person frame when needed', () => {
  const result = buildSeededStoryNarrative('UnitedHealthcare Choice Plus denied Taltz');
  assert.equal(
    result,
    'I have UnitedHealthcare Choice Plus denied Taltz. Has anyone else gone through this denial? Here is what happened to me:',
  );
});

test('mergeStoryExtraction prefers manual corrections over extracted values', () => {
  const result = mergeStoryExtraction({
    extractedData: {
      insurer: 'Unknown',
      planType: 'Unknown',
      procedure: 'Medical Service',
      denialReason: 'Coverage Denial',
      date: '2026-04-01',
      cptCodes: [],
    },
    manualFields: {
      insurer: 'UnitedHealthcare',
      planType: 'Choice Plus PPO',
      procedure: 'Taltz',
      denialReason: 'Prior Authorization',
      date: '2026-04-10',
    },
    narrative: 'My biologic was denied.',
    rawText: '',
  });

  assert.equal(result.insurer, 'UnitedHealthcare');
  assert.equal(result.planType, 'Choice Plus PPO');
  assert.equal(result.procedure, 'Taltz');
  assert.equal(result.denialReason, 'Prior Authorization');
  assert.equal(result.date, '2026-04-10');
});
