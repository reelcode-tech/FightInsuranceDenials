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
      onFindPatternFromQuery={() => {}}
      onStartStoryFromQuery={() => {}}
    />
  );
}

test('homepage shows the two-door conversion state when no featured stories exist', () => {
  const markup = renderHomepage([]);

  assert.match(markup, /Write My Appeal Letter/);
  assert.match(markup, /Search Real Denials/);
  assert.match(markup, /For Patients/);
  assert.match(markup, /For Self-Funded Employers/);
  assert.match(markup, /Request a TPA Visibility Check/);
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

  assert.match(markup, /Two ways to use FightInsuranceDenials/);
  assert.match(markup, /Search Real Denials/);
  assert.match(markup, /My biologic was denied after repeat paperwork/);
});
