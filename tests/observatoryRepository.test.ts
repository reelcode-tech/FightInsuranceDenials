import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSubmissionPrivacy } from '../src/lib/observatoryRepository';
import { legacyDenialToStory } from '../src/lib/storyMapper';

test('buildSubmissionPrivacy keeps public submissions eligible for anonymization workflow', () => {
  const privacy = buildSubmissionPrivacy({
    consentLevel: 'public_story',
    narrative: 'United denied my MRI and I need help.',
    uploadedFileUrl: 'https://storage.example/denial.pdf',
  });

  assert.deepEqual(privacy, {
    consent_level: 'public_story',
    is_anonymized: false,
    contains_pii: true,
    public_story_ready: true,
    raw_upload_url: 'https://storage.example/denial.pdf',
  });
});

test('buildSubmissionPrivacy avoids claiming anonymization before review', () => {
  const privacy = buildSubmissionPrivacy({
    consentLevel: 'aggregated_stats_only',
    narrative: '',
    uploadedFileUrl: null,
  });

  assert.equal(privacy.is_anonymized, false);
  assert.equal(privacy.contains_pii, false);
  assert.equal(privacy.public_story_ready, false);
});

test('legacyDenialToStory preserves explicit public story readiness flags', () => {
  const story = legacyDenialToStory({
    id: 'story-123',
    insurer: 'UnitedHealthcare',
    planType: 'Choice Plus PPO',
    procedure: 'MRI',
    denialReason: 'Prior Authorization',
    date: '2026-04-16',
    status: 'denied',
    narrative: 'My MRI was denied after weeks of pain.',
    tags: [],
    isPublic: false,
    consentLevel: 'public_story',
    public_story_ready: true,
    is_anonymized: false,
  });

  assert.equal(story.privacy.consent_level, 'public_story');
  assert.equal(story.privacy.public_story_ready, true);
  assert.equal(story.privacy.is_anonymized, false);
});
