import { getBigQueryAccessToken } from './_bigqueryClient';

const DATASET_ID = process.env.BIGQUERY_DATASET_ID || 'fight_insurance_denials';
const TABLE_ID = 'raw_web_observations';

const observations = [
  {
    observation_id: 'als-assoc-insurance-benefits-guide',
    canonical_url: 'https://www.als.org/order-portal/resource-guide/understanding-insurance-and-benefits-when-you-have-als',
    source_type: 'official_regulatory',
    source_label: 'The ALS Association',
    source_weight: 'official_regulatory',
    title: 'Understanding insurance and benefits when you have ALS',
    raw_text: 'Official ALS Association resource explaining private insurance, Medicare, Medicaid, disability, and benefits navigation for people with ALS and caregivers.',
    story_excerpt: 'High-cost progressive disease context where patients often face coverage barriers for durable medical equipment, home care, respiratory support, and specialty treatment needs.',
    insurer_raw: 'Multiple insurers',
    insurer_normalized: 'Multiple insurers',
    procedure_raw: 'ALS care, DME, respiratory and home support coverage',
    procedure_normalized: 'ALS care and durable medical equipment',
    denial_reason_raw: 'Coverage barriers, benefit limitations, and appeal support needs',
    denial_category: 'Coverage Exclusion',
    plan_type: 'Unknown',
    erisa_status: 'Unknown',
    quality_score: 88,
    is_low_signal: false,
    fingerprint: 'als-benefits-guide',
    ingested_at: new Date().toISOString(),
  },
  {
    observation_id: 'als-assoc-legal-assistance',
    canonical_url: 'https://www.als.org/support/als-insurance-navigator/legal-assistance',
    source_type: 'official_regulatory',
    source_label: 'The ALS Association',
    source_weight: 'official_regulatory',
    title: 'ALS insurance navigator legal assistance',
    raw_text: 'Official ALS Association support resource pointing patients and caregivers toward legal assistance and payer-navigation help when coverage problems arise.',
    story_excerpt: 'Relevant to escalated appeal workflows and support resources for patients facing repeated coverage friction.',
    insurer_raw: 'Multiple insurers',
    insurer_normalized: 'Multiple insurers',
    procedure_raw: 'ALS insurance appeals and coverage disputes',
    procedure_normalized: 'ALS insurance appeals',
    denial_reason_raw: 'Coverage disputes requiring escalation or legal support',
    denial_category: 'Administrative',
    plan_type: 'Unknown',
    erisa_status: 'Unknown',
    quality_score: 84,
    is_low_signal: false,
    fingerprint: 'als-legal-assistance',
    ingested_at: new Date().toISOString(),
  },
  {
    observation_id: 'alz-insurance-overview',
    canonical_url: 'https://www.alz.org/Help-Support/Caregiving/Financial-Legal-Planning/Insurance',
    source_type: 'official_regulatory',
    source_label: "Alzheimer's Association",
    source_weight: 'official_regulatory',
    title: 'Insurance and care coverage for dementia',
    raw_text: 'Official Alzheimer’s Association resource explaining Medicare, Medicaid, long-term care insurance, and private coverage considerations for dementia care.',
    story_excerpt: 'Useful benchmark context for dementia-related coverage needs, long-term care, home health, and caregiver financial strain.',
    insurer_raw: 'Multiple insurers',
    insurer_normalized: 'Multiple insurers',
    procedure_raw: 'Dementia care coverage and long-term support',
    procedure_normalized: 'Dementia care and long-term support',
    denial_reason_raw: 'Coverage limitations for long-term and dementia-related care',
    denial_category: 'Coverage Exclusion',
    plan_type: 'Unknown',
    erisa_status: 'Unknown',
    quality_score: 87,
    is_low_signal: false,
    fingerprint: 'alz-insurance-overview',
    ingested_at: new Date().toISOString(),
  },
  {
    observation_id: 'alz-guide-medicare-dementia-care',
    canonical_url: 'https://www.alz.org/help-support/caregiving/financial-legal-planning/medicare-guide-program-for-dementia-care',
    source_type: 'official_regulatory',
    source_label: "Alzheimer's Association",
    source_weight: 'official_regulatory',
    title: 'Medicare GUIDE program for dementia care',
    raw_text: 'Official Alzheimer’s Association guidance describing Medicare’s GUIDE program and structured dementia care support, relevant to access and coverage expectations.',
    story_excerpt: 'Important benchmark source for what dementia care support should look like under Medicare-aligned pathways.',
    insurer_raw: 'Medicare',
    insurer_normalized: 'Medicare',
    procedure_raw: 'Dementia care management and caregiver support',
    procedure_normalized: 'Dementia care management',
    denial_reason_raw: 'Access barriers or inadequate coverage for dementia care support',
    denial_category: 'Coverage Exclusion',
    plan_type: 'Medicare Advantage',
    erisa_status: 'Non-ERISA',
    quality_score: 85,
    is_low_signal: false,
    fingerprint: 'alz-guide-program',
    ingested_at: new Date().toISOString(),
  },
];

async function main() {
  const { projectId, accessToken } = await getBigQueryAccessToken();
  const rows = observations.map((observation) => ({
    insertId: observation.observation_id,
    json: observation,
  }));

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
    throw new Error(`Failed to insert neurodegenerative observations: ${response.status} ${text}`);
  }

  console.log(JSON.stringify({ inserted: observations.length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
