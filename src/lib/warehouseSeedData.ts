import { PUBLIC_SOURCE_CATALOG } from './publicSourceCatalog';

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

export const WAREHOUSE_SEED_OBSERVATIONS = [
  ...PUBLIC_SOURCE_CATALOG.flatMap((entry, index) =>
    entry.exampleUrls.slice(0, 2).map((url, urlIndex) => ({
      observation_id: `${entry.id}-${index + 1}-${urlIndex + 1}`,
      canonical_url: url,
      source_type: entry.weight,
      source_label: entry.name,
      source_weight: entry.weight,
      title: entry.name,
      raw_text: entry.notes,
      story_excerpt: entry.notes,
      insurer_raw: 'Multiple insurers',
      insurer_normalized: 'Multiple insurers',
      procedure_raw: 'Insurance denial or appeal evidence',
      procedure_normalized: 'Insurance denial evidence',
      denial_reason_raw: 'Coverage friction, denial patterns, or appeal support evidence',
      denial_category: 'Unknown',
      plan_type: 'Unknown',
      erisa_status: 'Unknown',
      quality_score: entry.priority === 'scrape_now' ? 80 : entry.priority === 'manual_review_only' ? 60 : 40,
      is_low_signal: entry.priority === 'do_not_prioritize',
      fingerprint: slugify(`${entry.id}-${url}`),
    }))
  ),
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
  },
];
