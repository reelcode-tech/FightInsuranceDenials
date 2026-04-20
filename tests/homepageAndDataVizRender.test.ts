import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ObservatoryExperience from '../src/components/ObservatoryExperience';
import DataVisualizations from '../src/components/DataVisualizations';

test('homepage hero is user-focused and count-consistent', () => {
  const markup = renderToStaticMarkup(
    React.createElement(ObservatoryExperience, {
      featuredStories: [],
      totalStories: 1173,
      topCategory: 'Prior Authorization',
      searchTerm: '',
      onSearchTermChange: () => {},
      onNavigate: () => {},
      onOpenRecordFromQuery: () => {},
      onStartStoryFromQuery: () => {},
    })
  );

  assert.match(markup, /See whether your denial is happening to other patients\./);
  assert.match(markup, /1,173/);
  assert.match(markup, /How to use this in your appeal \(2 minutes\)/);
  assert.match(markup, /We do not show fabricated patient stories here\./);
});

test('data visualizations page explains how charts help in an appeal', () => {
  const markup = renderToStaticMarkup(React.createElement(DataVisualizations));

  assert.match(markup, /Denial patterns you can actually use in an appeal\./);
  assert.match(markup, /Copy a ready-to-paste citation for your appeal packet\./);
  assert.match(markup, /How to use this in your appeal \(2 minutes\)/);
});
