import { DenialRecord } from "../types";
import { db, handleFirestoreError, OperationType } from "./firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { GoogleGenAI, Type } from "@google/genai";

// Global log store for UI feedback
export let ingestionLogs: string[] = [];
const addLog = (msg: string) => {
  const timestamp = new Date().toLocaleTimeString();
  const formattedMsg = `[${timestamp}] ${msg}`;
  ingestionLogs = [formattedMsg, ...ingestionLogs].slice(0, 50);
  console.log(formattedMsg);
};

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function runIngestionPipeline() {
  addLog("🚀 Triggering Backend Ingestion Engine...");
  
  try {
    const response = await fetch("/api/admin/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    const data = await response.json();
    
    if (data.status === "success") {
      addLog("✅ Backend sync triggered successfully.");
      Object.entries(data.results).forEach(([sub, count]) => {
        if (Number(count) > 0) {
          addLog(`📈 Ingested ${count} new records from r/${sub}`);
        }
      });
    } else {
      addLog(`❌ Backend sync failed: ${data.error}`);
    }
  } catch (e) {
    addLog(`❌ Error triggering backend sync: ${e}`);
  }

  addLog("🏁 Ingestion pipeline complete!");
}

async function processAndSave(item: { source: string, rawData: string, url: string }) {
  try {
    // Check if already ingested
    const q = query(collection(db, "denials"), where("url", "==", item.url));
    const existing = await getDocs(q);
    if (!existing.empty) {
      addLog(`⏭️ Skipping duplicate: ${item.url.substring(0, 30)}...`);
      return;
    }

    addLog(`⚙️ Normalizing: ${item.source}`);
    // Normalize using Gemini directly in frontend
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a data normalization engine for a medical denial observatory.
      Analyze this raw post from ${item.source} and extract structured details.
      IMPORTANT: If any field is unknown, use "Unknown" instead of an empty string.
      
      Raw Data: ${item.rawData}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insurer: { type: Type.STRING },
            planType: { type: Type.STRING },
            procedure: { type: Type.STRING },
            denialReason: { type: Type.STRING },
            date: { type: Type.STRING },
            summary: { type: Type.STRING },
            cptCodes: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["insurer", "procedure", "denialReason"],
        },
      },
    });

    const normalized = JSON.parse(response.text);
    await saveToFirestore(normalized, item.rawData, item.source, item.url);
  } catch (error) {
    addLog(`❌ Failed to process ${item.source}: ${error}`);
  }
}

async function saveDirectly(item: any) {
  try {
    const q = query(collection(db, "denials"), where("url", "==", item.url));
    const existing = await getDocs(q);
    if (!existing.empty) return;

    await saveToFirestore(item, item.rawData, item.source, item.url);
  } catch (error) {
    addLog(`❌ Failed to save direct item: ${error}`);
  }
}

async function saveToFirestore(normalized: any, rawData: string, source: string, url: string) {
  try {
    await addDoc(collection(db, "denials"), {
      ...normalized,
      narrative: rawData,
      status: "denied",
      tags: ["public-scrape", source.replace("r/", "")],
      isPublic: true,
      createdAt: serverTimestamp(),
      source: source,
      url: url
    });
    addLog(`📥 Saved to Firestore: ${source}`);
  } catch (err) {
    addLog(`❌ Firestore save error: ${err}`);
    throw err; // Re-throw to be caught by Promise.allSettled
  }
}
