import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ObservatoryExperience from '../src/components/ObservatoryExperience';
import DataVisualizations from '../src/components/DataVisualizations';

test('homepage splits patients and employers into measurable conversion paths', () => {
  const markup = renderToStaticMarkup(
    React.createElement(ObservatoryExperience, {
      featuredStories: [],
      totalStories: 1173,
      topCategory: 'Prior Authorization',
      searchTerm: '',
      onSearchTermChange: () => {},
      onNavigate: () => {},
      onFindPatternFromQuery: () => {},
      onStartStoryFromQuery: () => {},
    })
  );

  assert.match(markup, /Two ways to use FightInsuranceDenials/i);
  assert.match(markup, /For Patients/);
  assert.match(markup, /For Self-Funded Employers/);
  assert.match(markup, /Write My Appeal Letter/);
  assert.match(markup, /Search Real Denials/);
  assert.match(markup, /Request a TPA Visibility Check/);
  assert.match(markup, /Free patient tools/);
  assert.match(markup, /Employer validation/);
});

test('data visualizations page explains lookup scope and state-by-state limits', () => {
  const markup = renderToStaticMarkup(React.createElement(DataVisualizations));

  assert.match(markup, /Search Denial Patterns by State, Insurer, and Care Type/);
  assert.match(markup, /Read the public record/);
  assert.match(markup, /We found public stories that are closest to this fight/);
  assert.match(markup, /What is in this lookup/);
  assert.match(markup, /What is not in this lookup/);
  assert.match(markup, /State-by-state view/);
  assert.match(markup, /publicly shared patient stories/i);
  assert.match(markup, /Am I the only one getting denied for this\?/);
  assert.match(markup, /What excuse is my insurer using on everyone else\?/);
  assert.match(markup, /What actually helped other patients/i);
  assert.match(markup, /Type your denial in plain English/);
  assert.match(markup, /Use this in your appeal \(60 seconds\)/);
});
