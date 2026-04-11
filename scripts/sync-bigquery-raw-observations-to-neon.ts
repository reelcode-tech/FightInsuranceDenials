import dotenv from 'dotenv';
import { getBigQueryAccessToken, runBigQuerySql } from './_bigqueryClient';
import { withNeonClient } from './_neonClient';

dotenv.config();

const DATASET_ID = process.env.BIGQUERY_DATASET_ID || 'fight_insurance_denials';

async function main() {
  const { projectId } = await getBigQueryAccessToken();
  const limit = Number(process.env.NEON_SYNC_LIMIT || 1000);

  const { rows } = await runBigQuerySql(`
    SELECT
      observation_id,
      canonical_url,
      source_type,
      source_label,
      source_weight,
      title,
      raw_text,
      story_excerpt,
      insurer_raw,
      insurer_normalized,
      procedure_raw,
      procedure_normalized,
      denial_reason_raw,
      denial_category,
      state,
      plan_type,
      erisa_status,
      appeal_outcome,
      quality_score,
      is_low_signal,
      fingerprint,
      ingested_at,
      source_published_at
    FROM \`${projectId}.${DATASET_ID}.raw_web_observations\`
    ORDER BY ingested_at DESC
    LIMIT ${limit}
  `);

  let synced = 0;

  await withNeonClient(async (client) => {
    for (const row of rows) {
      await client.query(
        `
        INSERT INTO raw_web_observations (
          observation_id,
          canonical_url,
          source_type,
          source_label,
          source_weight,
          title,
          raw_text,
          story_excerpt,
          insurer_raw,
          insurer_normalized,
          procedure_raw,
          procedure_normalized,
          denial_reason_raw,
          denial_category,
          state,
          plan_type,
          erisa_status,
          appeal_outcome,
          quality_score,
          is_low_signal,
          fingerprint,
          ingested_at,
          source_published_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, COALESCE($19, 0), COALESCE($20, FALSE), $21, COALESCE($22::timestamptz, NOW()), $23::timestamptz
        )
        ON CONFLICT (observation_id) DO UPDATE SET
          canonical_url = EXCLUDED.canonical_url,
          source_type = EXCLUDED.source_type,
          source_label = EXCLUDED.source_label,
          source_weight = EXCLUDED.source_weight,
          title = EXCLUDED.title,
          raw_text = EXCLUDED.raw_text,
          story_excerpt = EXCLUDED.story_excerpt,
          insurer_raw = EXCLUDED.insurer_raw,
          insurer_normalized = EXCLUDED.insurer_normalized,
          procedure_raw = EXCLUDED.procedure_raw,
          procedure_normalized = EXCLUDED.procedure_normalized,
          denial_reason_raw = EXCLUDED.denial_reason_raw,
          denial_category = EXCLUDED.denial_category,
          state = EXCLUDED.state,
          plan_type = EXCLUDED.plan_type,
          erisa_status = EXCLUDED.erisa_status,
          appeal_outcome = EXCLUDED.appeal_outcome,
          quality_score = EXCLUDED.quality_score,
          is_low_signal = EXCLUDED.is_low_signal,
          fingerprint = EXCLUDED.fingerprint,
          ingested_at = EXCLUDED.ingested_at,
          source_published_at = EXCLUDED.source_published_at
        `,
        [
          row.observation_id,
          row.canonical_url,
          row.source_type,
          row.source_label,
          row.source_weight,
          row.title,
          row.raw_text,
          row.story_excerpt,
          row.insurer_raw,
          row.insurer_normalized,
          row.procedure_raw,
          row.procedure_normalized,
          row.denial_reason_raw,
          row.denial_category,
          row.state,
          row.plan_type,
          row.erisa_status,
          row.appeal_outcome,
          row.quality_score,
          row.is_low_signal,
          row.fingerprint,
          row.ingested_at,
          row.source_published_at,
        ]
      );
      synced++;
    }
  });

  console.log(JSON.stringify({ projectId, synced, limit }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
