import { PUBLIC_SOURCE_CATALOG } from '../src/lib/publicSourceCatalog';
import { getBigQueryAccessToken } from './_bigqueryClient';

const DATASET_ID = process.env.BIGQUERY_DATASET_ID || 'fight_insurance_denials';

async function main() {
  const { projectId, accessToken } = await getBigQueryAccessToken();

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

  const response = await fetch(
    `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets/${DATASET_ID}/tables/source_records/insertAll`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        kind: 'bigquery#tableDataInsertAllRequest',
        ignoreUnknownValues: false,
        skipInvalidRows: false,
        rows,
      }),
    }
  );

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Failed to insert source catalog rows: ${response.status} ${text}`);
  }

  console.log(
    JSON.stringify(
      {
        inserted: rows.length,
        response: text ? JSON.parse(text) : {},
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
