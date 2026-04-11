import dotenv from 'dotenv';
import { getBigQueryAccessToken, runBigQuerySql } from './_bigqueryClient';
import { withNeonClient } from './_neonClient';

dotenv.config();

const DATASET_ID = process.env.BIGQUERY_DATASET_ID || 'fight_insurance_denials';

async function main() {
  const { projectId } = await getBigQueryAccessToken();
  const { rows } = await runBigQuerySql(`
    SELECT
      source_record_id,
      source_type,
      canonical_url,
      title,
      raw_text,
      created_at
    FROM \`${projectId}.${DATASET_ID}.source_records\`
  `);

  let synced = 0;

  await withNeonClient(async (client) => {
    for (const row of rows) {
      await client.query(
        `
        INSERT INTO source_records (
          source_record_id,
          source_type,
          canonical_url,
          title,
          raw_text,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, COALESCE($6::timestamptz, NOW()), NOW())
        ON CONFLICT (source_record_id) DO UPDATE SET
          source_type = EXCLUDED.source_type,
          canonical_url = EXCLUDED.canonical_url,
          title = EXCLUDED.title,
          raw_text = EXCLUDED.raw_text,
          updated_at = NOW()
        `,
        [
          row.source_record_id,
          row.source_type,
          row.canonical_url,
          row.title,
          row.raw_text,
          row.created_at,
        ]
      );
      synced++;
    }
  });

  console.log(JSON.stringify({ projectId, synced }, null, 2));
}
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
