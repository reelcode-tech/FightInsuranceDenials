import { fetchAiStatusFromEnv } from '../_lib/neonAnalytics';

export default async function handler(_req: any, res: any) {
  try {
    const payload = await fetchAiStatusFromEnv();
    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
