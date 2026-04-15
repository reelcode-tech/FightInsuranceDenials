type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateBucket = {
  count: number;
  resetAt: number;
};

const globalStore = globalThis as typeof globalThis & {
  __fidRateLimitStore?: Map<string, RateBucket>;
};

function getStore() {
  if (!globalStore.__fidRateLimitStore) {
    globalStore.__fidRateLimitStore = new Map<string, RateBucket>();
  }

  return globalStore.__fidRateLimitStore;
}

function getClientIp(req: any) {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }

  return req.socket?.remoteAddress || req.ip || 'unknown';
}

export function enforceRateLimit(req: any, res: any, options: RateLimitOptions) {
  const store = getStore();
  const now = Date.now();
  const ip = getClientIp(req);
  const key = `${options.key}:${ip}`;
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return true;
  }

  if (current.count >= options.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    res.setHeader('Retry-After', String(retryAfterSeconds));
    res.status(429).json({
      status: 'error',
      error: 'Too many requests. Please pause for a moment and try again.',
    });
    return false;
  }

  current.count += 1;
  store.set(key, current);
  return true;
}

export function methodNotAllowed(req: any, res: any, allowedMethod: string) {
  if (req.method === allowedMethod) return true;
  res.setHeader('Allow', allowedMethod);
  res.status(405).json({ status: 'error', error: 'Method not allowed' });
  return false;
}

export function sendSafeError(res: any, statusCode: number, publicMessage: string, error: unknown, context: string) {
  console.error(`[API:${context}]`, error);
  res.status(statusCode).json({
    status: 'error',
    error: publicMessage,
  });
}
