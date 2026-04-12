import type { DenialRecord, ExtractionResult } from '../types';

export type SupportedUploadMimeType =
  | 'application/pdf'
  | 'image/png'
  | 'image/jpeg'
  | 'image/jpg';

export type UploadFileMeta = {
  name: string;
  type: string;
  size: number;
};

export const SUPPORTED_UPLOAD_TYPES: SupportedUploadMimeType[] = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
];

export const MAX_UPLOAD_SIZE_BYTES = 15 * 1024 * 1024;

export function validateUploadFileMeta(file: UploadFileMeta) {
  if (!file.name) {
    return { ok: false as const, error: 'Please choose a file.' };
  }

  const normalizedType = file.type.toLowerCase();
  const hasSupportedExtension = /\.(pdf|png|jpe?g)$/i.test(file.name);
  const hasSupportedMime = SUPPORTED_UPLOAD_TYPES.includes(normalizedType as SupportedUploadMimeType);

  if (!hasSupportedMime && !hasSupportedExtension) {
    return {
      ok: false as const,
      error: 'Please upload a PDF, JPG, or PNG denial document.',
    };
  }

  if (file.size <= 0) {
    return { ok: false as const, error: 'The file looks empty. Try another copy.' };
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return {
      ok: false as const,
      error: 'That file is too large right now. Please keep uploads under 15 MB.',
    };
  }

  return { ok: true as const };
}

export function normalizeExtractionResult(partial: Partial<ExtractionResult>): ExtractionResult {
  return {
    insurer: partial.insurer?.trim() || 'Unknown',
    planType: partial.planType?.trim() || 'Unknown',
    procedure: partial.procedure?.trim() || 'Medical Service',
    denialReason: partial.denialReason?.trim() || 'Coverage Denial',
    denialQuote: partial.denialQuote?.trim() || '',
    appealDeadline: partial.appealDeadline?.trim() || '',
    isERISA: partial.isERISA?.trim() || 'Unknown',
    medicalNecessityFlag: Boolean(partial.medicalNecessityFlag),
    imeInvolved: Boolean(partial.imeInvolved),
    summary: partial.summary?.trim() || '',
    date: partial.date?.trim() || '',
    cptCodes: Array.isArray(partial.cptCodes) ? partial.cptCodes.filter(Boolean) : [],
  };
}

export function buildAppealDraftInput(args: {
  extracted: ExtractionResult;
  narrative: string;
}): DenialRecord {
  const { extracted, narrative } = args;

  return {
    id: 'temp',
    insurer: extracted.insurer,
    planType: extracted.planType,
    procedure: extracted.procedure,
    denialReason: extracted.denialReason,
    denialQuote: extracted.denialQuote,
    appealDeadline: extracted.appealDeadline,
    isERISA: extracted.isERISA,
    medicalNecessityFlag: extracted.medicalNecessityFlag,
    imeInvolved: extracted.imeInvolved,
    summary: extracted.summary,
    date: extracted.date || new Date().toISOString().slice(0, 10),
    status: 'denied',
    narrative,
    tags: [],
    isPublic: true,
    createdAt: new Date().toISOString(),
    cptCodes: extracted.cptCodes,
  };
}
