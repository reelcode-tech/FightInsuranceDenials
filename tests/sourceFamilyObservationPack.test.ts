import test from 'node:test';
import assert from 'node:assert/strict';
import { SOURCE_FAMILY_OBSERVATIONS } from '../src/lib/sourceFamilyObservationPack';

function countByLabel(label: string) {
  return SOURCE_FAMILY_OBSERVATIONS.filter((observation) => observation.source_label === label).length;
}

test('higher-fidelity source families have enough seeded observations to matter', () => {
  assert.ok(countByLabel('AARP Medicare Insurance Forum') >= 5);
  assert.ok(countByLabel('Mayo Clinic Connect') >= 8);
  assert.ok(countByLabel('Breastcancer.org Community') >= 5);
  assert.ok(countByLabel('Cancer Survivors Network') >= 8);
  assert.ok(countByLabel('Myeloma Beacon Forum') >= 2);
  assert.ok(countByLabel('PAF / PAN TotalAssist') >= 1);
  assert.ok(countByLabel('KFF Health News Bill of the Month') >= 1);
  assert.ok(countByLabel('Cancer Support Community') >= 1);
  assert.ok(countByLabel('JDRF / Breakthrough T1D') >= 1);
  assert.ok(countByLabel('T1International') >= 1);
});

test('source-family pack stays meaningfully diversified across trusted lanes', () => {
  const uniqueLabels = new Set(SOURCE_FAMILY_OBSERVATIONS.map((observation) => observation.source_label));
  assert.ok(uniqueLabels.size >= 25);
  assert.ok(SOURCE_FAMILY_OBSERVATIONS.length >= 60);
});
