import fs from 'fs';
import { GoogleAuth } from 'google-auth-library';

const defaultBigQueryServiceAccount = 'C:/Users/sashi/.codex/secrets/fight-insurance-denials-gcp.json';

function getBigQueryCredentials() {
  const keyPath = process.env.BIGQUERY_SERVICE_ACCOUNT_PATH || defaultBigQueryServiceAccount;
  if (!fs.existsSync(keyPath)) {
    throw new Error(`BigQuery service account key not found at ${keyPath}`);
  }

  const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  return { credentials, keyPath };
}

async function getBigQueryAccessToken() {
  const { credentials } = getBigQueryCredentials();
  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/bigquery'],
  });

  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return {
    projectId: credentials.project_id as string,
    accessToken: (token.token || token) as string,
  };
}

function convertBigQueryScalar(value: string | null, type?: string) {
  if (value === null || value === undefined) return null;
  if (!type) return value;

  switch (type) {
    case 'INTEGER':
      return Number(value);
    case 'FLOAT':
    case 'NUMERIC':
    case 'BIGNUMERIC':
      return Number(value);
    case 'BOOLEAN':
      return value === 'true';
    case 'TIMESTAMP': {
      const numeric = Number(value);
      if (!Number.isNaN(numeric)) {
        return new Date(numeric * 1000).toISOString();
      }
      return value;
    }
    default:
      return value;
  }
}

type BigQueryQueryResponse = {
  schema?: {
    fields?: Array<{ name: string; type: string; mode?: string }>;
  };
  rows?: Array<{ f: Array<{ v: string | null }> }>;
};

export async function runBigQuerySql(sql: string) {
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

  const payload = (text ? JSON.parse(text) : {}) as BigQueryQueryResponse;
  const fields = payload.schema?.fields || [];
  const rows = (payload.rows || []).map((row) =>
    Object.fromEntries(
      fields.map((field, index) => [field.name, convertBigQueryScalar(row.f[index]?.v ?? null, field.type)])
    )
  );

  return { projectId, fields, rows, raw: payload };
}
