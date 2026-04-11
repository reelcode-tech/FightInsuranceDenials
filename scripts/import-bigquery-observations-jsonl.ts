import fs from 'fs';
import path from 'path';
import { getBigQueryAccessToken } from './_bigqueryClient';

const DATASET_ID = process.env.BIGQUERY_DATASET_ID || 'fight_insurance_denials';
const TABLE_ID = process.env.BIGQUERY_RAW_TABLE_ID || 'raw_web_observations';

type Observation = {
  observation_id: string;
  canonical_url?: string;
  source_type?: string;
  source_label?: string;
  source_weight?: string;
  title?: string;
  raw_text?: string;
  story_excerpt?: string;
  insurer_raw?: string;
  insurer_normalized?: string;
  procedure_raw?: string;
  procedure_normalized?: string;
  denial_reason_raw?: string;
  denial_category?: string;
  state?: string;
  plan_type?: string;
  erisa_status?: string;
  appeal_outcome?: string;
  quality_score?: number;
  is_low_signal?: boolean;
  fingerprint?: string;
  ingested_at?: string;
  source_published_at?: string;
};

function toRows(records: Observation[]) {
  return records.map((record) => ({
    insertId: record.observation_id,
    json: {
      ...record,
      ingested_at: record.ingested_at || new Date().toISOString(),
    },
  }));
}

async function insertRows(rows: ReturnType<typeof toRows>) {
  const { projectId, accessToken } = await getBigQueryAccessToken();
  const response = await fetch(
    `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets/${DATASET_ID}/tables/${TABLE_ID}/insertAll`,
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
    throw new Error(`BigQuery insert failed: ${response.status} ${text}`);
  }

  return text ? JSON.parse(text) : {};
}

async function main() {
  const input = process.argv[2];
  if (!input) {
    throw new Error('Provide a JSONL file path, for example: data/raw/aarp-observations.jsonl');
  }

  const fullPath = path.isAbsolute(input) ? input : path.join(process.cwd(), input);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Input file not found: ${fullPath}`);
  }

  const lines = fs
    .readFileSync(fullPath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const records = lines.map((line, index) => {
    try {
      return JSON.parse(line) as Observation;
    } catch (error) {
      throw new Error(`Invalid JSON on line ${index + 1}: ${error}`);
    }
  });

  const batchSize = 500;
  let inserted = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    await insertRows(toRows(batch));
    inserted += batch.length;
  }

  console.log(JSON.stringify({ inserted, table: TABLE_ID }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
