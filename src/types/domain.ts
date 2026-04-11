export type SubscriptionTier = 'standard' | 'b2b' | 'admin';

export type StoryStatus = 'draft' | 'processing' | 'published' | 'archived';

export type ConsentLevel = 'public_story' | 'aggregated_stats_only' | 'fully_private';

export type PlanType =
  | 'HMO'
  | 'PPO'
  | 'EPO'
  | 'POS'
  | 'Medicare Advantage'
  | 'Medicaid'
  | 'Marketplace'
  | 'Employer Sponsored'
  | 'ERISA'
  | 'Non-ERISA'
  | 'Unknown';

export type DenialCategory =
  | 'Medical Necessity'
  | 'Experimental'
  | 'Out of Network'
  | 'Administrative'
  | 'Prior Authorization'
  | 'Step Therapy'
  | 'Coding Error'
  | 'Coverage Exclusion'
  | 'Duplicate Claim'
  | 'Eligibility'
  | 'Unknown';

export type AppealLevel =
  | 'Internal Level 1'
  | 'Internal Level 2'
  | 'External Review'
  | 'Court'
  | 'Employer Escalation'
  | 'Regulator Complaint';

export type AppealOutcome = 'pending' | 'overturned' | 'upheld' | 'partial' | 'withdrawn';

export type DocumentType =
  | 'denial_letter'
  | 'eob'
  | 'medical_record'
  | 'prior_auth'
  | 'appeal_letter'
  | 'supporting_evidence'
  | 'other';

export type IngestionSourceType =
  | 'user_upload'
  | 'reddit'
  | 'x'
  | 'tiktok'
  | 'facebook'
  | 'propublica'
  | 'cms_mrf'
  | 'apcd'
  | 'manual_research'
  | 'other_public_web';

export type StoryEventType =
  | 'story_created'
  | 'story_updated'
  | 'published'
  | 'anonymized'
  | 'appeal_generated'
  | 'appeal_submitted'
  | 'appeal_outcome_updated'
  | 'deadline_detected'
  | 'benchmark_refreshed'
  | 'ingestion_attached';

export interface TimestampLike {
  seconds?: number;
  nanoseconds?: number;
  toDate?: () => Date;
}

export interface UserProfile {
  uid: string;
  email: string;
  created_at: TimestampLike | string;
  subscription_tier: SubscriptionTier;
  display_name?: string;
  organization_name?: string;
}

export interface AppealBenchmark {
  similar_cases_count: number;
  overturn_rate: number;
  sample_size_label?: string;
  methodology_version?: string;
  updated_at?: TimestampLike | string;
}

export interface StoryClinicalData {
  denial_category: DenialCategory;
  procedure_condition: string;
  procedure_code_primary?: string;
  procedure_codes?: string[];
  diagnosis_codes?: string[];
  denial_reason_raw: string;
  denial_reason_normalized?: string;
  medical_necessity_flag?: boolean;
  ime_involved?: boolean;
}

export interface StoryCoverageData {
  extracted_insurer: string;
  extracted_insurer_raw?: string;
  payer_parent?: string;
  plan_type: PlanType | string;
  state?: string;
  erisa_status?: 'ERISA' | 'Non-ERISA' | 'Unknown';
  network_status?: 'In Network' | 'Out of Network' | 'Unknown';
}

export interface StoryNarrativeData {
  patient_narrative_summary?: string;
  why_unfair_patient_quote?: string;
  emotional_tone?: string[];
  impact_summary?: string;
}

export interface StoryTimelineData {
  date_of_service?: string;
  date_of_denial?: string;
  appeal_deadline?: string;
  submission_timestamp: TimestampLike | string;
}

export interface StoryPrivacyData {
  consent_level: ConsentLevel;
  is_anonymized: boolean;
  contains_pii?: boolean;
  public_story_ready?: boolean;
  raw_upload_url?: string;
}

export interface StorySourceData {
  source_type: IngestionSourceType;
  source_label: string;
  source_url?: string;
  source_record_id?: string;
  source_author_handle?: string;
  ingestion_run_id?: string;
}

export interface StoryDocument {
  document_id: string;
  story_id: string;
  user_uid?: string;
  document_type: DocumentType;
  storage_path: string;
  download_url?: string;
  mime_type?: string;
  byte_size?: number;
  uploaded_at: TimestampLike | string;
  ocr_status?: 'pending' | 'processed' | 'failed';
  pii_redaction_status?: 'pending' | 'completed' | 'failed';
}

export interface AppealRecord {
  appeal_id: string;
  story_id: string;
  level: AppealLevel;
  submission_date?: string;
  outcome: AppealOutcome;
  generated_letter_url?: string;
  generated_letter_version?: string;
  notes?: string;
  created_at?: TimestampLike | string;
}

export interface StoryEvent {
  event_id: string;
  story_id: string;
  event_type: StoryEventType;
  actor_type?: 'user' | 'admin' | 'ai' | 'system';
  actor_uid?: string;
  created_at: TimestampLike | string;
  metadata?: Record<string, unknown>;
}

export interface IngestionRun {
  ingestion_run_id: string;
  source_type: IngestionSourceType;
  source_label: string;
  started_at: TimestampLike | string;
  finished_at?: TimestampLike | string;
  status: 'running' | 'completed' | 'failed';
  query_terms?: string[];
  records_scanned?: number;
  records_created?: number;
  records_deduped?: number;
  error_message?: string;
}

export interface SourceRecord {
  source_record_id: string;
  source_type: IngestionSourceType;
  external_id?: string;
  canonical_url?: string;
  title?: string;
  raw_text?: string;
  raw_payload?: Record<string, unknown>;
  extracted_story_id?: string;
  created_at?: TimestampLike | string;
}

export interface GlobalAnalytics {
  analytics_id: string;
  total_stories: number;
  total_public_stories: number;
  total_private_cases: number;
  total_appeals: number;
  total_overturned: number;
  top_denied_procedures: Array<{ label: string; count: number }>;
  insurers_by_denial_count: Array<{ label: string; count: number }>;
  average_overturn_rate: number;
  updated_at: TimestampLike | string;
}

export interface ObservatoryStory {
  story_id: string;
  user_uid?: string;
  status: StoryStatus;
  coverage: StoryCoverageData;
  clinical: StoryClinicalData;
  narrative: StoryNarrativeData;
  timeline: StoryTimelineData;
  privacy: StoryPrivacyData;
  source: StorySourceData;
  benchmark?: AppealBenchmark;
  tags?: string[];
  anomaly_detected?: boolean;
  anomaly_reason?: string;
}
