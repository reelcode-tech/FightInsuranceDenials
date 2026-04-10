import { ExtractionResult, AppealDraft, DenialRecord } from "../types";

export async function extractDenialData(text: string, fileData?: { data: string, mimeType: string }): Promise<ExtractionResult> {
  console.log("🧠 Starting AI extraction via backend...");
  try {
    const response = await fetch("/api/ai/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, fileData })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Extraction failed");
    }

    const result = await response.json();
    console.log("✅ AI Extraction complete:", result);
    return result;
  } catch (error) {
    console.error("❌ AI Extraction failed:", error);
    throw error;
  }
}

export async function generateAppealLetter(denial: DenialRecord): Promise<AppealDraft> {
  console.log("✍️ Generating appeal letter via backend...");
  try {
    const response = await fetch("/api/ai/generate-appeal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ denial })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Appeal generation failed");
    }

    const result = await response.json();
    console.log("✅ Appeal generation complete");
    return result;
  } catch (error) {
    console.error("❌ Appeal generation failed:", error);
    throw error;
  }
}
