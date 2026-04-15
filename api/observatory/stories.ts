import { neon } from '@neondatabase/serverless';
import { describeSourceConfidence } from '@/src/lib/sourceSignals';
import { buildStoryActionTag, buildStoryPreview, buildStorySummary, buildStoryTags, buildStoryTitle, buildWhatWasDenied } from '@/src/lib/storyPresentation';
import { enforceRateLimit, sendSafeError } from '../_lib/http';

function asString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

export default async function handler(req: any, res: any) {
  if (!enforceRateLimit(req, res, { key: 'observatory-stories', limit: 45, windowMs: 60_000 })) {
    return;
  }

  try {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      res.status(500).json({ status: 'error', error: 'DATABASE_URL is not configured in Vercel.' });
      return;
    }

    const sql = neon(connectionString);
    const query = asString(req.query?.q).trim();
    const limit = Math.min(Number(req.query?.limit || 18), 30);

    const searchText = query ? `%${query}%` : null;

    const rows = await sql`
      SELECT
        story_id,
        extracted_insurer,
        plan_type,
        procedure_condition,
        denial_category,
        denial_reason_raw,
        patient_narrative_summary,
        source_label,
        source_type,
        source_url,
        submission_timestamp,
        quality_score
      FROM curated_stories
      WHERE status = 'published'
        AND consent_level = 'public_story'
        AND COALESCE(patient_narrative_summary, '') !~* '(turn 26|which plan|what plan|late enrollment|open enrollment|shopping for|marketplace quote|recommendations for)'
        AND COALESCE(procedure_condition, '') NOT IN ('', 'Insurance denial evidence', 'General healthcare access')
        AND (
          ${searchText}::text IS NULL
          OR COALESCE(extracted_insurer, '') ILIKE ${searchText}
          OR COALESCE(plan_type, '') ILIKE ${searchText}
          OR COALESCE(procedure_condition, '') ILIKE ${searchText}
          OR COALESCE(denial_category, '') ILIKE ${searchText}
          OR COALESCE(denial_reason_raw, '') ILIKE ${searchText}
          OR COALESCE(patient_narrative_summary, '') ILIKE ${searchText}
        )
      ORDER BY quality_score DESC, submission_timestamp DESC
      LIMIT ${limit}
    `;

    const stories = (rows as any[]).map((row) => {
      const story = {
        id: row.story_id,
        insurer: row.extracted_insurer || 'Private carrier',
        extracted_insurer: row.extracted_insurer || 'Private carrier',
        procedure: row.procedure_condition || 'Medical service denial',
        procedure_condition: row.procedure_condition || 'Medical service denial',
        denialReason: row.denial_reason_raw || row.denial_category || 'Coverage denial',
        denial_reason_raw: row.denial_reason_raw || row.denial_category || 'Coverage denial',
        summary: row.patient_narrative_summary || row.denial_reason_raw || 'A denial story from the public database.',
        narrative: row.patient_narrative_summary || '',
        source: row.source_label || 'Public source',
        url: row.source_url || undefined,
        status: 'denied' as const,
        tags: [],
        isPublic: true,
        createdAt: row.submission_timestamp || null,
        date: '',
        planType: row.plan_type || '',
        plan_type: row.plan_type || '',
        denial_category: row.denial_category || 'Unknown',
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
        denial_category: row.denial_category || '',
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
    });

    res.status(200).json({
      status: 'success',
      query,
      total: stories.length,
      stories,
    });
  } catch (error) {
    sendSafeError(res, 500, 'We could not load stories from the public record right now.', error, 'observatory-stories');
  }
}
