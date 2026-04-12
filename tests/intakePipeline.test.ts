import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAppealDraftInput, normalizeExtractionResult, validateUploadFileMeta } from '../src/lib/intakePipeline';

test('accepts supported PDF upload metadata', () => {
  const result = validateUploadFileMeta({ name: 'denial-letter.pdf', type: 'application/pdf', size: 1024 });
  assert.equal(result.ok, true);
});

test('accepts supported PNG upload metadata', () => {
  const result = validateUploadFileMeta({ name: 'eob.png', type: 'image/png', size: 2048 });
  assert.equal(result.ok, true);
});

test('accepts supported JPG upload metadata', () => {
  const result = validateUploadFileMeta({ name: 'claim.jpg', type: 'image/jpeg', size: 4096 });
  assert.equal(result.ok, true);
});

test('rejects unsupported uploads', () => {
  const result = validateUploadFileMeta({ name: 'notes.txt', type: 'text/plain', size: 100 });
  assert.equal(result.ok, false);
});

test('normalizes sparse extraction data into a usable record', () => {
  const normalized = normalizeExtractionResult({
    insurer: 'UnitedHealthcare',
    procedure: 'MRI',
    denialReason: 'Prior Authorization',
  });

  assert.equal(normalized.insurer, 'UnitedHealthcare');
  assert.equal(normalized.planType, 'Unknown');
  assert.equal(normalized.procedure, 'MRI');
  assert.equal(normalized.denialReason, 'Prior Authorization');
  assert.deepEqual(normalized.cptCodes, []);
});

test('builds denial record for appeal generation from extraction output', () => {
  const denial = buildAppealDraftInput({
    extracted: normalizeExtractionResult({
      insurer: 'Aetna',
      planType: 'PPO',
      procedure: 'GLP-1 medication',
      denialReason: 'Medical Necessity',
      date: '2026-04-12',
    }),
    narrative: 'My doctor prescribed it after multiple failed medications.',
  });

  assert.equal(denial.insurer, 'Aetna');
  assert.equal(denial.planType, 'PPO');
  assert.equal(denial.procedure, 'GLP-1 medication');
  assert.equal(denial.denialReason, 'Medical Necessity');
  assert.equal(denial.status, 'denied');
});
