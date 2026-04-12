import { runWarehouseAutopilotPass } from '../../src/lib/warehouseAutopilot';

export default async function handler(req: any, res: any) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ status: 'error', error: 'Unauthorized' });
    return;
  }

  try {
    const result = await runWarehouseAutopilotPass();
    res.status(200).json({
      status: 'success',
      trustedPackUpserted: result.trustedPackUpserted,
      redditIngestion: result.redditIngestion,
      syncedSources: result.syncedSources,
      syncedObservations: result.syncedObservations,
      promotedCuratedStories: result.promotedCuratedStories,
      summary: result.summary,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
