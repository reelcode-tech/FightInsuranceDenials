import fs from 'fs';
import path from 'path';
import { getBigQueryAccessToken } from './_bigqueryClient';

const DATASET_ID = process.env.BIGQUERY_DATASET_ID || 'fight_insurance_denials';

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    throw new Error('Provide a SQL file path relative to the repo, for example: sql/warehouse/source_mix.sql');
  }

  const sqlPath = path.isAbsolute(arg) ? arg : path.join(process.cwd(), arg);
  if (!fs.existsSync(sqlPath)) {
    throw new Error(`SQL file not found: ${sqlPath}`);
  }

  const rawSql = fs.readFileSync(sqlPath, 'utf8');
  const { projectId, accessToken } = await getBigQueryAccessToken();
  const query = rawSql
    .replaceAll('{{PROJECT_ID}}', projectId)
    .replaceAll('{{DATASET_ID}}', DATASET_ID);

  const response = await fetch(`https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/queries`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      useLegacySql: false,
      timeoutMs: 30000,
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`BigQuery query failed: ${response.status} ${text}`);
  }

  console.log(text);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
