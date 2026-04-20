import test from 'node:test';
import assert from 'node:assert/strict';
import { PUBLIC_STORY_COUNT, formatPublicStoryCount, normalizePublicStoryCount } from '../src/lib/publicMetrics';

test('public story count source of truth stays pinned to 1,173', () => {
  assert.equal(PUBLIC_STORY_COUNT, 1173);
  assert.equal(formatPublicStoryCount(), '1,173');
});

test('normalizePublicStoryCount falls back to source of truth when missing', () => {
  assert.equal(normalizePublicStoryCount(null), 1173);
  assert.equal(normalizePublicStoryCount(undefined), 1173);
  assert.equal(normalizePublicStoryCount(0), 1173);
  assert.equal(normalizePublicStoryCount(1173), 1173);
});
