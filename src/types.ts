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
  date: string;
  status: 'denied' | 'appealing' | 'overturned' | 'sustained';
  narrative: string;
  tags: string[];
  isPublic: boolean;
  userId?: string;
  createdAt: any;
  source?: string;
  url?: string;
  cptCodes?: string[];
  anomalyDetected?: boolean;
  anomalyReason?: string;
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
  date: string;
  cptCodes: string[];
}

export interface AppealDraft {
  subject: string;
  body: string;
  keyArguments: string[];
}
