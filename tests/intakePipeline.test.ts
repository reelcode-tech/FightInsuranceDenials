import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAppealDraftInput,
  buildEditableAppealFields,
  mergeAppealExtraction,
  normalizeExtractionResult,
  validateUploadFileMeta,
} from '../src/lib/intakePipeline';

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

test('creates editable appeal fields from extraction output', () => {
  const fields = buildEditableAppealFields(
    normalizeExtractionResult({
      insurer: 'UnitedHealthcare',
      planType: 'Choice Plus PPO',
      procedure: 'Taltz',
      denialReason: 'Prior Authorization',
      denialQuote: 'Coverage denied pending prior authorization review.',
      appealDeadline: '180 days',
      date: '2026-04-12',
    }),
  );

  assert.equal(fields.insurer, 'UnitedHealthcare');
  assert.equal(fields.planType, 'Choice Plus PPO');
  assert.equal(fields.procedure, 'Taltz');
  assert.equal(fields.denialReason, 'Prior Authorization');
  assert.equal(fields.denialQuote, 'Coverage denied pending prior authorization review.');
  assert.equal(fields.appealDeadline, '180 days');
  assert.equal(fields.date, '2026-04-12');
});

test('manual appeal edits override extraction before draft generation', () => {
  const merged = mergeAppealExtraction({
    extracted: normalizeExtractionResult({
      insurer: 'Unknown',
      planType: 'Unknown',
      procedure: 'Medical Service',
      denialReason: 'Coverage Denial',
      date: '',
    }),
    editable: {
      insurer: 'UnitedHealthcare',
      planType: 'Choice Plus PPO',
      procedure: 'Taltz',
      denialReason: 'Prior Authorization',
      denialQuote: 'Denied because step therapy was not completed.',
      appealDeadline: '180 days from letter',
      date: '2026-04-12',
    },
  });

  assert.equal(merged.insurer, 'UnitedHealthcare');
  assert.equal(merged.planType, 'Choice Plus PPO');
  assert.equal(merged.procedure, 'Taltz');
  assert.equal(merged.denialReason, 'Prior Authorization');
  assert.equal(merged.denialQuote, 'Denied because step therapy was not completed.');
  assert.equal(merged.appealDeadline, '180 days from letter');
  assert.equal(merged.date, '2026-04-12');
});
