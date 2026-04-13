import type { DenialRecord } from '../types';
import type { DenialCategory, IngestionSourceType, ObservatoryStory } from '../types/domain';

const INSURER_ALIASES: Array<[RegExp, string]> = [
  [/(unitedhealthcare|united healthcare|uhc|optum|optumrx|navihealth|surest)/i, 'UnitedHealthcare'],
  [/(aetna|cvs caremark|caremark|meritain|coventry health care)/i, 'Aetna'],
  [/(cigna|evernorth|express scripts)/i, 'Cigna'],
  [/(blue cross|blue shield|bcbs|anthem|empire|premera|regence|highmark|carefirst|florida blue|horizon blue|capital blue|elevance|carelon)/i, 'Blue Cross Blue Shield'],
  [/(kaiser)/i, 'Kaiser Permanente'],
  [/(humana|centerwell)/i, 'Humana'],
  [/(centene|ambetter|wellcare|health net)/i, 'Centene'],
  [/(molina)/i, 'Molina Healthcare'],
  [/(oscar health|oscar\b)/i, 'Oscar Health'],
  [/(elevance health)/i, 'Blue Cross Blue Shield'],
  [/(geha|all savers|umr|oxford liberty|oxford health)/i, 'UnitedHealthcare'],
  [/(medicare advantage organizations|medicare advantage organization)/i, 'Medicare Advantage organizations'],
  [/(medicare\b)/i, 'Medicare'],
  [/(medicaid\b)/i, 'Medicaid'],
];

const INSURER_INFERENCE_PATTERNS: Array<[RegExp, string]> = [
  [/\b(choice plus|choiceplus|surest|oxford liberty|oxford health|all savers|umr|navigate|nexusaco)\b/i, 'UnitedHealthcare'],
  [/\b(anthem|empire blue|empire bcbs|premera|regence|highmark|carefirst|horizon blue|florida blue|capital blue|carelon)\b/i, 'Blue Cross Blue Shield'],
  [/\b(cvs caremark|caremark|meritain|coventry)\b/i, 'Aetna'],
  [/\b(express scripts|evernorth)\b/i, 'Cigna'],
  [/\b(centerwell)\b/i, 'Humana'],
  [/\b(ambetter|health net|wellcare)\b/i, 'Centene'],
  [/\b(medicare advantage|ma plan|medicare advtg)\b/i, 'Medicare Advantage organizations'],
  [/\bmedicare part d\b/i, 'Medicare'],
  [/\bmedicaid managed care\b/i, 'Medicaid'],
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

const PLAN_PATTERNS: Array<[RegExp, string]> = [
  [/(choice plus|choiceplus)/i, 'Choice Plus PPO'],
  [/\bsurest\b/i, 'Surest'],
  [/(oxford liberty|liberty plan)/i, 'Oxford Liberty'],
  [/(medicare advantage|medicare advtg|ma plan)/i, 'Medicare Advantage'],
  [/\bmedicare\b/i, 'Medicare'],
  [/\bmedicaid\b/i, 'Medicaid'],
  [/(marketplace|aca plan|obamacare|exchange plan)/i, 'Marketplace'],
  [/(employer|job.?based|through work|group plan|cobra)/i, 'Employer Sponsored'],
  [/\bppo\b/i, 'PPO'],
  [/\bhmo\b/i, 'HMO'],
  [/\bepo\b/i, 'EPO'],
  [/\bpos\b/i, 'POS'],
];

const PROCEDURE_PATTERNS: Array<[RegExp, string]> = [
  [/\b(remicade infusions?|infliximab infusions?|biologic infusion)\b/i, 'Infusion therapy'],
  [/\b(glp-?1|ozempic|wegovy|zepbound|mounjaro|tirzepatide|semaglutide)\b/i, 'GLP-1 medication'],
  [/\b(taltz|humira|rinvoq|skyrizi|cosentyx|benlysta|ocrevus|kesimpta|entyvio|stelara|remicade|infliximab|xeljanz|dupixent)\b/i, 'Specialty medication'],
  [/\b(mri|magnetic resonance imaging)\b/i, 'MRI'],
  [/\b(ct scan|cat scan|computed tomography)\b/i, 'CT scan'],
  [/\b(pet scan)\b/i, 'PET scan'],
  [/\b(ivf|iui|fertility|embryo transfer|egg retrieval)\b/i, 'Fertility treatment'],
  [/\b(breast reduction|breast reconstruction|reconstruction revision)\b/i, 'Breast surgery and reconstruction'],
  [/\b(proton therapy|radiation therapy|chemotherapy|oncology|cancer treatment)\b/i, 'Cancer treatment and oncology care'],
  [/\b(genetic test|genetic testing|prior auth for genesight|gene test)\b/i, 'Genetic testing'],
  [/\b(infusion|infusions|biologic infusion|remicade infusions?)\b/i, 'Infusion therapy'],
  [/\b(wheelchair|walker|cpap|bipap|dme|durable medical equipment)\b/i, 'Durable medical equipment'],
  [/\b(home health|home care|skilled nursing|rehab|post-acute|snf)\b/i, 'Post-acute care coverage'],
  [/\b(aba|autism therapy|speech therapy for autism|occupational therapy for autism)\b/i, 'ABA therapy'],
  [/\b(therapy|therapist|counseling|physical therapy|occupational therapy|pt)\b/i, 'Therapy services'],
  [/\b(psychiatry|residential treatment|mental health|behavioral health|depression|anxiety)\b/i, 'Mental health care'],
  [/\b(anesthesia)\b/i, 'Anesthesia'],
  [/\b(surgery|surgical|operation)\b/i, 'Surgery'],
  [/\b(medication|drug|prescription|rx)\b/i, 'Prescription medication'],
];

const DENIAL_REASON_PATTERNS: Array<[RegExp, string]> = [
  [/(not medically necessary|medical necessity|failed medical necessity review)/i, 'Not medically necessary'],
  [/(prior auth|prior authorization|preauth|authorization required|pending authorization)/i, 'Prior authorization required'],
  [/(out.?of.?network|network adequacy|gap exception|continuity of care)/i, 'Out-of-network coverage dispute'],
  [/(coverage exclusion|excluded benefit|plan exclusion|benefit exclusion|excluded under your plan|benefit is excluded|not covered under your plan)/i, 'Coverage exclusion'],
  [/(step therapy|fail first|must try and fail)/i, 'Step therapy required'],
  [/(eligib|coverage terminated|inactive coverage|coverage lapse)/i, 'Eligibility or enrollment issue'],
  [/(duplicate claim)/i, 'Duplicate claim denial'],
  [/(coding|billing|administrative|paperwork|missing information|timely filing)/i, 'Administrative or coding issue'],
  [/(experimental|investigational|not fda approved)/i, 'Experimental or investigational'],
  [/(medical records needed|additional records|need chart notes)/i, 'Insufficient documentation'],
];

export function normalizeInsurerName(input?: string): string {
  if (!input || input.trim() === '' || input.trim().toLowerCase() === 'unknown') return 'Unknown';
  for (const [pattern, canonical] of INSURER_ALIASES) {
    if (pattern.test(input)) return canonical;
  }
  for (const [pattern, canonical] of INSURER_INFERENCE_PATTERNS) {
    if (pattern.test(input)) return canonical;
  }
  return input.trim();
}

export function inferInsurerFromNarrativeText(input?: string): string {
  if (!input || input.trim() === '') return 'Unknown';
  for (const [pattern, canonical] of INSURER_INFERENCE_PATTERNS) {
    if (pattern.test(input)) return canonical;
  }
  return normalizeInsurerName(input);
}

export function normalizePlanType(input?: string): string {
  if (!input || input.trim() === '' || input.trim().toLowerCase() === 'unknown') return 'Unknown';
  for (const [pattern, canonical] of PLAN_PATTERNS) {
    if (pattern.test(input)) return canonical;
  }
  return input.trim();
}

export function normalizeProcedureLabel(input?: string): string {
  if (!input || input.trim() === '' || input.trim().toLowerCase() === 'unknown') return 'Insurance denial evidence';
  for (const [pattern, canonical] of PROCEDURE_PATTERNS) {
    if (pattern.test(input)) return canonical;
  }
  return input.trim();
}

export function normalizeDenialReasonText(input?: string): string {
  if (!input || input.trim() === '') return 'Coverage denial';
  for (const [pattern, canonical] of DENIAL_REASON_PATTERNS) {
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
  const normalizationHaystack = [
    record.insurer,
    record.denialReason,
    record.reason,
    record.denial_reason_raw,
    record.procedure,
    record.summary,
    record.narrative,
    record.planType,
    record.plan_type,
  ]
    .filter(Boolean)
    .join(' ');

  const normalizedInsurer = inferInsurerFromNarrativeText(record.insurer || normalizationHaystack);
  const normalizedReason = normalizeDenialReasonText(record.denialReason || record.reason || record.denial_reason_raw);
  const normalizedProcedure = normalizeProcedureLabel(record.procedure || normalizationHaystack);
  const denialCategory = inferDenialCategory(record);
  const sourceType = inferSourceType(record.source);
  const qualityScore = computeQualityScore(record);
  const normalizedPlanType = normalizePlanType(record.planType || record.plan_type || normalizationHaystack);

  return {
    ...record,
    insurer: normalizedInsurer,
    denialReason: normalizedReason,
    procedure: normalizedProcedure,
    planType: normalizedPlanType,
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
      denial_reason_normalized: normalizeDenialReasonText(record.denialReason),
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
