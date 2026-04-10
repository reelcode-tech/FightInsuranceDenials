import { GoogleGenAI, Type } from "@google/genai";
import { ExtractionResult, AppealDraft, DenialRecord } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const EXTRACTION_PROMPT = `You are an expert medical billing and insurance specialist. 
Analyze the provided text or image of a health insurance denial letter.
Extract the following details with high precision. 

Guidelines:
- Insurer: The name of the insurance company (e.g., Aetna, Cigna, UnitedHealthcare).
- Plan Type: (e.g., HMO, PPO, Medicare Advantage, Employer-sponsored).
- Procedure: The specific medical service or medication denied.
- Denial Reason: The core reason for rejection (e.g., Not Medically Necessary, Experimental, Out of Network, Missing Prior Auth).
- Denial Quote: The EXACT sentence or phrase from the letter explaining the rejection logic.
- Appeal Deadline: The timeline mentioned for filing an appeal (e.g., "180 days", "60 days").
- isERISA: Determine if the plan is "ERISA" (employer-sponsored) or "Non-ERISA" (individual/marketplace/gov).
- Medical Necessity Flag: Set to true if the denial claims the service is not "medically necessary".
- IME Involved: Set to true if an "Independent Medical Exam" or "Third-party review" is mentioned.
- Date: The date of the denial letter.
- CPT Codes: Any 5-digit medical procedure codes found.

If a field is absolutely not found, return an empty string or false for booleans.
Return only valid JSON.`;

export async function extractDenialData(text: string, fileData?: { data: string, mimeType: string }): Promise<ExtractionResult> {
  console.log("🧠 Starting AI extraction...");
  const parts: any[] = [{ text: EXTRACTION_PROMPT }];
  
  if (fileData) {
    console.log(`📎 Including file data: ${fileData.mimeType}`);
    parts.push({
      inlineData: {
        data: fileData.data,
        mimeType: fileData.mimeType
      }
    });
  }
  
  if (text) {
    console.log("📝 Including text content");
    parts.push({ text: `Content to analyze: ${text}` });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insurer: { type: Type.STRING },
            planType: { type: Type.STRING },
            procedure: { type: Type.STRING },
            denialReason: { type: Type.STRING },
            denialQuote: { type: Type.STRING },
            appealDeadline: { type: Type.STRING },
            isERISA: { type: Type.STRING },
            medicalNecessityFlag: { type: Type.BOOLEAN },
            imeInvolved: { type: Type.BOOLEAN },
            date: { type: Type.STRING },
            cptCodes: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["insurer", "planType", "procedure", "denialReason", "date", "cptCodes"],
        },
      },
    });

    const result = JSON.parse(response.text);
    console.log("✅ AI Extraction complete:", result);
    return result;
  } catch (error) {
    console.error("❌ AI Extraction failed:", error);
    throw error;
  }
}

export async function generateAppealLetter(denial: DenialRecord): Promise<AppealDraft> {
  console.log("✍️ Generating appeal letter...");
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a professional and persuasive health insurance appeal letter based on this denial story.
      Use a firm but respectful tone. Cite "medical necessity" and "standard of care" where appropriate.
      
      Denial Details:
      Insurer: ${denial.insurer}
      Procedure: ${denial.procedure}
      Reason: ${denial.denialReason}
      Patient Narrative: ${denial.narrative}
      
      Return the result as JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            body: { type: Type.STRING },
            keyArguments: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["subject", "body", "keyArguments"],
        },
      },
    });

    const result = JSON.parse(response.text);
    console.log("✅ Appeal generation complete");
    return result;
  } catch (error) {
    console.error("❌ Appeal generation failed:", error);
    throw error;
  }
}
