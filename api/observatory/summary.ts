import { neon } from '@neondatabase/serverless';
import { describeSourceConfidence } from '@/src/lib/sourceSignals';
import { buildStoryActionTag, buildStoryPreview, buildStorySummary, buildStoryTags, buildStoryTitle, buildWhatWasDenied } from '@/src/lib/storyPresentation';
import { enforceRateLimit, sendSafeError } from '../_lib/http';

function asNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export default async function handler(_req: any, res: any) {
  if (!enforceRateLimit(_req, res, { key: 'observatory-summary', limit: 60, windowMs: 60_000 })) {
    return;
  }

  try {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      res.status(500).json({
        status: 'error',
        error: 'DATABASE_URL is not configured in Vercel.',
      });
      return;
    }

    const sql = neon(connectionString);

    const [countResult, topCategoryResult, featuredResult] = await Promise.all([
      sql`
        SELECT
          (SELECT COUNT(*)::int FROM raw_web_observations) AS raw_observation_count,
          (SELECT COUNT(*)::int FROM source_records) AS source_record_count,
          (
            SELECT COUNT(*)::int
            FROM curated_stories
            WHERE status = 'published' AND consent_level = 'public_story'
          ) AS total_visible_count
      `,
      sql`
        SELECT denial_category, COUNT(*)::int AS record_count
        FROM curated_stories
        WHERE status = 'published'
          AND consent_level = 'public_story'
          AND COALESCE(denial_category, '') NOT IN ('', 'Unknown')
        GROUP BY denial_category
        ORDER BY record_count DESC
        LIMIT 1
      `,
      sql`
        SELECT
          story_id,
          extracted_insurer,
          plan_type,
          procedure_condition,
          denial_reason_raw,
          patient_narrative_summary,
          source_label,
          source_type,
          source_url,
          quality_score
        FROM curated_stories
        WHERE status = 'published' AND consent_level = 'public_story'
          AND COALESCE(denial_category, '') NOT IN ('', 'Unknown')
          AND COALESCE(procedure_condition, '') NOT IN ('', 'Insurance denial evidence', 'Insurance denial or appeal evidence')
          AND COALESCE(denial_reason_raw, '') ~* '(denied|appeal|prior auth|prior authorization|not medically necessary|out of network|step therapy|coverage denied|claim denied|not covered|overturned|upheld)'
          AND COALESCE(patient_narrative_summary, '') !~* '(which plan|what plan|turn 26|late enrollment|open enrollment|shopping for)'
        ORDER BY quality_score DESC, submission_timestamp DESC
        LIMIT 3
      `,
    ]);

    const counts = countResult[0] || {};

    res.status(200).json({
      status: 'success',
      rawObservationCount: asNumber((counts as any).raw_observation_count),
      sourceRecordCount: asNumber((counts as any).source_record_count),
      totalVisibleCount: asNumber((counts as any).total_visible_count),
      topCategory: (topCategoryResult[0] as any)?.denial_category || 'Coverage Denial',
      featuredStories: (featuredResult as any[]).map((row: any) => {
        const story = {
          id: row.story_id,
          insurer: row.extracted_insurer || 'Private carrier',
          procedure: row.procedure_condition || 'Medical service denial',
          denialReason: row.denial_reason_raw || 'Coverage denial',
          summary: row.patient_narrative_summary || row.denial_reason_raw || 'A denial story from the public observatory.',
          source: row.source_label || 'Public source',
          url: row.source_url || undefined,
          status: 'denied' as const,
          tags: [],
          isPublic: true,
          createdAt: null,
          date: '',
          narrative: row.patient_narrative_summary || '',
          planType: row.plan_type || '',
          source_type: row.source_type || '',
          quality_score: row.quality_score || 0,
        };

        const sourceConfidence = describeSourceConfidence({
          canonical_url: row.source_url || '',
          source_label: row.source_label || 'Public source',
          source_type: row.source_type || 'public_patient_forum',
          source_weight: row.source_type || 'public_patient_forum',
          insurer_raw: row.extracted_insurer || '',
          insurer_normalized: row.extracted_insurer || '',
          procedure_raw: row.procedure_condition || '',
          procedure_normalized: row.procedure_condition || '',
          denial_reason_raw: row.denial_reason_raw || '',
          denial_category: '',
          plan_type: row.plan_type || '',
          quality_score: row.quality_score || 0,
          is_low_signal: false,
          fingerprint: '',
        });

        return {
          ...story,
          title: buildStoryTitle(story),
          summary: buildStorySummary(story),
          preview: buildStoryPreview(story),
          whatWasDenied: buildWhatWasDenied(story),
          actionTag: buildStoryActionTag(story),
          tags: buildStoryTags(story),
          sourceConfidenceLabel: sourceConfidence.label,
          sourceConfidenceScore: sourceConfidence.score,
          sourceTrustNote: sourceConfidence.note,
        };
      }),
    });
  } catch (error) {
    sendSafeError(res, 500, 'We could not load the public database summary right now.', error, 'observatory-summary');
  }
}
