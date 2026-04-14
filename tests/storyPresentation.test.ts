import assert from 'node:assert/strict';
import test from 'node:test';
import { buildStoryActionTag, buildStorySummary, buildStoryTags, buildStoryTitle } from '@/src/lib/storyPresentation';

test('buildStoryTitle prefers procedure and insurer over raw narrative', () => {
  assert.equal(
    buildStoryTitle({
      insurer: 'UnitedHealthcare',
      procedure: 'Taltz',
      summary: 'A very long patient story that should not become the title.',
    }),
    'Taltz denied by UnitedHealthcare'
  );
});

test('buildStorySummary dedupes repeated copy and truncates safely', () => {
  const summary = buildStorySummary({
    summary:
      'I was denied my MRI after prior authorization failed. I was denied my MRI after prior authorization failed. My doctor appealed right away and treatment was delayed.',
  });

  assert.match(summary, /I was denied my MRI after prior authorization failed\./);
  assert.doesNotMatch(summary, /I was denied my MRI after prior authorization failed\. I was denied my MRI after prior authorization failed\./);
});

test('buildStoryTags filters unknown values', () => {
  assert.deepEqual(
    buildStoryTags({
      procedure: 'Prescription medication',
      insurer: 'Unknown insurer',
      planType: 'Marketplace',
    }),
    ['Prescription medication', 'Marketplace']
  );
});

test('buildStoryActionTag detects successful appeals', () => {
  assert.equal(
    buildStoryActionTag({
      summary: 'The denial was overturned after external review.',
    }),
    'Appeal won'
  );
});
