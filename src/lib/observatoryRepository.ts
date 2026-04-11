import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  type Firestore,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import type { DenialRecord, ExtractionResult } from '../types';
import type { GlobalAnalytics, ObservatoryStory } from '../types/domain';
import { legacyDenialToStory, storyToLegacyDenial } from './storyMapper';

function snapshotToLegacyDenial(doc: QueryDocumentSnapshot): DenialRecord {
  const data = doc.data() as Record<string, any>;
  return {
    id: doc.id,
    ...data,
    date: data.date || (data.createdAt?.toDate?.()?.toLocaleDateString?.()) || 'Recent',
  } as DenialRecord;
}

function storySnapshotToLegacyDenial(doc: QueryDocumentSnapshot): DenialRecord {
  const story = doc.data() as ObservatoryStory;
  const denial = storyToLegacyDenial({
    ...story,
    story_id: story.story_id || doc.id,
  });

  return {
    ...denial,
    id: doc.id,
    status: denial.status || 'denied',
    createdAt: story.timeline?.submission_timestamp || denial.createdAt,
  };
}

function sortByCreatedAt(records: DenialRecord[]): DenialRecord[] {
  return [...records].sort((a, b) => {
    const aSeconds = a.createdAt?.seconds || 0;
    const bSeconds = b.createdAt?.seconds || 0;
    return bSeconds - aSeconds;
  });
}

function dedupeRecords(records: DenialRecord[]): DenialRecord[] {
  const seen = new Set<string>();
  return records.filter((record) => {
    const key = record.url || record.story_id || record.id;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function countObservatoryRecords(db: Firestore): Promise<number> {
  const [storySnap, denialSnap] = await Promise.all([
    getDocs(query(collection(db, 'stories'), limit(1000))),
    getDocs(query(collection(db, 'denials'), limit(1000))),
  ]);

  const storyRecords = storySnap.docs.map(storySnapshotToLegacyDenial);
  const denialRecords = denialSnap.docs.map(snapshotToLegacyDenial);
  return dedupeRecords([...storyRecords, ...denialRecords]).length;
}

export async function fetchFeaturedObservatoryStories(db: Firestore, maxItems = 3): Promise<DenialRecord[]> {
  const [storySnap, denialSnap] = await Promise.all([
    getDocs(
      query(
        collection(db, 'stories'),
        where('privacy.consent_level', '==', 'public_story'),
        where('privacy.is_anonymized', '==', true),
        limit(maxItems * 3)
      )
    ),
    getDocs(query(collection(db, 'denials'), where('isPublic', '==', true), limit(maxItems * 3))),
  ]);

  const merged = dedupeRecords([
    ...storySnap.docs.map(storySnapshotToLegacyDenial),
    ...denialSnap.docs.map(snapshotToLegacyDenial),
  ]);

  return sortByCreatedAt(merged).slice(0, maxItems);
}

export async function fetchCurrentAnalytics(db: Firestore): Promise<(GlobalAnalytics & Record<string, any>) | null> {
  const analyticsRef = doc(db, 'analytics', 'current');
  const analyticsSnap = await getDoc(analyticsRef);
  if (!analyticsSnap.exists()) return null;
  return analyticsSnap.data() as GlobalAnalytics & Record<string, any>;
}

export function subscribeToPublicObservatoryRecords(
  db: Firestore,
  maxItems: number,
  onNext: (records: DenialRecord[]) => void,
  onError: (error: unknown) => void
): Unsubscribe {
  let storyRecords: DenialRecord[] = [];
  let legacyRecords: DenialRecord[] = [];

  const emit = () => {
    onNext(sortByCreatedAt(dedupeRecords([...storyRecords, ...legacyRecords])).slice(0, maxItems));
  };

  const unsubscribeStories = onSnapshot(
    query(
      collection(db, 'stories'),
      where('privacy.consent_level', '==', 'public_story'),
      where('privacy.is_anonymized', '==', true),
      limit(maxItems)
    ),
    (snapshot) => {
      storyRecords = snapshot.docs.map(storySnapshotToLegacyDenial);
      emit();
    },
    onError
  );

  const unsubscribeLegacy = onSnapshot(
    query(collection(db, 'denials'), where('isPublic', '==', true), limit(maxItems)),
    (snapshot) => {
      legacyRecords = snapshot.docs.map(snapshotToLegacyDenial);
      emit();
    },
    onError
  );

  return () => {
    unsubscribeStories();
    unsubscribeLegacy();
  };
}

export async function saveUserSubmission(
  db: Firestore,
  submission: {
    extractedData: ExtractionResult;
    narrative: string;
    uploadedFileUrl?: string | null;
    userId?: string | null;
    consent: {
      public: boolean;
      aggregated: boolean;
      research: boolean;
    };
  }
) {
  const consentLevel = submission.consent.public
    ? 'public_story'
    : submission.consent.aggregated || submission.consent.research
      ? 'aggregated_stats_only'
      : 'fully_private';

  const story: Omit<ObservatoryStory, 'story_id'> = {
    user_uid: submission.userId || undefined,
    status: 'processing',
    coverage: {
      extracted_insurer: submission.extractedData.insurer || 'Private Carrier',
      extracted_insurer_raw: submission.extractedData.insurer || '',
      plan_type: submission.extractedData.planType || 'Unknown',
      erisa_status: (submission.extractedData.isERISA as 'ERISA' | 'Non-ERISA' | 'Unknown') || 'Unknown',
    },
    clinical: {
      denial_category: 'Unknown',
      procedure_condition: submission.extractedData.procedure || 'Medical Service',
      procedure_codes: submission.extractedData.cptCodes || [],
      denial_reason_raw: submission.extractedData.denialQuote || submission.extractedData.denialReason || 'Coverage Denial',
      denial_reason_normalized: submission.extractedData.denialReason || 'Coverage Denial',
      medical_necessity_flag: submission.extractedData.medicalNecessityFlag,
      ime_involved: submission.extractedData.imeInvolved,
    },
    narrative: {
      patient_narrative_summary: submission.extractedData.summary || `User story regarding ${submission.extractedData.insurer || 'insurance'} denial.`,
      why_unfair_patient_quote: submission.narrative,
      impact_summary: submission.narrative,
    },
    timeline: {
      date_of_denial: submission.extractedData.date || '',
      appeal_deadline: submission.extractedData.appealDeadline || '',
      submission_timestamp: serverTimestamp() as never,
    },
    privacy: {
      consent_level: consentLevel,
      is_anonymized: !submission.narrative,
      contains_pii: true,
      public_story_ready: consentLevel === 'public_story' && !submission.narrative,
      raw_upload_url: submission.uploadedFileUrl || undefined,
    },
    source: {
      source_type: 'user_upload',
      source_label: 'User Submission',
    },
    tags: ['user-submission'],
  };

  const storyRef = await addDoc(collection(db, 'stories'), story as Record<string, unknown>);
  const legacyDenial = storyToLegacyDenial({ ...story, story_id: storyRef.id });

  await addDoc(collection(db, 'denials'), {
    ...legacyDenial,
    story_id: storyRef.id,
    userId: submission.userId || null,
    isPublic: consentLevel === 'public_story',
    consentLevel,
    fileUrl: submission.uploadedFileUrl || null,
    consentResearch: submission.consent.research,
    createdAt: serverTimestamp(),
  });

  return storyRef.id;
}

export function toStoryCandidate(record: DenialRecord): ObservatoryStory {
  return legacyDenialToStory(record);
}
