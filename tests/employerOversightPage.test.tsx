import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import B2BDataProducts from '../src/components/B2BDataProducts';

test('employer oversight page sells decision-ready plan review instead of generic data products', () => {
  const markup = renderToStaticMarkup(React.createElement(B2BDataProducts));

  assert.match(markup, /Employer Plan Oversight/);
  assert.match(markup, /Your TPA decides what gets paid/i);
  assert.match(markup, /Use this when/i);
  assert.match(markup, /renewal/i);
  assert.match(markup, /Decision Readiness Review/);
  assert.match(markup, /Plan Denial Audit/);
  assert.match(markup, /Ongoing Denial Oversight/);
  assert.match(markup, /What you send us/i);
  assert.match(markup, /What we deliver/i);
  assert.match(markup, /835 remittance/i);
  assert.match(markup, /prior authorization log/i);
  assert.match(markup, /appeals log/i);
  assert.match(markup, /Blue Cross MN/i);
  assert.match(markup, /Public data tells you what questions to ask/i);
  assert.doesNotMatch(markup, /For lawyers/);
  assert.doesNotMatch(markup, /For hospitals/);
  assert.doesNotMatch(markup, /For regulators/);
});
