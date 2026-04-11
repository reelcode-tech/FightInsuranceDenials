import dotenv from 'dotenv';
import { withNeonClient } from './_neonClient';

dotenv.config();

async function main() {
  await withNeonClient(async (client) => {
    const tables = ['source_records', 'raw_web_observations', 'curated_stories', 'benchmark_snapshots', 'insurer_daily_metrics', 'app_users', 'user_cases', 'appeals'];
    const counts: Record<string, number> = {};

    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*)::int AS count FROM ${table}`);
      counts[table] = result.rows[0].count;
    }

    console.log(JSON.stringify(counts, null, 2));
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
