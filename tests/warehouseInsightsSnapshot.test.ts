import assert from 'node:assert/strict';
import test from 'node:test';
import {
  WAREHOUSE_INSIGHT_CARDS,
  WAREHOUSE_QUESTION_CARDS,
  WAREHOUSE_SNAPSHOT_META,
} from '../src/lib/warehouseInsightsSnapshot';

test('warehouse snapshot exposes a usable row count and multiple insight cards', () => {
  assert.match(WAREHOUSE_SNAPSHOT_META.usableRows, /^\d[\d,]*$/);
  assert.ok(WAREHOUSE_INSIGHT_CARDS.length >= 3);
});

test('warehouse evidence cards stay concrete and count-backed', () => {
  for (const card of WAREHOUSE_INSIGHT_CARDS) {
    assert.ok(card.title.length > 20);
    assert.match(card.countValue, /^\d[\d,]*$/);
    assert.ok(!card.body.toLowerCase().includes('cleaned slice'));
  }
});

test('BigQuery question cards stay user-facing', () => {
  for (const card of WAREHOUSE_QUESTION_CARDS) {
    assert.ok(card.question.includes('?'));
    assert.ok(card.answer.length > 40);
    assert.ok(card.evidence.length > 10);
  }
});
