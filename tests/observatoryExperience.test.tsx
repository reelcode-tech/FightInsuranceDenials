import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ObservatoryExperience from '../src/components/ObservatoryExperience';

function renderHomepage(featuredStories: any[] = []) {
  return renderToStaticMarkup(
    <ObservatoryExperience
      featuredStories={featuredStories}
      totalStories={1173}
      topCategory="Prior Authorization"
      searchTerm=""
      onSearchTermChange={() => {}}
      onNavigate={() => {}}
      onOpenRecordFromQuery={() => {}}
      onStartStoryFromQuery={() => {}}
    />
  );
}

test('homepage story section shows an intentional proof state when no featured stories exist', () => {
  const markup = renderHomepage([]);

  assert.match(markup, /We do not show fabricated patient stories here\./);
  assert.match(markup, /This section only fills with published, anonymized stories from the live database\./);
  assert.doesNotMatch(markup, /Taltz denied by UnitedHealthcare|UnitedHealthcare.*Choice Plus PPO/i);
});

test('homepage still renders real featured stories when they exist', () => {
  const markup = renderHomepage([
    {
      id: 'story-1',
      insurer: 'UnitedHealthcare',
      planType: 'Choice Plus PPO',
      procedure: 'Taltz',
      denialReason: 'Prior Authorization',
      date: '2026-04-16',
      status: 'denied',
      narrative: 'My biologic was denied.',
      tags: [],
      isPublic: true,
      createdAt: null,
      summary: 'My biologic was denied after repeat paperwork.',
    },
  ]);

  assert.match(markup, /Taltz denied by UnitedHealthcare/);
  assert.doesNotMatch(markup, /We do not show fabricated patient stories here\./);
});
