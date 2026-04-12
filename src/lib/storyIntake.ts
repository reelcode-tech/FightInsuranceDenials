import type { ExtractionResult } from '@/src/types';

export type StoryManualFields = {
  insurer: string;
  planType: string;
  procedure: string;
  denialReason: string;
  date: string;
};

export function buildSeededStoryNarrative(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return '';

  return trimmed.toLowerCase().startsWith('i ')
    ? `${trimmed}\n\nHas anyone else gone through this denial? Here is what happened to me:`
    : `I have ${trimmed}. Has anyone else gone through this denial? Here is what happened to me:`;
}

export function mergeStoryExtraction(args: {
  extractedData: ExtractionResult | null;
  manualFields: StoryManualFields;
  narrative: string;
  rawText: string;
}): ExtractionResult {
  const { extractedData, manualFields, narrative, rawText } = args;

  return {
    insurer: manualFields.insurer || extractedData?.insurer || 'Unknown',
    planType: manualFields.planType || extractedData?.planType || 'Unknown',
    procedure: manualFields.procedure || extractedData?.procedure || 'Medical Service',
    denialReason: manualFields.denialReason || extractedData?.denialReason || 'Coverage Denial',
    denialQuote: extractedData?.denialQuote || '',
    appealDeadline: extractedData?.appealDeadline || '',
    isERISA: extractedData?.isERISA || 'Unknown',
    medicalNecessityFlag: extractedData?.medicalNecessityFlag || false,
    imeInvolved: extractedData?.imeInvolved || false,
    summary: extractedData?.summary || (narrative || rawText).slice(0, 280),
    date: manualFields.date || extractedData?.date || new Date().toISOString().slice(0, 10),
    cptCodes: extractedData?.cptCodes || [],
  };
}
