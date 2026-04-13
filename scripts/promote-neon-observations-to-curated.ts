import dotenv from 'dotenv';
import { withNeonClient } from './_neonClient';
import {
  inferInsurerFromNarrativeText,
  normalizeDenialReasonText,
  normalizePlanType,
  normalizeProcedureLabel,
} from '../src/lib/normalization';

dotenv.config();

const MIN_QUALITY = Number(process.env.CURATION_MIN_QUALITY || 75);

async function main() {
  await withNeonClient(async (client) => {
    const sourceRows = await client.query(
      `
      SELECT
        observation_id,
        canonical_url,
        source_type,
        source_label,
        insurer_normalized,
        plan_type,
        state,
        erisa_status,
        denial_category,
        procedure_normalized,
        denial_reason_raw,
        story_excerpt,
        raw_text,
        quality_score
      FROM raw_web_observations
      WHERE COALESCE(is_low_signal, FALSE) = FALSE
        AND COALESCE(quality_score, 0) >= $1
      ORDER BY quality_score DESC, ingested_at DESC
      `,
      [MIN_QUALITY]
    );

    let promoted = 0;

    for (const row of sourceRows.rows) {
      const normalizedInsurer = inferInsurerFromNarrativeText(
        row.insurer_normalized || row.denial_reason_raw || row.raw_text,
      );
      const normalizedPlan = normalizePlanType(row.plan_type || row.raw_text);
      const normalizedProcedure = normalizeProcedureLabel(row.procedure_normalized || row.procedure_raw || row.raw_text);
      const normalizedReason = normalizeDenialReasonText(row.denial_reason_raw);

      await client.query(
        `
        INSERT INTO curated_stories (
          story_id,
          observation_id,
          consent_level,
          is_anonymized,
          status,
          source_type,
          source_label,
          source_url,
          extracted_insurer,
          plan_type,
          state,
          erisa_status,
          denial_category,
          procedure_condition,
          denial_reason_raw,
          denial_reason_normalized,
          patient_narrative_summary,
          why_unfair_patient_quote,
          quality_score,
          submission_timestamp,
          metadata
        )
        VALUES (
          'curated_' || $1,
          $1,
          'public_story',
          TRUE,
          'published',
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          COALESCE($9, 'Unknown'),
          COALESCE($10, 'Insurance denial evidence'),
          COALESCE($11, 'Coverage denial'),
          COALESCE($11, 'Coverage denial'),
          COALESCE($12, $13, 'Public source observation relevant to insurance denial analysis.'),
          COALESCE($13, $12, 'Public source observation relevant to insurance denial analysis.'),
          COALESCE($14, 0),
          NOW(),
          jsonb_build_object('promoted_from', 'raw_web_observations', 'normalization_version', 'v2')
        )
        ON CONFLICT (story_id) DO UPDATE SET
          source_type = EXCLUDED.source_type,
          source_label = EXCLUDED.source_label,
          source_url = EXCLUDED.source_url,
          extracted_insurer = EXCLUDED.extracted_insurer,
          plan_type = EXCLUDED.plan_type,
          state = EXCLUDED.state,
          erisa_status = EXCLUDED.erisa_status,
          denial_category = EXCLUDED.denial_category,
          procedure_condition = EXCLUDED.procedure_condition,
          denial_reason_raw = EXCLUDED.denial_reason_raw,
          denial_reason_normalized = EXCLUDED.denial_reason_normalized,
          patient_narrative_summary = EXCLUDED.patient_narrative_summary,
          why_unfair_patient_quote = EXCLUDED.why_unfair_patient_quote,
          quality_score = EXCLUDED.quality_score
        `,
        [
          row.observation_id,
          row.source_type,
          row.source_label,
          row.canonical_url,
          normalizedInsurer || 'Multiple insurers',
          normalizedPlan || 'Unknown',
          row.state,
          row.erisa_status || 'Unknown',
          row.denial_category,
          normalizedProcedure,
          normalizedReason,
          row.story_excerpt,
          row.raw_text,
          row.quality_score,
        ]
      );
      promoted++;
    }

    console.log(JSON.stringify({ promoted, minQuality: MIN_QUALITY }, null, 2));
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
