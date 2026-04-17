import { buildWarehouseDashboardSnapshot } from '../../src/lib/warehouseInsightsSnapshot.js';
import { enforceRateLimit, sendSafeError } from '../_lib/http.js';
import { fetchPatternsFromNeon } from './patterns.js';

export default async function handler(req: any, res: any) {
  if (!enforceRateLimit(req, res, { key: 'insights-dashboard', limit: 40, windowMs: 60_000 })) {
    return;
  }

  try {
    const patterns = await fetchPatternsFromNeon();
    const snapshot = buildWarehouseDashboardSnapshot(patterns);
    res.status(200).json({
      status: 'success',
      snapshot,
    });
  } catch (error) {
    sendSafeError(res, 500, 'We could not load the dashboard snapshot right now.', error, 'insights-dashboard');
  }
}
