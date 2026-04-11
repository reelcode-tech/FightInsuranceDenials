import { bigQueryRequest, getBigQueryAccessToken } from './_bigqueryClient';

const DATASET_ID = process.env.BIGQUERY_DATASET_ID || 'fight_insurance_denials';

type TableSpec = {
  tableId: string;
  schema: Array<{ name: string; type: string; mode?: 'NULLABLE' | 'REQUIRED' | 'REPEATED' }>;
  timePartitioning?: { type: 'DAY'; field?: string };
  clustering?: { fields: string[] };
  description: string;
};

const TABLES: TableSpec[] = [
  {
    tableId: 'raw_web_observations',
    description: 'Raw observations gathered from public web sources before promotion into curated stories.',
    timePartitioning: { type: 'DAY', field: 'ingested_at' },
    clustering: { fields: ['source_type', 'insurer_normalized', 'denial_category'] },
    schema: [
      { name: 'observation_id', type: 'STRING', mode: 'REQUIRED' },
      { name: 'canonical_url', type: 'STRING' },
      { name: 'source_type', type: 'STRING' },
      { name: 'source_label', type: 'STRING' },
      { name: 'source_weight', type: 'STRING' },
      { name: 'title', type: 'STRING' },
      { name: 'raw_text', type: 'STRING' },
      { name: 'story_excerpt', type: 'STRING' },
      { name: 'insurer_raw', type: 'STRING' },
      { name: 'insurer_normalized', type: 'STRING' },
      { name: 'procedure_raw', type: 'STRING' },
      { name: 'procedure_normalized', type: 'STRING' },
      { name: 'denial_reason_raw', type: 'STRING' },
      { name: 'denial_category', type: 'STRING' },
      { name: 'state', type: 'STRING' },
      { name: 'plan_type', type: 'STRING' },
      { name: 'erisa_status', type: 'STRING' },
      { name: 'appeal_outcome', type: 'STRING' },
      { name: 'quality_score', type: 'INTEGER' },
      { name: 'is_low_signal', type: 'BOOLEAN' },
      { name: 'fingerprint', type: 'STRING' },
      { name: 'ingested_at', type: 'TIMESTAMP' },
      { name: 'source_published_at', type: 'TIMESTAMP' },
    ],
  },
  {
    tableId: 'curated_stories',
    description: 'Curated and normalized public denial stories promoted into product-facing analytics.',
    timePartitioning: { type: 'DAY', field: 'submission_timestamp' },
    clustering: { fields: ['extracted_insurer', 'denial_category', 'source_type'] },
    schema: [
      { name: 'story_id', type: 'STRING', mode: 'REQUIRED' },
      { name: 'source_story_id', type: 'STRING' },
      { name: 'consent_level', type: 'STRING' },
      { name: 'is_anonymized', type: 'BOOLEAN' },
      { name: 'source_type', type: 'STRING' },
      { name: 'source_label', type: 'STRING' },
      { name: 'source_url', type: 'STRING' },
      { name: 'extracted_insurer', type: 'STRING' },
      { name: 'plan_type', type: 'STRING' },
      { name: 'state', type: 'STRING' },
      { name: 'erisa_status', type: 'STRING' },
      { name: 'denial_category', type: 'STRING' },
      { name: 'procedure_condition', type: 'STRING' },
      { name: 'denial_reason_raw', type: 'STRING' },
      { name: 'denial_reason_normalized', type: 'STRING' },
      { name: 'patient_narrative_summary', type: 'STRING' },
      { name: 'why_unfair_patient_quote', type: 'STRING' },
      { name: 'similar_cases_count', type: 'INTEGER' },
      { name: 'overturn_rate', type: 'FLOAT' },
      { name: 'anomaly_detected', type: 'BOOLEAN' },
      { name: 'anomaly_reason', type: 'STRING' },
      { name: 'quality_score', type: 'INTEGER' },
      { name: 'submission_timestamp', type: 'TIMESTAMP' },
      { name: 'date_of_denial', type: 'DATE' },
    ],
  },
  {
    tableId: 'source_records',
    description: 'Catalog of official, investigative, and narrative public sources feeding the observatory.',
    schema: [
      { name: 'source_record_id', type: 'STRING', mode: 'REQUIRED' },
      { name: 'source_type', type: 'STRING' },
      { name: 'canonical_url', type: 'STRING' },
      { name: 'title', type: 'STRING' },
      { name: 'raw_text', type: 'STRING' },
      { name: 'created_at', type: 'TIMESTAMP' },
    ],
  },
  {
    tableId: 'benchmark_snapshots',
    description: 'Materialized benchmark facts used for homepage and action-center guidance.',
    timePartitioning: { type: 'DAY', field: 'snapshot_at' },
    clustering: { fields: ['insurer', 'denial_category', 'procedure_condition'] },
    schema: [
      { name: 'snapshot_id', type: 'STRING', mode: 'REQUIRED' },
      { name: 'insurer', type: 'STRING' },
      { name: 'denial_category', type: 'STRING' },
      { name: 'procedure_condition', type: 'STRING' },
      { name: 'similar_cases_count', type: 'INTEGER' },
      { name: 'appeal_count', type: 'INTEGER' },
      { name: 'overturned_count', type: 'INTEGER' },
      { name: 'overturn_rate', type: 'FLOAT' },
      { name: 'source_mix', type: 'STRING' },
      { name: 'snapshot_at', type: 'TIMESTAMP' },
    ],
  },
  {
    tableId: 'insurer_daily_metrics',
    description: 'Daily rollups for anomaly detection, partner dashboards, and observatory charts.',
    timePartitioning: { type: 'DAY', field: 'metric_date' },
    clustering: { fields: ['insurer', 'denial_category'] },
    schema: [
      { name: 'metric_date', type: 'DATE', mode: 'REQUIRED' },
      { name: 'insurer', type: 'STRING', mode: 'REQUIRED' },
      { name: 'denial_category', type: 'STRING' },
      { name: 'procedure_condition', type: 'STRING' },
      { name: 'story_count', type: 'INTEGER' },
      { name: 'appeal_count', type: 'INTEGER' },
      { name: 'overturned_count', type: 'INTEGER' },
      { name: 'average_quality_score', type: 'FLOAT' },
      { name: 'source_diversity_count', type: 'INTEGER' },
    ],
  },
];

async function ensureDataset() {
  const { projectId } = await getBigQueryAccessToken();
  const existing = await bigQueryRequest(`/datasets/${DATASET_ID}`);
  if (existing.status === 200) {
    return { projectId, created: false };
  }

  if (existing.status !== 404) {
    throw new Error(`Failed to inspect dataset ${DATASET_ID}: ${existing.status} ${existing.text}`);
  }

  const created = await bigQueryRequest('/datasets', {
    method: 'POST',
    body: {
      datasetReference: { projectId, datasetId: DATASET_ID },
      location: 'US',
      description: 'Fight Insurance Denials warehouse for public source ingestion, normalization, and analytics.',
      labels: {
        app: 'fightinsurancedenials',
        purpose: 'analytics',
      },
    },
  });

  if (created.status !== 200) {
    throw new Error(`Failed to create dataset ${DATASET_ID}: ${created.status} ${created.text}`);
  }

  return { projectId, created: true };
}

async function ensureTable(table: TableSpec) {
  const existing = await bigQueryRequest(`/datasets/${DATASET_ID}/tables/${table.tableId}`);
  if (existing.status === 200) {
    return { tableId: table.tableId, created: false };
  }

  if (existing.status !== 404) {
    throw new Error(`Failed to inspect table ${table.tableId}: ${existing.status} ${existing.text}`);
  }

  const created = await bigQueryRequest(`/datasets/${DATASET_ID}/tables`, {
    method: 'POST',
    body: {
      tableReference: {
        datasetId: DATASET_ID,
        tableId: table.tableId,
      },
      description: table.description,
      schema: {
        fields: table.schema,
      },
      ...(table.timePartitioning ? { timePartitioning: table.timePartitioning } : {}),
      ...(table.clustering ? { clustering: table.clustering } : {}),
      labels: {
        app: 'fightinsurancedenials',
      },
    },
  });

  if (created.status !== 200) {
    throw new Error(`Failed to create table ${table.tableId}: ${created.status} ${created.text}`);
  }

  return { tableId: table.tableId, created: true };
}

async function main() {
  const dataset = await ensureDataset();
  const tables = [];
  for (const table of TABLES) {
    tables.push(await ensureTable(table));
  }

  console.log(
    JSON.stringify(
      {
        projectId: dataset.projectId,
        datasetId: DATASET_ID,
        datasetCreated: dataset.created,
        tables,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
