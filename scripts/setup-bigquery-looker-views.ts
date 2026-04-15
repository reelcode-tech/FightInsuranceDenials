import fs from 'fs';
import path from 'path';
import { getBigQueryAccessToken } from './_bigqueryClient';

const DATASET_ID = process.env.BIGQUERY_DATASET_ID || 'fight_insurance_denials';

const VIEW_FILES = [
  'sql/warehouse/v_patterns_clean.sql',
  'sql/warehouse/v_insurer_category_heatmap.sql',
  'sql/warehouse/v_procedure_clusters.sql',
  'sql/warehouse/v_data_quality_monitor.sql',
  'sql/warehouse/v_source_mix.sql',
  'sql/warehouse/v_state_patterns_clean.sql',
  'sql/warehouse/v_denial_question_mart.sql',
  'sql/warehouse/v_denial_anomaly_watch.sql',
];

async function runSql(sql: string) {
  const { projectId, accessToken } = await getBigQueryAccessToken();
  const response = await fetch(`https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/queries`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: sql,
      useLegacySql: false,
      timeoutMs: 30000,
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`BigQuery query failed: ${response.status} ${text}`);
  }

  return text ? JSON.parse(text) : {};
}

async function main() {
  const { projectId } = await getBigQueryAccessToken();
  const created: string[] = [];

  for (const relativeFile of VIEW_FILES) {
    const fullPath = path.join(process.cwd(), relativeFile);
    const rawSql = fs.readFileSync(fullPath, 'utf8');
    const sql = rawSql
      .replaceAll('{{PROJECT_ID}}', projectId)
      .replaceAll('{{DATASET_ID}}', DATASET_ID);

    await runSql(sql);
    created.push(path.basename(relativeFile, '.sql'));
  }

  console.log(JSON.stringify({ projectId, datasetId: DATASET_ID, created }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

