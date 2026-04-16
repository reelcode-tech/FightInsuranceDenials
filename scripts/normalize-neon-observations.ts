import dotenv from 'dotenv';
import { withNeonClient } from './_neonClient';
import {
  inferDenialCategory,
  inferInsurerFromNarrativeText,
  normalizeDenialReasonText,
  normalizePlanType,
  normalizeProcedureLabel,
} from '../src/lib/normalization';

dotenv.config();

const BATCH_SIZE = Number(process.env.NEON_NORMALIZE_BATCH_SIZE || 100);

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function main() {
  const rawRows = await withNeonClient(async (client) =>
    client.query(`
      SELECT
        observation_id,
        title,
        raw_text,
        story_excerpt,
        insurer_raw,
        insurer_normalized,
        procedure_raw,
        procedure_normalized,
        denial_reason_raw,
        denial_category,
        plan_type,
        erisa_status
      FROM raw_web_observations
    `),
  );

  const curatedRows = await withNeonClient(async (client) =>
    client.query(`
      SELECT
        story_id,
        extracted_insurer,
        plan_type,
        denial_category,
        procedure_condition,
        denial_reason_raw,
        patient_narrative_summary,
        why_unfair_patient_quote
      FROM curated_stories
    `),
  );

  let rawUpdated = 0;
  for (const rows of chunkArray(rawRows.rows, BATCH_SIZE)) {
    await withNeonClient(async (client) => {
      for (const row of rows) {
        const haystack = [
          row.title,
          row.raw_text,
          row.story_excerpt,
          row.insurer_raw,
          row.insurer_normalized,
          row.procedure_raw,
          row.procedure_normalized,
          row.denial_reason_raw,
          row.plan_type,
        ]
          .filter(Boolean)
          .join(' ');

        const insurer = inferInsurerFromNarrativeText(row.insurer_raw || row.insurer_normalized || haystack);
        const planType = normalizePlanType(row.plan_type || haystack);
        const procedure = normalizeProcedureLabel(row.procedure_raw || row.procedure_normalized || haystack);
        const denialReasonNormalized = normalizeDenialReasonText(row.denial_reason_raw || haystack);
        const denialCategory = inferDenialCategory({
          denialReason: row.denial_reason_raw || denialReasonNormalized,
          procedure,
          summary: row.title,
          narrative: row.raw_text,
        });

        await client.query(
          `
          UPDATE raw_web_observations
          SET
            insurer_normalized = $2,
            procedure_normalized = $3,
            denial_category = $4,
            plan_type = $5,
            metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
              'denial_reason_normalized', $6::text,
              'normalization_version', 'v2'
            )
          WHERE observation_id = $1
          `,
          [row.observation_id, insurer, procedure, denialCategory, planType, denialReasonNormalized],
        );
        rawUpdated += 1;
      }
    });
  }

  let curatedUpdated = 0;
  for (const rows of chunkArray(curatedRows.rows, BATCH_SIZE)) {
    await withNeonClient(async (client) => {
      for (const row of rows) {
        const haystack = [
          row.extracted_insurer,
          row.plan_type,
          row.denial_category,
          row.procedure_condition,
          row.denial_reason_raw,
          row.patient_narrative_summary,
          row.why_unfair_patient_quote,
        ]
          .filter(Boolean)
          .join(' ');

        const insurer = inferInsurerFromNarrativeText(row.extracted_insurer || haystack);
        const planType = normalizePlanType(row.plan_type || haystack);
        const procedure = normalizeProcedureLabel(row.procedure_condition || haystack);
        const denialReasonNormalized = normalizeDenialReasonText(row.denial_reason_raw || haystack);
        const denialCategory = inferDenialCategory({
          denialReason: row.denial_reason_raw || denialReasonNormalized,
          procedure,
          summary: row.patient_narrative_summary,
          narrative: row.why_unfair_patient_quote,
        });

        await client.query(
          `
          UPDATE curated_stories
          SET
            extracted_insurer = $2,
            plan_type = $3,
            denial_category = $4,
            procedure_condition = $5,
            denial_reason_normalized = $6,
            metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('normalization_version', 'v2')
          WHERE story_id = $1
          `,
          [row.story_id, insurer, planType, denialCategory, procedure, denialReasonNormalized],
        );
        curatedUpdated += 1;
      }
    });
  }

  console.log(JSON.stringify({ rawUpdated, curatedUpdated, batchSize: BATCH_SIZE }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
