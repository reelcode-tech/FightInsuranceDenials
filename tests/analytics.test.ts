import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAnalyticsEvent, getPhaseSuccessCriteria } from '../src/lib/analytics';

test('analytics events avoid personal health details and expose measurable funnel names', () => {
  const event = buildAnalyticsEvent('employer_tpa_visibility_check_click', {
    role: 'benefits leader',
    denialText: 'My MRI was denied by Example Plan',
    email: 'person@example.com',
  });

  assert.equal(event.name, 'employer_tpa_visibility_check_click');
  assert.equal(event.properties.role, 'benefits leader');
  assert.equal(event.properties.denialText, undefined);
  assert.equal(event.properties.email, undefined);
});

test('phase success criteria define measurable validation gates', () => {
  const criteria = getPhaseSuccessCriteria();

  assert.match(criteria[0].goal, /conversion/i);
  assert.match(criteria[0].successMetric, /TPA Visibility Check/i);
  assert.match(criteria[1].successMetric, /interviews/i);
  assert.match(criteria[2].successMetric, /plan-data/i);
});
