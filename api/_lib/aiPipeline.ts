import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { AppealDraft, DenialRecord, ExtractionResult } from '../../src/types';
import { runBigQuerySql } from '../../src/lib/bigquery';
import { normalizeExtractionResult } from '../../src/lib/intakePipeline';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const AI_PROVIDER = process.env.AI_PROVIDER || 'auto';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const ai = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

function activeProvider() {
  if (AI_PROVIDER === 'gemini') return GEMINI_API_KEY ? 'gemini' : null;
  if (AI_PROVIDER === 'openai') return OPENAI_API_KEY ? 'openai' : null;
  if (GEMINI_API_KEY) return 'gemini';
  if (OPENAI_API_KEY) return 'openai';
  return null;
}

function canFallbackToOpenAI() {
  return AI_PROVIDER === 'auto' && Boolean(OPENAI_API_KEY);
}

function isRetryableGeminiFailure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  return (
    message.includes('429') ||
    lower.includes('quota exceeded') ||
    lower.includes('rate limit') ||
    lower.includes('no longer available to new users') ||
    lower.includes('404 not found')
  );
}

function escapeSqlLiteral(value: unknown) {
  return String(value ?? '').replace(/'/g, "''");
}

export function buildExtractionPrompt(text: string) {
  return `You are an expert medical billing and insurance specialist.
Analyze the provided text or image of a health insurance denial letter.
Extract the following details with high precision.

Guidelines:
- Insurer: The name of the insurance company (e.g., Aetna, Cigna, UnitedHealthcare).
- Plan Type: Capture the specific plan name or plan type when possible (e.g., "Choice Plus PPO", "Medicare Advantage", "Employer-sponsored PPO", "Marketplace HMO").
- Procedure: The specific medical service or medication denied.
- Denial Reason: The core reason for rejection (e.g., Not Medically Necessary, Experimental, Out of Network, Missing Prior Auth).
- Denial Quote: The EXACT sentence or phrase from the letter explaining the rejection logic.
- Appeal Deadline: The timeline mentioned for filing an appeal (e.g., "180 days", "60 days").
- isERISA: Determine if the plan is "ERISA" (employer-sponsored) or "Non-ERISA" (individual/marketplace/gov).
- Medical Necessity Flag: Set to true if the denial claims the service is not "medically necessary".
- IME Involved: Set to true if an "Independent Medical Exam" or "Third-party review" is mentioned.
- Date: The date of the denial letter.
- CPT Codes: Any 5-digit medical procedure codes found.
- Summary: A 1-2 sentence plain-English summary of what was denied and why it matters.

If a field is absolutely not found, return an empty string or false for booleans.
Return only valid JSON.

Content to analyze: ${text || ''}`;
}

async function generateStructuredJson(args: {
  prompt: string;
  geminiSchema?: any;
  imageData?: { data: string; mimeType: string };
  openaiModel?: string;
  providerOverride?: 'gemini' | 'openai';
}) {
  const provider = args.providerOverride || activeProvider();
  if (!provider) {
    throw new Error('AI Engine not configured');
  }

  if (provider === 'gemini') {
    try {
      const model = ai!.getGenerativeModel({ model: GEMINI_MODEL });
      const parts: any[] = [{ text: args.prompt }];
      if (args.imageData) {
        parts.push({
          inlineData: {
            data: args.imageData.data,
            mimeType: args.imageData.mimeType,
          },
        });
      }

      const result = await model.generateContent({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          responseMimeType: 'application/json',
          ...(args.geminiSchema ? { responseSchema: args.geminiSchema } : {}),
        },
      });

      return JSON.parse(result.response.text());
    } catch (error) {
      if (canFallbackToOpenAI() && isRetryableGeminiFailure(error)) {
        return generateStructuredJson({ ...args, providerOverride: 'openai' });
      }
      throw error;
    }
  }

  const content: any[] = [{ type: 'text', text: `${args.prompt}\n\nReturn only valid JSON.` }];
  if (args.imageData) {
    content.push({
      type: 'image_url',
      image_url: {
        url: `data:${args.imageData.mimeType};base64,${args.imageData.data}`,
      },
    });
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: args.openaiModel || OPENAI_MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const json = await response.json();
  return JSON.parse(json.choices?.[0]?.message?.content || '{}');
}

export async function extractDenialDataWithAI(text: string, fileData?: { data: string; mimeType: string }) {
  const result = await generateStructuredJson({
    prompt: buildExtractionPrompt(text),
    imageData: fileData,
    geminiSchema: {
      type: SchemaType.OBJECT,
      properties: {
        insurer: { type: SchemaType.STRING },
        planType: { type: SchemaType.STRING },
        procedure: { type: SchemaType.STRING },
        denialReason: { type: SchemaType.STRING },
        denialQuote: { type: SchemaType.STRING },
        appealDeadline: { type: SchemaType.STRING },
        isERISA: { type: SchemaType.STRING },
        medicalNecessityFlag: { type: SchemaType.BOOLEAN },
        imeInvolved: { type: SchemaType.BOOLEAN },
        summary: { type: SchemaType.STRING },
        date: { type: SchemaType.STRING },
        cptCodes: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      },
      required: ['insurer', 'planType', 'procedure', 'denialReason', 'date', 'cptCodes'],
    },
  });

  return normalizeExtractionResult(result as Partial<ExtractionResult>);
}

async function fetchAppealEvidenceContext(denial: Record<string, any>, datasetId: string) {
  const projectId = process.env.BIGQUERY_PROJECT_ID || 'gen-lang-client-0851977632';
  const insurer = String(denial.insurer || '').trim();
  const procedure = String(denial.procedure || '').trim();
  const category = String(denial.denialReason || '').trim();

  const insurerClause = insurer ? `insurer_normalized = '${escapeSqlLiteral(insurer)}'` : 'TRUE';
  const procedureClause = procedure ? `procedure_normalized = '${escapeSqlLiteral(procedure)}'` : 'TRUE';
  const categoryClause = category ? `denial_category = '${escapeSqlLiteral(category)}'` : 'TRUE';

  const [exactMatchResult, insurerProcedureResult, insurerCategoryResult, precedentResult, clusterResult] = await Promise.all([
    runBigQuerySql(`
      SELECT COUNT(*) AS case_count
      FROM \`${projectId}.${datasetId}.v_patterns_clean\`
      WHERE ${insurerClause}
        AND ${procedureClause}
        AND (${categoryClause} OR denial_reason_raw LIKE '%${escapeSqlLiteral(category)}%')
    `),
    runBigQuerySql(`
      SELECT COUNT(*) AS case_count
      FROM \`${projectId}.${datasetId}.v_patterns_clean\`
      WHERE ${insurerClause}
        AND ${procedureClause}
    `),
    runBigQuerySql(`
      SELECT COUNT(*) AS case_count
      FROM \`${projectId}.${datasetId}.v_patterns_clean\`
      WHERE ${insurerClause}
        AND ${categoryClause}
    `),
    runBigQuerySql(`
      SELECT source_label, canonical_url, title, story_excerpt, denial_category, procedure_normalized, insurer_normalized
      FROM \`${projectId}.${datasetId}.v_patterns_clean\`
      WHERE ${insurerClause}
        AND (${procedureClause} OR ${categoryClause})
        AND canonical_url IS NOT NULL
      ORDER BY quality_score DESC, source_published_at DESC
      LIMIT 4
    `),
    runBigQuerySql(`
      SELECT procedure AS procedure_bucket, insurer, denial_category, story_count
      FROM \`${projectId}.${datasetId}.v_procedure_clusters\`
      WHERE insurer = '${escapeSqlLiteral(insurer || 'Unknown')}'
        AND (procedure = '${escapeSqlLiteral(procedure || 'Unknown')}' OR denial_category = '${escapeSqlLiteral(category || 'Unknown')}')
      ORDER BY story_count DESC
      LIMIT 5
    `),
  ]);

  const exactMatches = Number((exactMatchResult.rows?.[0] as any)?.case_count || 0);
  const insurerProcedureMatches = Number((insurerProcedureResult.rows?.[0] as any)?.case_count || 0);
  const insurerCategoryMatches = Number((insurerCategoryResult.rows?.[0] as any)?.case_count || 0);
  const precedents = (precedentResult.rows || []) as Array<Record<string, any>>;
  const clusters = (clusterResult.rows || []) as Array<Record<string, any>>;

  return {
    exactMatches,
    insurerProcedureMatches,
    insurerCategoryMatches,
    benchmarkSummary: insurer
      ? `${insurerProcedureMatches} similar ${insurer} cases match this treatment area in the observatory, including ${exactMatches} that line up closely with this denial framing and ${insurerCategoryMatches} that share the same insurer and denial category.`
      : `${exactMatches} closely matching observatory records and ${insurerCategoryMatches} category matches were found in the observatory.`,
    precedentNotes: [
      ...clusters.slice(0, 3).map((cluster) => `${cluster.insurer} shows ${cluster.story_count} visible cases where ${cluster.procedure_bucket} is tied to ${cluster.denial_category}.`),
      ...precedents.slice(0, 3).map((row) => {
        const excerpt = String(row.story_excerpt || row.title || '').replace(/\s+/g, ' ').trim().slice(0, 180);
        return `${row.source_label}: ${excerpt}${row.canonical_url ? ` (${row.canonical_url})` : ''}`;
      }),
    ].filter(Boolean),
    evidenceChecklist: [
      procedure ? `Attach any order, prescription, or chart note specifically naming ${procedure}.` : null,
      category ? `Quote the insurer's own denial language and directly answer the ${category} basis for denial.` : null,
      denial.medicalNecessityFlag ? 'Include physician support that explains why the service is medically necessary and consistent with standard of care.' : null,
      denial.appealDeadline ? `State the appeal deadline clearly in your packet and note that you are filing within ${denial.appealDeadline}.` : null,
      denial.isERISA === 'ERISA' ? 'Request the full claim file, plan language, and any internal criteria relied on for the denial because this appears to be an ERISA-governed plan.' : null,
    ].filter(Boolean) as string[],
  };
}

export async function generateAppealWithAI(denial: DenialRecord, datasetId = process.env.BIGQUERY_DATASET_ID || 'fight_insurance_denials'): Promise<AppealDraft> {
  const evidenceContext = await fetchAppealEvidenceContext(denial || {}, datasetId);
  const result = await generateStructuredJson({
    prompt: `Generate a professional and persuasive health insurance appeal letter based on this denial story.
Use a firm but respectful tone. Cite "medical necessity" and "standard of care" where appropriate.
This tool is different from a generic AI appeal writer because it has access to our observatory patterns. Use those patterns carefully as anonymized observational evidence, not as legal case citations.

Denial Details:
Insurer: ${denial.insurer}
Procedure: ${denial.procedure}
Reason: ${denial.denialReason}
Denial Quote: ${denial.denialQuote || ''}
Appeal Deadline: ${denial.appealDeadline || ''}
ERISA Status: ${denial.isERISA || 'Unknown'}
Medical Necessity Flag: ${denial.medicalNecessityFlag ? 'Yes' : 'No'}
Patient Narrative: ${denial.narrative}

Observatory Evidence Context:
Benchmark Summary: ${evidenceContext.benchmarkSummary}
Similar exact-framing matches: ${evidenceContext.exactMatches}
Same insurer + treatment matches: ${evidenceContext.insurerProcedureMatches}
Same insurer + denial-category matches: ${evidenceContext.insurerCategoryMatches}
Observed precedent notes:
${evidenceContext.precedentNotes.map((note, index) => `${index + 1}. ${note}`).join('\n')}

Evidence checklist to weave into the draft:
${evidenceContext.evidenceChecklist.map((item, index) => `${index + 1}. ${item}`).join('\n')}

Requirements:
- Write a strong subject line.
- Write a complete appeal letter body.
- Include 3 to 6 key arguments.
- Include a short benchmark summary in plain English explaining what the observatory has seen.
- Include 3 to 5 precedent notes the patient can mention as anonymized pattern evidence.
- Include 3 to 6 evidence checklist items the patient should attach or confirm.
- Do not invent court cases, statutes, or insurer policy documents.
- You may mention anonymized observatory patterns like "we found similar denials involving UnitedHealthcare and fertility treatment" when supported by the context above.

Return the result as JSON.`,
    geminiSchema: {
      type: SchemaType.OBJECT,
      properties: {
        subject: { type: SchemaType.STRING },
        body: { type: SchemaType.STRING },
        keyArguments: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        benchmarkSummary: { type: SchemaType.STRING },
        precedentNotes: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        evidenceChecklist: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      },
      required: ['subject', 'body', 'keyArguments', 'benchmarkSummary', 'precedentNotes', 'evidenceChecklist'],
    },
  });

  return {
    ...result,
    benchmarkSummary: result.benchmarkSummary || evidenceContext.benchmarkSummary,
    precedentNotes: Array.isArray(result.precedentNotes) && result.precedentNotes.length ? result.precedentNotes : evidenceContext.precedentNotes,
    evidenceChecklist: Array.isArray(result.evidenceChecklist) && result.evidenceChecklist.length ? result.evidenceChecklist : evidenceContext.evidenceChecklist,
  } as AppealDraft;
}
