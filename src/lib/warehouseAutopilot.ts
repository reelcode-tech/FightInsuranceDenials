import { PUBLIC_SOURCE_CATALOG } from './publicSourceCatalog';
import { TRUSTED_OBSERVATION_PACK } from './trustedObservationPack';
import { WAREHOUSE_SEED_OBSERVATIONS } from './warehouseSeedData';
import { getBigQueryAccessToken, runBigQuerySql } from '../../scripts/_bigqueryClient';
import { withNeonClient } from '../../scripts/_neonClient';
import { backfillHistoricalRedditToBigQuery, ingestRedditToBigQuery } from './redditWarehouseIngestion';

const DATASET_ID = process.env.BIGQUERY_DATASET_ID || 'fight_insurance_denials';

function clampText(value: unknown, maxLength: number) {
  if (value === null || value === undefined) return null;
  const text = String(value);
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

async function insertAll(tableId: string, rows: Array<{ insertId: string; json: Record<string, unknown> }>) {
  const { projectId, accessToken } = await getBigQueryAccessToken();
  const response = await fetch(
    `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets/${DATASET_ID}/tables/${tableId}/insertAll`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        kind: 'bigquery#tableDataInsertAllRequest',
        skipInvalidRows: false,
        ignoreUnknownValues: false,
        rows,
      }),
    }
  );

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`BigQuery insertAll failed for ${tableId}: ${response.status} ${text}`);
  }
  return text ? JSON.parse(text) : {};
}

export async function seedBigQuerySourceCatalog() {
  const rows = PUBLIC_SOURCE_CATALOG.map((entry) => ({
    insertId: entry.id,
    json: {
      source_record_id: entry.id,
      source_type: entry.weight,
      canonical_url: entry.exampleUrls[0] || null,
      title: entry.name,
      raw_text: `${entry.priority}: ${entry.notes}`,
      created_at: new Date().toISOString(),
    },
  }));

  await insertAll('source_records', rows);
  return rows.length;
}

export async function seedBigQueryWarehouseObservations() {
  const rows = WAREHOUSE_SEED_OBSERVATIONS.map((observation) => ({
    insertId: observation.observation_id,
    json: {
      ...observation,
      ingested_at: new Date().toISOString(),
    },
  }));

  await insertAll('raw_web_observations', rows);
  return rows.length;
}

export async function upsertTrustedObservationPackToNeon() {
  return withNeonClient(async (client) => {
    let upserted = 0;

    for (const row of TRUSTED_OBSERVATION_PACK) {
      await client.query(
        `
        INSERT INTO raw_web_observations (
          observation_id, canonical_url, source_type, source_label, source_weight, title, raw_text, story_excerpt,
          insurer_raw, insurer_normalized, procedure_raw, procedure_normalized, denial_reason_raw, denial_category,
          state, plan_type, erisa_status, appeal_outcome, quality_score, is_low_signal, fingerprint, ingested_at, source_published_at
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NULL,$15,$16,NULL,$17,$18,$19,NOW(),NOW()
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
          plan_type = EXCLUDED.plan_type,
          erisa_status = EXCLUDED.erisa_status,
          quality_score = EXCLUDED.quality_score,
          is_low_signal = EXCLUDED.is_low_signal,
          fingerprint = EXCLUDED.fingerprint,
          ingested_at = NOW()
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
          row.plan_type,
          row.erisa_status,
          row.quality_score,
          row.is_low_signal,
          row.fingerprint,
        ]
      );
      upserted += 1;
    }

    return upserted;
  });
}

export async function syncBigQuerySourceRecordsToNeon() {
  const { projectId } = await getBigQueryAccessToken();
  const { rows } = await runBigQuerySql(`
    SELECT source_record_id, source_type, canonical_url, title, raw_text, created_at
    FROM \`${projectId}.${DATASET_ID}.source_records\`
  `);

  await withNeonClient(async (client) => {
    for (const row of rows) {
      await client.query(
        `
        INSERT INTO source_records (
          source_record_id, source_type, canonical_url, title, raw_text, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, COALESCE($6::timestamptz, NOW()), NOW())
        ON CONFLICT (source_record_id) DO UPDATE SET
          source_type = EXCLUDED.source_type,
          canonical_url = EXCLUDED.canonical_url,
          title = EXCLUDED.title,
          raw_text = EXCLUDED.raw_text,
          updated_at = NOW()
        `,
        [row.source_record_id, row.source_type, row.canonical_url, row.title, row.raw_text, row.created_at]
      );
    }
  });

  return rows.length;
}

export async function syncBigQueryRawObservationsToNeon(limit = 5000) {
  const { projectId } = await getBigQueryAccessToken();
  const { rows } = await runBigQuerySql(`
    SELECT
      observation_id, canonical_url, source_type, source_label, source_weight, title, raw_text, story_excerpt,
      insurer_raw, insurer_normalized, procedure_raw, procedure_normalized, denial_reason_raw, denial_category,
      state, plan_type, erisa_status, appeal_outcome, quality_score, is_low_signal, fingerprint, ingested_at, source_published_at
    FROM \`${projectId}.${DATASET_ID}.raw_web_observations\`
    ORDER BY ingested_at DESC
    LIMIT ${limit}
  `);

  await withNeonClient(async (client) => {
    for (const row of rows) {
      await client.query(
        `
        INSERT INTO raw_web_observations (
          observation_id, canonical_url, source_type, source_label, source_weight, title, raw_text, story_excerpt,
          insurer_raw, insurer_normalized, procedure_raw, procedure_normalized, denial_reason_raw, denial_category,
          state, plan_type, erisa_status, appeal_outcome, quality_score, is_low_signal, fingerprint, ingested_at, source_published_at
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,COALESCE($19,0),COALESCE($20,FALSE),$21,COALESCE($22::timestamptz,NOW()),$23::timestamptz
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
          clampText(row.canonical_url, 1000),
          clampText(row.source_type, 80),
          clampText(row.source_label, 255),
          clampText(row.source_weight, 80),
          clampText(row.title, 500),
          clampText(row.raw_text, 5000),
          clampText(row.story_excerpt, 1200),
          clampText(row.insurer_raw, 120),
          clampText(row.insurer_normalized, 120),
          clampText(row.procedure_raw, 255),
          clampText(row.procedure_normalized, 255),
          clampText(row.denial_reason_raw, 800),
          clampText(row.denial_category, 80),
          clampText(row.state, 8),
          clampText(row.plan_type, 80),
          clampText(row.erisa_status, 40),
          clampText(row.appeal_outcome, 40),
          row.quality_score,
          row.is_low_signal,
          clampText(row.fingerprint, 120),
          row.ingested_at,
          row.source_published_at
        ]
      );
    }
  });

  return rows.length;
}

export async function fetchWarehouseSummary() {
  const { projectId } = await getBigQueryAccessToken();
  const summarySql = `
    SELECT
      (SELECT COUNT(*) FROM \`${projectId}.${DATASET_ID}.raw_web_observations\`) AS raw_observation_count,
      (SELECT COUNT(*) FROM \`${projectId}.${DATASET_ID}.source_records\`) AS source_record_count,
      (SELECT COUNT(*) FROM \`${projectId}.${DATASET_ID}.curated_stories\`) AS curated_story_count
  `;
  const { rows } = await runBigQuerySql(summarySql);
  const warehouse = rows[0] || { raw_observation_count: 0, source_record_count: 0, curated_story_count: 0 };

  const neon = await withNeonClient(async (client) => {
    const result = await client.query(`
      SELECT
        (SELECT COUNT(*)::int FROM source_records) AS source_records,
        (SELECT COUNT(*)::int FROM raw_web_observations) AS raw_web_observations,
        (SELECT COUNT(*)::int FROM curated_stories) AS curated_stories
    `);
    return result.rows[0];
  });

  return {
    warehouse,
    neon,
    totalVisibleCount:
      Number(warehouse.curated_story_count || 0) ||
      Number(neon.curated_stories || 0) ||
      Number(warehouse.raw_observation_count || 0) ||
      Number(neon.raw_web_observations || 0),
  };
}

export async function promoteNeonObservationsToCurated(minQuality = 75) {
  return withNeonClient(async (client) => {
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
        AND (
          COALESCE(denial_category, '') NOT IN ('', 'Unknown')
          OR COALESCE(procedure_normalized, '') NOT IN ('', 'Insurance denial evidence')
          OR COALESCE(denial_reason_raw, '') ~* '(prior auth|prior authorization|denied|appeal|not medically necessary|out of network|step therapy|coverage denied|claim denied|not covered)'
        )
        AND COALESCE(raw_text, '') !~* '(turn 26|which plan|what plan|late enrollment|open enrollment|marketplace quote|shopping for|recommendations for)'
      ORDER BY quality_score DESC, ingested_at DESC
      `,
      [minQuality]
    );

    let promoted = 0;
    for (const row of sourceRows.rows) {
      await client.query(
        `
        INSERT INTO curated_stories (
          story_id, observation_id, consent_level, is_anonymized, status, source_type, source_label, source_url,
          extracted_insurer, plan_type, state, erisa_status, denial_category, procedure_condition,
          denial_reason_raw, denial_reason_normalized, patient_narrative_summary, why_unfair_patient_quote,
          quality_score, submission_timestamp, metadata
        )
        VALUES (
          'curated_' || $1, $1, 'public_story', TRUE, 'published', $2, $3, $4,
          $5, $6, $7, $8, COALESCE($9, 'Unknown'), COALESCE($10, 'Insurance denial evidence'),
          COALESCE($11, 'Coverage friction, denial patterns, or appeal support evidence'),
          COALESCE($11, 'Coverage friction, denial patterns, or appeal support evidence'),
          LEFT(COALESCE($12, $13, 'Public source observation relevant to insurance denial analysis.'), 600),
          LEFT(COALESCE($13, $12, 'Public source observation relevant to insurance denial analysis.'), 1200),
          COALESCE($14, 0), NOW(), jsonb_build_object('promoted_from', 'raw_web_observations')
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
          row.insurer_normalized || 'Multiple insurers',
          row.plan_type || 'Unknown',
          row.state,
          row.erisa_status || 'Unknown',
          row.denial_category,
          row.procedure_normalized,
          row.denial_reason_raw,
          row.story_excerpt,
          row.raw_text,
          row.quality_score,
        ]
      );
      promoted++;
    }

    return promoted;
  });
}

export async function runWarehouseAutopilotPass() {
  const seededSources = 0;
  const seededObservations = 0;
  const trustedPackUpserted = await upsertTrustedObservationPackToNeon();
  const redditIngestion = await ingestRedditToBigQuery();
  const syncedSources = await syncBigQuerySourceRecordsToNeon();
  const syncedObservations = await syncBigQueryRawObservationsToNeon();
  const promotedCuratedStories = await promoteNeonObservationsToCurated();
  const summary = await fetchWarehouseSummary();

  return {
    seededSources,
    seededObservations,
    trustedPackUpserted,
    redditIngestion,
    syncedSources,
    syncedObservations,
    promotedCuratedStories,
    summary,
  };
}

export async function runWarehouseDeepBackfillPass() {
  const trustedPackUpserted = await upsertTrustedObservationPackToNeon();
  const redditBackfill = await backfillHistoricalRedditToBigQuery({
    pagesPerSubreddit: 5,
    pageSize: 80,
  });
  const syncedSources = await syncBigQuerySourceRecordsToNeon();
  const syncedObservations = await syncBigQueryRawObservationsToNeon();
  const promotedCuratedStories = await promoteNeonObservationsToCurated(70);
  const summary = await fetchWarehouseSummary();

  return {
    trustedPackUpserted,
    redditBackfill,
    syncedSources,
    syncedObservations,
    promotedCuratedStories,
    summary,
  };
}
