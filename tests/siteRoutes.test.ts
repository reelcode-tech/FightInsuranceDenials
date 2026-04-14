import test from 'node:test';
import assert from 'node:assert/strict';
import { getTabFromPath, TAB_PATHS } from '@/src/lib/siteRoutes';
import { HOMEPAGE_NEWS } from '@/src/lib/appealGuidance';

test('site routes resolve the expected page for each public path', () => {
  assert.equal(getTabFromPath('/'), 'home');
  assert.equal(getTabFromPath('/share-your-story'), 'share');
  assert.equal(getTabFromPath('/fight-back'), 'appeal');
  assert.equal(getTabFromPath('/evidence-patterns'), 'insights');
  assert.equal(getTabFromPath('/data-products'), 'b2b');
  assert.equal(getTabFromPath('/about-trust'), 'about');
  assert.equal(getTabFromPath('/about-trust/'), 'about');
  assert.equal(getTabFromPath('/something-else'), 'home');
});

test('homepage news cards keep the structured narrative fields the hero relies on', () => {
  assert.equal(HOMEPAGE_NEWS.length, 3);
  for (const card of HOMEPAGE_NEWS) {
    assert.ok(card.narrative.length > 0);
    assert.ok(card.stat.length > 0);
    assert.ok(card.pullQuote.length > 0);
    assert.ok(card.whatThisMeans.length > 0);
    assert.ok(card.url.length > 0);
  }
});

test('all tabs still have a public path mapping', () => {
  assert.deepEqual(Object.keys(TAB_PATHS).sort(), ['about', 'appeal', 'b2b', 'home', 'insights', 'share']);
});
