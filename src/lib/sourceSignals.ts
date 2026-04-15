import type { TrustedObservation } from './trustedObservationPack';

type SourceSignalInput = Pick<
  TrustedObservation,
  | 'canonical_url'
  | 'source_label'
  | 'source_type'
  | 'source_weight'
  | 'insurer_raw'
  | 'insurer_normalized'
  | 'procedure_raw'
  | 'procedure_normalized'
  | 'denial_reason_raw'
  | 'denial_category'
  | 'plan_type'
  | 'quality_score'
  | 'is_low_signal'
  | 'fingerprint'
>;

const SOURCE_WEIGHT_BASE: Record<string, number> = {
  official_regulatory: 92,
  investigative: 88,
  complaint_platform: 74,
  public_patient_forum: 79,
  social_chatter: 58,
};

function normalizeToken(value: unknown) {
  return String(value || '')
    .toLowerCase()
    .replace(/https?:\/\//g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactReason(value: string) {
  const normalized = normalizeToken(value);
  if (!normalized) return '';
  return normalized.split(' ').slice(0, 12).join(' ');
}

function stableHash(value: string) {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash) + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function buildObservationFingerprint(observation: SourceSignalInput) {
  if (observation.fingerprint?.trim()) {
    return observation.fingerprint.trim();
  }

  const canonicalSeed = [
    normalizeToken(observation.canonical_url),
    normalizeToken(observation.insurer_normalized || observation.insurer_raw),
    normalizeToken(observation.procedure_normalized || observation.procedure_raw),
    normalizeToken(observation.denial_category),
    compactReason(observation.denial_reason_raw),
  ]
    .filter(Boolean)
    .join('|');

  return `obs_${stableHash(canonicalSeed || normalizeToken(observation.source_label) || 'observation')}`;
}

export function computeSourceConfidence(observation: SourceSignalInput) {
  const base = SOURCE_WEIGHT_BASE[observation.source_weight] ?? SOURCE_WEIGHT_BASE[observation.source_type] ?? 70;
  let score = Math.round((base + Number(observation.quality_score || 0)) / 2);

  const insurer = normalizeToken(observation.insurer_normalized || observation.insurer_raw);
  const procedure = normalizeToken(observation.procedure_normalized || observation.procedure_raw);
  const category = normalizeToken(observation.denial_category);
  const planType = normalizeToken(observation.plan_type);

  if (insurer && insurer !== 'unknown' && insurer !== 'multiple insurers') score += 4;
  if (procedure && !procedure.includes('insurance denial evidence')) score += 4;
  if (category && category !== 'unknown') score += 3;
  if (planType && planType !== 'unknown') score += 2;
  if (observation.is_low_signal) score -= 18;

  return Math.max(20, Math.min(99, score));
}

export function describeSourceConfidence(observation: SourceSignalInput) {
  const score = computeSourceConfidence(observation);

  if (score >= 90) {
    return {
      score,
      label: 'High-confidence source',
      note: 'Strong source quality and enough structured detail to use as public evidence.',
    };
  }

  if (score >= 75) {
    return {
      score,
      label: 'Useful public signal',
      note: 'A credible public source with enough detail to compare against other denial stories.',
    };
  }

  return {
    score,
    label: 'Watch with caution',
    note: 'Useful for pattern discovery, but still too noisy or incomplete to treat as strong precedent on its own.',
  };
}

export function hydrateObservation<T extends SourceSignalInput>(observation: T): T {
  return {
    ...observation,
    fingerprint: buildObservationFingerprint(observation),
    quality_score: computeSourceConfidence(observation),
  };
}

export function dedupeObservations<T extends SourceSignalInput>(observations: T[]) {
  const deduped = new Map<string, T>();

  for (const observation of observations) {
    const hydrated = hydrateObservation(observation);
    const key = buildObservationFingerprint(hydrated);
    const existing = deduped.get(key);

    if (!existing || Number(hydrated.quality_score || 0) >= Number(existing.quality_score || 0)) {
      deduped.set(key, hydrated);
    }
  }

  return Array.from(deduped.values());
}
