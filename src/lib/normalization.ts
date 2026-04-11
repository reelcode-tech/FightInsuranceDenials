import type { DenialRecord } from '../types';
import type { DenialCategory, IngestionSourceType, ObservatoryStory } from '../types/domain';

const INSURER_ALIASES: Array<[RegExp, string]> = [
  [/(unitedhealthcare|united healthcare|uhc|optum|optumrx|navihealth)/i, 'UnitedHealthcare'],
  [/(aetna|cvs caremark|caremark)/i, 'Aetna'],
  [/(cigna|evernorth)/i, 'Cigna'],
  [/(blue cross|blue shield|bcbs|anthem|empire|premera|regence|highmark)/i, 'Blue Cross Blue Shield'],
  [/(kaiser)/i, 'Kaiser Permanente'],
  [/(humana)/i, 'Humana'],
  [/(centene|ambetter|wellcare)/i, 'Centene'],
  [/(molina)/i, 'Molina Healthcare'],
];

const LOW_SIGNAL_PATTERNS = [
  /job offer/i,
  /career advice/i,
  /bathroom repair/i,
  /water damage/i,
  /car insurance/i,
  /pet insurance/i,
  /home insurance/i,
  /study abroad/i,
  /turning 26/i,
  /^uninsured/i,
  /lab results still arent in/i,
];

export function normalizeInsurerName(input?: string): string {
  if (!input || input.trim() === '' || input.trim().toLowerCase() === 'unknown') return 'Unknown';
  for (const [pattern, canonical] of INSURER_ALIASES) {
    if (pattern.test(input)) return canonical;
  }
  return input.trim();
}

export function inferDenialCategory(record: Partial<DenialRecord> & Record<string, any>): DenialCategory {
  const haystack = [
    record.denialReason,
    record.reason,
    record.denial_reason_raw,
    record.summary,
    record.narrative,
    record.procedure,
  ]
    .filter(Boolean)
    .join(' ');

  if (/medical necessity|not medically necessary/i.test(haystack)) return 'Medical Necessity';
  if (/experimental|investigational/i.test(haystack)) return 'Experimental';
  if (/out.of.network|out of network/i.test(haystack)) return 'Out of Network';
  if (/prior auth|prior authorization|preauth/i.test(haystack)) return 'Prior Authorization';
  if (/step therapy|fail.first|fail first/i.test(haystack)) return 'Step Therapy';
  if (/duplicate claim/i.test(haystack)) return 'Duplicate Claim';
  if (/eligib/i.test(haystack)) return 'Eligibility';
  if (/billing|coding|administrative|paperwork/i.test(haystack)) return 'Administrative';
  if (/coverage exclusion|excluded|not covered/i.test(haystack)) return 'Coverage Exclusion';
  return 'Unknown';
}

export function inferSourceType(source?: string): IngestionSourceType {
  if (!source) return 'other_public_web';
  if (/^r\//i.test(source)) return 'reddit';
  if (/propublica/i.test(source)) return 'propublica';
  if (/cms/i.test(source)) return 'cms_mrf';
  if (/x community/i.test(source)) return 'x';
  if (/facebook/i.test(source)) return 'facebook';
  if (/user submission/i.test(source)) return 'user_upload';
  return 'other_public_web';
}

export function isLowSignalRecord(record: Partial<DenialRecord> & Record<string, any>): boolean {
  const haystack = [
    record.summary,
    record.narrative,
    record.procedure,
    record.denialReason,
    record.reason,
  ]
    .filter(Boolean)
    .join(' ');

  return LOW_SIGNAL_PATTERNS.some((pattern) => pattern.test(haystack));
}

export function computeQualityScore(record: Partial<DenialRecord> & Record<string, any>): number {
  let score = 0;
  const reason = record.denialReason || record.reason;

  if (record.insurer && record.insurer !== 'Unknown') score += 20;
  if (record.procedure && record.procedure !== 'Unknown') score += 20;
  if (reason && reason !== 'Unknown') score += 20;
  if (record.summary) score += 10;
  if (record.url) score += 5;
  if (record.source) score += 5;
  if (record.isERISA) score += 5;
  if (record.medicalNecessityFlag !== undefined) score += 5;
  if (record.narrative && String(record.narrative).length > 200) score += 10;

  if (isLowSignalRecord(record)) score -= 50;
  return Math.max(0, Math.min(100, score));
}

export function normalizeLegacyDenial(record: Partial<DenialRecord> & Record<string, any>) {
  const normalizedInsurer = normalizeInsurerName(record.insurer);
  const normalizedReason = (record.denialReason || record.reason || 'Unknown').trim();
  const normalizedProcedure = (record.procedure || 'Unknown').trim();
  const denialCategory = inferDenialCategory(record);
  const sourceType = inferSourceType(record.source);
  const qualityScore = computeQualityScore(record);

  return {
    ...record,
    insurer: normalizedInsurer,
    denialReason: normalizedReason,
    procedure: normalizedProcedure,
    denial_category: denialCategory,
    source_type: sourceType,
    quality_score: qualityScore,
    is_low_signal: isLowSignalRecord(record),
  };
}

export function normalizedRecordToStoryPatch(record: ReturnType<typeof normalizeLegacyDenial>): Partial<ObservatoryStory> {
  const erisaStatus =
    record.isERISA === 'ERISA' || record.isERISA === 'Non-ERISA' || record.isERISA === 'Unknown'
      ? record.isERISA
      : 'Unknown';

  return {
    coverage: {
      extracted_insurer: record.insurer || 'Unknown',
      extracted_insurer_raw: record.insurer || '',
      plan_type: record.planType || 'Unknown',
      erisa_status: erisaStatus,
    },
    clinical: {
      denial_category: record.denial_category,
      procedure_condition: record.procedure || 'Unknown',
      procedure_codes: record.cptCodes || [],
      denial_reason_raw: record.denialReason || 'Unknown',
      denial_reason_normalized: record.denialReason || 'Unknown',
      medical_necessity_flag: record.medicalNecessityFlag,
      ime_involved: record.imeInvolved,
    },
    source: {
      source_type: record.source_type,
      source_label: record.source || 'Legacy Denial Import',
      source_url: record.url,
    },
    tags: Array.from(new Set([...(record.tags || []), `quality-${record.quality_score}`])),
    anomaly_detected: record.anomalyDetected || false,
    anomaly_reason: record.anomalyReason,
  };
}
