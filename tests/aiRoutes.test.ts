import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExtractionPrompt } from '../api/_lib/aiPipeline';

test('extraction prompt asks for denial quote, deadlines, ERISA, and IME details', () => {
  const prompt = buildExtractionPrompt('Claim denied for ABA therapy.');

  assert.match(prompt, /Denial Quote/i);
  assert.match(prompt, /Appeal Deadline/i);
  assert.match(prompt, /ERISA/i);
  assert.match(prompt, /IME/i);
  assert.match(prompt, /ABA therapy/i);
});
