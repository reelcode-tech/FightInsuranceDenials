import { db, handleFirestoreError, OperationType } from "./firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";

// Global log store for UI feedback
export let ingestionLogs: string[] = [];
const addLog = (msg: string) => {
  const timestamp = new Date().toLocaleTimeString();
  const formattedMsg = `[${timestamp}] ${msg}`;
  ingestionLogs = [formattedMsg, ...ingestionLogs].slice(0, 50);
  console.log(formattedMsg);
};

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
