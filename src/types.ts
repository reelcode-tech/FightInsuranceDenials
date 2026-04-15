export interface DenialRecord {
  id: string;
  insurer: string;
  planType: string;
  procedure: string;
  denialReason: string;
  denialQuote?: string;
  appealDeadline?: string;
  isERISA?: string;
  medicalNecessityFlag?: boolean;
  imeInvolved?: boolean;
  summary?: string;
  date: string;
  status: 'denied' | 'appealing' | 'overturned' | 'sustained';
  narrative: string;
  tags: string[];
  isPublic: boolean;
  userId?: string;
  createdAt: any;
  source?: string;
  url?: string;
  preview?: string;
  whatWasDenied?: string;
  sourceConfidenceLabel?: string;
  sourceConfidenceScore?: number;
  sourceTrustNote?: string;
  cptCodes?: string[];
  anomalyDetected?: boolean;
  anomalyReason?: string;
  story_id?: string;
  user_uid?: string;
  extracted_insurer?: string;
  plan_type?: string;
  denial_category?: string;
  denial_reason_raw?: string;
  denial_reason_normalized?: string;
  procedure_condition?: string;
  date_of_service?: string;
  date_of_denial?: string;
  consentLevel?: 'public_story' | 'aggregated_stats_only' | 'fully_private';
  is_anonymized?: boolean;
  contains_pii?: boolean;
  public_story_ready?: boolean;
  raw_upload_url?: string;
  source_type?: string;
  source_label?: string;
  source_record_id?: string;
  source_author_handle?: string;
  ingestion_run_id?: string;
  benchmark?: {
    similar_cases_count: number;
    overturn_rate: number;
    updated_at?: any;
  };
}

export interface ExtractionResult {
  insurer: string;
  planType: string;
  procedure: string;
  denialReason: string;
  denialQuote?: string;
  appealDeadline?: string;
  isERISA?: string;
  medicalNecessityFlag?: boolean;
  imeInvolved?: boolean;
  summary?: string;
  date: string;
  cptCodes: string[];
}

export interface AppealDraft {
  subject: string;
  body: string;
  keyArguments: string[];
  benchmarkSummary?: string;
  precedentNotes?: string[];
  evidenceChecklist?: string[];
}

export type {
  AppealBenchmark,
  AppealLevel,
  AppealOutcome,
  AppealRecord,
  ConsentLevel,
  DenialCategory,
  DocumentType,
  GlobalAnalytics,
  IngestionRun,
  IngestionSourceType,
  ObservatoryStory,
  PlanType,
  SourceRecord,
  StoryDocument,
  StoryEvent,
  StoryEventType,
  StoryPrivacyData,
  StorySourceData,
  StoryStatus,
  SubscriptionTier,
  UserProfile,
} from './types/domain';
