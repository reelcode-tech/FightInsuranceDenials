import { DenialRecord } from '../types';
import { ObservatoryStory } from '../types/domain';

function toIsoDate(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value && 'toDate' in value && typeof (value as any).toDate === 'function') {
    return (value as any).toDate().toISOString();
  }
  return '';
}

function normalizeConsentLevel(input: {
  consentLevel?: string;
  isPublic?: boolean;
  consentResearch?: boolean;
}): ObservatoryStory['privacy']['consent_level'] {
  if (input.consentLevel === 'public_story' || input.consentLevel === 'aggregated_stats_only' || input.consentLevel === 'fully_private') {
    return input.consentLevel;
  }

  if (input.isPublic) return 'public_story';
  if (input.consentResearch) return 'aggregated_stats_only';
  return 'fully_private';
}

function normalizeDenialCategory(value: unknown): ObservatoryStory['clinical']['denial_category'] {
  const allowed = new Set([
    'Medical Necessity',
    'Experimental',
    'Out of Network',
    'Administrative',
    'Prior Authorization',
    'Step Therapy',
    'Coding Error',
    'Coverage Exclusion',
    'Duplicate Claim',
    'Eligibility',
    'Unknown',
  ]);

  return typeof value === 'string' && allowed.has(value)
    ? (value as ObservatoryStory['clinical']['denial_category'])
    : 'Unknown';
}

function normalizeSourceType(value: unknown, sourceLabel: unknown): ObservatoryStory['source']['source_type'] {
  const allowed = new Set([
    'user_upload',
    'reddit',
    'x',
    'tiktok',
    'facebook',
    'propublica',
    'cms_mrf',
    'apcd',
    'manual_research',
    'other_public_web',
  ]);

  if (typeof value === 'string' && allowed.has(value)) {
    return value as ObservatoryStory['source']['source_type'];
  }

  if (sourceLabel === 'User Submission') return 'user_upload';
  return 'other_public_web';
}

export function legacyDenialToStory(record: Partial<DenialRecord> & Record<string, any>): ObservatoryStory {
  return {
    story_id: record.id || record.story_id || '',
    user_uid: record.userId || record.user_uid,
    status: record.status === 'denied' || record.status === 'appealing' || record.status === 'overturned'
      ? 'published'
      : (record.status as any) || 'draft',
    coverage: {
      extracted_insurer: record.insurer || record.extracted_insurer || 'Private Carrier',
      extracted_insurer_raw: record.insurer,
      plan_type: record.planType || record.plan_type || 'Unknown',
      state: record.state,
      erisa_status: record.isERISA || record.erisa_status || 'Unknown',
      network_status: record.network_status || 'Unknown',
    },
    clinical: {
      denial_category: normalizeDenialCategory(record.denial_category),
      procedure_condition: record.procedure || record.procedure_condition || 'Medical Service',
      procedure_codes: record.cptCodes || record.procedure_codes || [],
      denial_reason_raw: record.denialQuote || record.denial_reason_raw || record.denialReason || 'Coverage Denial',
      denial_reason_normalized: record.denialReason || record.denial_reason_normalized || 'Coverage Denial',
      medical_necessity_flag: record.medicalNecessityFlag,
      ime_involved: record.imeInvolved,
    },
    narrative: {
      patient_narrative_summary: record.summary || record.patient_narrative_summary,
      why_unfair_patient_quote: record.why_unfair_patient_quote || record.narrative,
      impact_summary: record.summary,
    },
    timeline: {
      date_of_service: record.date_of_service,
      date_of_denial: record.date || record.date_of_denial,
      appeal_deadline: record.appealDeadline || record.appeal_deadline,
      submission_timestamp: record.createdAt || record.submission_timestamp || '',
    },
    privacy: {
      consent_level: normalizeConsentLevel(record),
      is_anonymized: record.is_anonymized ?? true,
      contains_pii: record.contains_pii ?? false,
      public_story_ready: record.isPublic ?? false,
      raw_upload_url: record.fileUrl || record.raw_upload_url,
    },
    source: {
      source_type: normalizeSourceType(record.source_type, record.source),
      source_label: record.source || record.source_label || 'Legacy Denial Import',
      source_url: record.url || record.source_url,
      source_record_id: record.source_record_id,
      source_author_handle: record.source_author_handle,
      ingestion_run_id: record.ingestion_run_id,
    },
    benchmark: record.similarCasesCount || record.benchmark
      ? {
          similar_cases_count: record.similarCasesCount || record.benchmark?.similar_cases_count || 0,
          overturn_rate: record.benchmark?.overturn_rate || 0,
          updated_at: toIsoDate(record.benchmark?.updated_at),
        }
      : undefined,
    tags: record.tags || [],
    anomaly_detected: record.anomalyDetected || record.anomaly_detected || false,
    anomaly_reason: record.anomalyReason || record.anomaly_reason,
  };
}

export function storyToLegacyDenial(story: ObservatoryStory): DenialRecord {
  return {
    id: story.story_id,
    insurer: story.coverage.extracted_insurer,
    planType: String(story.coverage.plan_type || 'Unknown'),
    procedure: story.clinical.procedure_condition,
    denialReason: story.clinical.denial_reason_normalized || story.clinical.denial_reason_raw,
    denialQuote: story.clinical.denial_reason_raw,
    appealDeadline: story.timeline.appeal_deadline,
    isERISA: story.coverage.erisa_status,
    medicalNecessityFlag: story.clinical.medical_necessity_flag,
    imeInvolved: story.clinical.ime_involved,
    summary: story.narrative.patient_narrative_summary || story.narrative.impact_summary,
    date: story.timeline.date_of_denial || '',
    status: story.status === 'archived' ? 'sustained' : 'denied',
    narrative: story.narrative.why_unfair_patient_quote || '',
    tags: story.tags || [],
    isPublic: story.privacy.consent_level === 'public_story',
    userId: story.user_uid,
    createdAt: story.timeline.submission_timestamp,
    source: story.source.source_label,
    url: story.source.source_url,
    cptCodes: story.clinical.procedure_codes,
    anomalyDetected: story.anomaly_detected,
    anomalyReason: story.anomaly_reason,
  };
}
