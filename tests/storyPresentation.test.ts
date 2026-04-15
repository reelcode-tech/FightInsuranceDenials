import assert from 'node:assert/strict';
import test from 'node:test';
import { buildStoryActionTag, buildStoryPreview, buildStorySummary, buildStoryTags, buildStoryTitle, buildWhatWasDenied } from '@/src/lib/storyPresentation';

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

test('buildWhatWasDenied keeps the denied field concise for story cards', () => {
  assert.equal(
    buildWhatWasDenied({
      procedure: 'What was denied: No prior authorization put in for my assessment? So, as the text may say, I am being tested for autism as most people in my life generally think I have it',
    }),
    'Autism assessment'
  );
});

test('buildStoryPreview produces a shorter preview than the full summary', () => {
  const story = {
    summary:
      'My insurer kept denying Taltz even after my doctor documented failed medications and worsening symptoms. I appealed twice and still got pushed back into another prior authorization cycle.',
  };

  const summary = buildStorySummary(story);
  const preview = buildStoryPreview(story);

  assert.ok(preview.length < summary.length);
});

test('buildStoryTitle extracts a cleaner topic from messy denial text', () => {
  assert.equal(
    buildStoryTitle({
      summary: 'No prior authorization put in for my assessment? I am being tested for autism and the plan keeps delaying approval.',
    }),
    'Autism assessment denial'
  );
});
