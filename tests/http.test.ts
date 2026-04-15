import assert from 'node:assert/strict';
import test from 'node:test';
import { enforceRateLimit, methodNotAllowed } from '@/api/_lib/http';

function createResponseDouble() {
  return {
    statusCode: 200,
    body: null as any,
    headers: {} as Record<string, string>,
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
}

test('methodNotAllowed blocks unexpected methods', () => {
  const res = createResponseDouble();
  const allowed = methodNotAllowed({ method: 'GET' }, res, 'POST');

  assert.equal(allowed, false);
  assert.equal(res.statusCode, 405);
});

test('enforceRateLimit blocks repeated requests after the limit', () => {
  const req = { headers: { 'x-forwarded-for': '1.2.3.4' } };

  const first = createResponseDouble();
  const second = createResponseDouble();

  assert.equal(enforceRateLimit(req, first, { key: 'test-limit', limit: 1, windowMs: 60_000 }), true);
  assert.equal(enforceRateLimit(req, second, { key: 'test-limit', limit: 1, windowMs: 60_000 }), false);
  assert.equal(second.statusCode, 429);
});
