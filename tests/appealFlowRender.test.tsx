import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AppealTools from '../src/components/AppealTools';
import SubmitDenial from '../src/components/SubmitDenial';

test('write my appeal page keeps the upload-first promise visible', () => {
  const markup = renderToStaticMarkup(React.createElement(AppealTools));

  assert.match(markup, /Write My Appeal Letter/);
  assert.match(markup, /Upload denial letter, photo, or PDF/);
  assert.match(markup, /Search real denials/i);
  assert.match(markup, /6 moves that actually win appeals/i);
});

test('share your story page collects the metadata needed to improve the record', () => {
  const markup = renderToStaticMarkup(React.createElement(SubmitDenial));

  assert.match(markup, /Share what happened\. Help the record grow\./);
  assert.match(markup, /Tell us what happened first\./);
  assert.match(markup, /What helps most/);
  assert.match(markup, /Insurer, if you know it/);
  assert.match(markup, /Procedure, drug, or service/);
  assert.match(markup, /Read paperwork without storing it/i);
  assert.match(markup, /We do not save the uploaded denial letter/i);
  assert.match(markup, /You choose what gets shared/);
  assert.match(markup, /Add at least a few details or paperwork first\./);
});
