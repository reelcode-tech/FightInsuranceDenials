import { fetchObservatorySummaryFromNeon } from '../_lib/neonAnalytics';

export default async function handler(_req: any, res: any) {
  try {
    const payload = await fetchObservatorySummaryFromNeon();
    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
