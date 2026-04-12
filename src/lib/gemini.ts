import { ExtractionResult, AppealDraft, DenialRecord } from "../types";

async function readJsonOrTextError(response: Response, fallback: string) {
  const rawError = await response.text();
  try {
    const errorData = JSON.parse(rawError);
    return errorData.error || fallback;
  } catch {
    return rawError || fallback;
  }
}

export async function extractDenialData(text: string, fileData?: { data: string, mimeType: string }): Promise<ExtractionResult> {
  try {
    const response = await fetch("/api/ai/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, fileData })
    });
    
    if (!response.ok) {
      throw new Error(await readJsonOrTextError(response, "Extraction failed"));
    }

    return await response.json();
  } catch (error) {
    console.error("AI Extraction failed:", error);
    throw error;
  }
}

export async function generateAppealLetter(denial: DenialRecord): Promise<AppealDraft> {
  try {
    const response = await fetch("/api/ai/generate-appeal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ denial })
    });

    if (!response.ok) {
      throw new Error(await readJsonOrTextError(response, "Appeal generation failed"));
    }

    return await response.json();
  } catch (error) {
    console.error("Appeal generation failed:", error);
    throw error;
  }
}
