import type { DenialRecord } from '@/src/types';

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function compactFieldLabel(value?: string | null, maxLength = 44) {
  if (!value) return '';

  const cleaned = normalizeWhitespace(
    value
      .replace(/^what was denied[:\-\s]*/i, '')
      .replace(/^plan noted[:\-\s]*/i, '')
      .replace(/^still fighting back[:\-\s]*/i, '')
  );

  if (!cleaned) return '';

  const words = cleaned.split(' ').filter(Boolean);
  if (words.length > 7 || cleaned.length > maxLength) {
    const shortened = truncateStoryText(cleaned, maxLength);
    return shortened.endsWith('...') ? shortened : `${shortened}...`;
  }

  return cleaned;
}

function dedupeSentences(value: string) {
  const seen = new Set<string>();
  const parts = value
    .split(/(?<=[.!?])\s+/)
    .map((part) => normalizeWhitespace(part))
    .filter(Boolean);

  return parts.filter((part) => {
    const key = part.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function cleanStoryText(value?: string | null) {
  if (!value) return '';
  return normalizeWhitespace(value.replace(/[\r\n]+/g, ' '));
}

export function truncateStoryText(value: string, maxLength = 180) {
  if (value.length <= maxLength) return value;
  const clipped = value.slice(0, maxLength);
  return `${clipped.slice(0, clipped.lastIndexOf(' ')).trim()}...`;
}

export function buildStoryTitle(story: Partial<DenialRecord>) {
  const insurer = compactFieldLabel(story.insurer || story.extracted_insurer || '');
  const procedure = compactFieldLabel(story.procedure || story.procedure_condition || '');
  const category = cleanStoryText(story.denialReason || story.denial_reason_raw || story.denial_category || '');

  if (procedure && insurer && insurer !== 'Unknown' && insurer !== 'Unknown insurer') {
    return `${procedure} denied by ${insurer}`;
  }

  if (procedure) {
    return `${procedure} denial`;
  }

  if (insurer && insurer !== 'Unknown' && insurer !== 'Unknown insurer') {
    return `Denial fight with ${insurer}`;
  }

  if (category) {
    return `${category} denial story`;
  }

  return 'Insurance denial story';
}

export function buildStorySummary(story: Partial<DenialRecord>) {
  const storyLike = story as Partial<DenialRecord> & { patient_narrative_summary?: string };
  const sourceText = cleanStoryText(
    story.summary ||
    story.narrative ||
    story.denialReason ||
    story.denial_reason_raw ||
    storyLike.patient_narrative_summary ||
    ''
  );

  if (!sourceText) {
    return 'A patient documented how an insurer blocked care and what happened next.';
  }

  const sentences = dedupeSentences(sourceText);
  const concise = sentences.slice(0, 2).join(' ');
  return truncateStoryText(concise || sourceText, 220);
}

export function buildStoryPreview(story: Partial<DenialRecord>) {
  return truncateStoryText(buildStorySummary(story), 150);
}

export function buildWhatWasDenied(story: Partial<DenialRecord>) {
  return compactFieldLabel(story.procedure || story.procedure_condition || story.denialReason || story.denial_reason_raw || '') || 'Care access';
}

export function buildStoryActionTag(story: Partial<DenialRecord>) {
  const text = `${story.denialReason || ''} ${story.denial_reason_raw || ''} ${story.summary || ''} ${story.narrative || ''}`.toLowerCase();
  if (/(overturn|reversed|approved after appeal|won appeal)/.test(text)) return 'Appeal won';
  if (/(appeal|external review|grievance|hearing)/.test(text)) return 'Appeal filed';
  return 'Still fighting back';
}

export function buildStoryTags(story: Partial<DenialRecord>) {
  return [
    compactFieldLabel(story.procedure || story.procedure_condition || ''),
    compactFieldLabel(story.insurer || story.extracted_insurer || ''),
    compactFieldLabel(story.planType || story.plan_type || ''),
  ].filter((value) => value && !/^unknown/i.test(value));
}
