import assert from 'node:assert/strict';
import test from 'node:test';
import { buildObservationFingerprint, computeSourceConfidence, dedupeObservations, describeSourceConfidence } from '@/src/lib/sourceSignals';

const baseObservation = {
  canonical_url: 'https://example.org/post/1',
  source_label: 'Mayo Clinic Connect',
  source_type: 'public_patient_forum',
  source_weight: 'public_patient_forum',
  insurer_raw: 'United Healthcare',
  insurer_normalized: 'UnitedHealthcare',
  procedure_raw: 'Taltz coverage',
  procedure_normalized: 'Prescription medication',
  denial_reason_raw: 'Prior authorization denied for Taltz after step therapy.',
  denial_category: 'Prior Authorization',
  plan_type: 'Employer Sponsored',
  quality_score: 82,
  is_low_signal: false,
  fingerprint: '',
};

test('buildObservationFingerprint stays stable across spacing and capitalization differences', () => {
  const first = buildObservationFingerprint(baseObservation);
  const second = buildObservationFingerprint({
    ...baseObservation,
    canonical_url: 'HTTPS://example.org/post/1',
    insurer_normalized: ' unitedhealthcare ',
    denial_reason_raw: 'Prior   authorization denied for Taltz after step therapy.',
  });

  assert.equal(first, second);
});

test('computeSourceConfidence rewards structured higher-quality rows', () => {
  const officialScore = computeSourceConfidence({
    ...baseObservation,
    source_type: 'official_regulatory',
    source_weight: 'official_regulatory',
    quality_score: 92,
  });
  const socialScore = computeSourceConfidence({
    ...baseObservation,
    source_type: 'social_chatter',
    source_weight: 'social_chatter',
    quality_score: 60,
  });

  assert.ok(officialScore > socialScore);
  assert.ok(officialScore >= 90);
});

test('dedupeObservations keeps the strongest duplicate by fingerprint', () => {
  const observations = dedupeObservations([
    { ...baseObservation, observation_id: 'one' } as any,
    {
      ...baseObservation,
      observation_id: 'two',
      quality_score: 91,
      insurer_raw: 'UnitedHealthcare',
    } as any,
  ]);

  assert.equal(observations.length, 1);
  assert.equal(observations[0].quality_score, computeSourceConfidence({
    ...baseObservation,
    observation_id: 'two',
    quality_score: 91,
    insurer_raw: 'UnitedHealthcare',
  } as any));
});

test('describeSourceConfidence returns public-facing labels', () => {
  const confidence = describeSourceConfidence({
    ...baseObservation,
    source_type: 'official_regulatory',
    source_weight: 'official_regulatory',
    quality_score: 94,
  });

  assert.equal(confidence.label, 'High-confidence source');
  assert.match(confidence.note, /structured detail|public evidence/i);
});
