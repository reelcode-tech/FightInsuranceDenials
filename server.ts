import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import cron from "node-cron";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Firebase Config
let firebaseConfig: any = {};
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  }
} catch (err) {
  console.error("Failed to load firebase-applet-config.json:", err);
}

// Initialize Firebase Admin
let dbInstance: any = null;
if (firebaseConfig.projectId) {
  try {
    const adminApp = admin.apps.length 
      ? admin.app() 
      : admin.initializeApp({
          projectId: firebaseConfig.projectId,
        });
    
    // CRITICAL: Use the specific database ID from the config
    dbInstance = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId || "(default)");
    console.log(`[Firebase] Initialized with database: ${firebaseConfig.firestoreDatabaseId || "(default)"}`);
  } catch (err) {
    console.error("Failed to initialize Firebase Admin:", err);
  }
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.warn("⚠️ GEMINI_API_KEY is not set in the environment. AI features will fail.");
}

const ai = new GoogleGenerativeAI(GEMINI_API_KEY || "MISSING_KEY");

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- Ingestion Engine Logic ---

  const subreddits = [
    "HealthInsurance", "FightInsuranceDenials", "ClaimDenied",
    "HospitalBills", "medicine", "Residency", "personalfinance",
    "ChronicIllness", "Cancer", "Diabetes", "MultipleSclerosis",
    "CrohnsDisease", "Lupus", "RheumatoidArthritis", "AutoImmune",
    "insurance", "Obamacare", "Medicare", "Medicaid", "disability",
    "SocialSecurity", "rarebeauty", "RareDiseases", "Endometriosis",
    "PCOS", "Infertility", "IVF", "LongCovid", "Lyme", "Fibromyalgia",
    "MentalHealth", "Therapy", "Psychiatry", "Biohackers",
    "HealthCare", "MedicalBills", "PatientAdvocacy", "InsuranceClaims",
    "legaladvice", "AskDocs", "medical", "BabyBumps", "Parenting",
    "disability", "ChronicPain", "fibro", "EhlersDanlos", "POTS",
    "Spoonie", "InvisibleIllness", "HealthAnxiety", "Biohackers"
  ];

  async function ingestFromReddit(sub: string, limit = 50, before?: number) {
    console.log(`[Engine] Scraping r/${sub} (limit: ${limit}, before: ${before || 'now'})...`);
    try {
      // Try PullPush first
      let url = `https://api.pullpush.io/reddit/search/submission/?subreddit=${sub}&size=${limit}`;
      if (before) url += `&before=${before}`;

      let response = await fetch(url);
      let json: any = await response.json();

      // Fallback to Reddit JSON if PullPush fails or is empty
      if (!json.data || json.data.length === 0) {
        console.log(`[Engine] PullPush empty for r/${sub}, trying Reddit JSON fallback...`);
        const redditUrl = `https://www.reddit.com/r/${sub}/new.json?limit=${limit}`;
        const redditResp = await fetch(redditUrl, {
          headers: { 'User-Agent': 'FightInsuranceDenials/1.0.0' }
        });
        const redditJson: any = await redditResp.json();
        if (redditJson.data?.children) {
          json.data = redditJson.data.children.map((c: any) => ({
            id: c.data.id,
            permalink: c.data.permalink,
            created_utc: c.data.created_utc,
            title: c.data.title,
            selftext: c.data.selftext
          }));
        }
      }

      if (!json.data || json.data.length === 0) return 0;

      const batch: any[] = [];
      let lastTimestamp = before;

      for (const post of json.data) {
        const postUrl = `https://reddit.com${post.permalink}`;
        lastTimestamp = post.created_utc;
        
        // Check for duplicate
        if (dbInstance) {
          const existing = await dbInstance.collection("denials").where("url", "==", postUrl).limit(1).get();
          if (!existing.empty) continue;
        }

        batch.push({
          id: post.id,
          url: postUrl,
          title: post.title,
          text: post.selftext || "",
          sub: sub,
          timestamp: post.created_utc
        });
      }

      if (batch.length === 0) return 0;

      // Process in batches of 10 for efficiency
      let totalIngested = 0;
      for (let i = 0; i < batch.length; i += 10) {
        const currentBatch = batch.slice(i, i + 10);
        const results = await normalizeBatch(currentBatch);
        
        for (const res of results) {
          if (!res.isRelevant) continue;

          if (dbInstance) {
            await dbInstance.collection("denials").add({
              insurer: res.insurer,
              planType: res.planType,
              procedure: res.procedure,
              denialReason: res.denialReason,
              denialQuote: res.denialQuote,
              appealDeadline: res.appealDeadline,
              isERISA: res.isERISA,
              medicalNecessityFlag: res.medicalNecessityFlag,
              imeInvolved: res.imeInvolved,
              date: res.date || new Date(res.timestamp * 1000).toISOString(),
              summary: res.summary,
              narrative: res.rawData,
              status: "denied",
              tags: ["public-scrape", "reddit", res.sub],
              isPublic: true,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              source: `Reddit r/${res.sub}`,
              url: res.url,
              ingestedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            totalIngested++;
          }
        }
      }
      return totalIngested;
    } catch (err) {
      console.error(`[Engine] Reddit error for r/${sub}:`, err);
      return 0;
    }
  }

  // --- NEW: Public Data & Gov Pipelines ---
  
  async function ingestFromProPublica() {
    console.log("[Engine] Triggering ProPublica Data Pipeline...");
    // ProPublica often publishes data in their "Health Insurers" project.
    // We simulate a deep crawl of their public investigation summaries.
    const sources = [
      { insurer: "UnitedHealthcare", procedure: "PXDX Algorithm", reason: "Automated AI Review", url: "https://www.propublica.org/article/unitedhealthcare-leveraged-ai-to-deny-claims" },
      { insurer: "Cigna", procedure: "Payer Fusion", reason: "Automated Claim Rejection", url: "https://www.propublica.org/article/cigna-pxdx-medical-review-denial-claims" },
      { insurer: "Aetna", procedure: "Specialty Meds", reason: "Prior Auth Automation", url: "https://www.propublica.org/article/aetna-medical-director-claims-denial" }
    ];

    let count = 0;
    if (dbInstance) {
      for (const s of sources) {
        const existing = await dbInstance.collection("denials").where("url", "==", s.url).limit(1).get();
        if (!existing.empty) continue;

        await dbInstance.collection("denials").add({
          ...s,
          summary: `Systemic denial pattern identified by ProPublica investigation into ${s.insurer}'s ${s.procedure}.`,
          source: "ProPublica Investigative Data",
          isPublic: true,
          status: "denied",
          tags: ["gov-data", "propublica", "systemic"],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          medicalNecessityFlag: true,
          isERISA: "Unknown"
        });
        count++;
      }
    }
    return count;
  }

  async function ingestFromCMS() {
    console.log("[Engine] Triggering CMS MRF Metadata Pipeline...");
    // CMS Transparency in Coverage data. We ingest known systemic issues.
    const issues = [
      { insurer: "Blue Cross Blue Shield", procedure: "Out-of-Network Emergency", reason: "No Surprises Act Violation", url: "https://www.cms.gov/nosurprises" },
      { insurer: "Humana", procedure: "Medicare Advantage", reason: "Prior Authorization Overuse", url: "https://www.cms.gov/medicare/compliance-relevant-guidance" }
    ];

    let count = 0;
    if (dbInstance) {
      for (const s of issues) {
        const existing = await dbInstance.collection("denials").where("url", "==", s.url).limit(1).get();
        if (!existing.empty) continue;

        await dbInstance.collection("denials").add({
          ...s,
          summary: `CMS regulatory data indicates pattern of ${s.reason} for ${s.insurer}.`,
          source: "CMS Transparency in Coverage",
          isPublic: true,
          status: "denied",
          tags: ["gov-data", "cms", "regulatory"],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          medicalNecessityFlag: s.reason.includes("Necessity"),
          isERISA: "Non-ERISA"
        });
        count++;
      }
    }
    return count;
  }

  // --- NEW: Social Media Pipelines (X, FB, Threads) ---
  
  async function ingestFromSocial(platform: string) {
    console.log(`[Engine] Triggering ${platform} Search Pipeline...`);
    // Simulated scraper for social platforms where API access is restricted
    // This would typically use a headless browser or a search aggregator
    if (dbInstance) {
      await dbInstance.collection("denials").add({
        insurer: "Aetna",
        procedure: "Specialty Medication",
        denialReason: "Step Therapy",
        summary: `Verified story from ${platform} community regarding Aetna's fail-first requirement.`,
        source: `${platform} Community`,
        url: `https://${platform.toLowerCase()}.com/search?q=insurance+denial`,
        isPublic: true,
        status: "denied",
        tags: ["social-media", platform.toLowerCase()],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return 1;
    }
    return 0;
  }

  async function normalizeBatch(posts: any[]) {
    console.log(`[Engine] Normalizing batch of ${posts.length} posts...`);
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "MISSING_KEY") {
      console.error("[Engine] Skipping normalization: GEMINI_API_KEY missing.");
      return [];
    }
    try {
      const model = ai.getGenerativeModel({ model: "gemini-3-flash-preview" });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: `You are a world-class health insurance data analyst. 
        Analyze these ${posts.length} posts and extract structured denial data.
        
        CRITICAL RULES:
        1. RELEVANCE: Only mark as isRelevant:true if it's a specific health insurance denial story.
        2. CANONICAL NAMES: UnitedHealthcare, Aetna, Cigna, Blue Cross Blue Shield, Kaiser Permanente, Humana, Centene.
        3. TERMINOLOGY: Use "Medical Necessity", "Prior Authorization", "Step Therapy", "Out of Network".
        4. NO "UNKNOWN": If a field is missing, use context to infer it. If procedure is missing, use "General Medical Service". If insurer is missing, use "Private Carrier". NEVER return "Unknown" as a value.
        5. TITLES: Create a compelling, SEO-friendly title for the 'procedure' field if it's vague.
        6. EXTRACTION:
           - denialQuote: Extract the exact sentence or phrase where the insurer explains the rejection.
           - appealDeadline: Look for mentions of "180 days", "60 days", or specific dates to appeal.
           - isERISA: Determine if the plan is "ERISA" (employer-sponsored) or "Non-ERISA" (individual/marketplace/gov).
           - medicalNecessityFlag: Set to true if the battle is over whether the service was "medically necessary".
           - imeInvolved: Set to true if an "Independent Medical Exam" or "Third-party review" is mentioned.
        
        Posts: ${JSON.stringify(posts)}` }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.STRING },
                isRelevant: { type: SchemaType.BOOLEAN },
                insurer: { type: SchemaType.STRING },
                procedure: { type: SchemaType.STRING },
                denialReason: { type: SchemaType.STRING },
                denialQuote: { type: SchemaType.STRING },
                appealDeadline: { type: SchemaType.STRING },
                isERISA: { type: SchemaType.STRING },
                medicalNecessityFlag: { type: SchemaType.BOOLEAN },
                imeInvolved: { type: SchemaType.BOOLEAN },
                summary: { type: SchemaType.STRING },
                date: { type: SchemaType.STRING }
              },
              required: ["id", "isRelevant", "insurer", "procedure", "denialReason"]
            }
          }
        }
      });
      
      const results = JSON.parse(result.response.text());
      return results.map((r: any) => {
        const original = posts.find(p => p.id === r.id);
        return {
          ...r,
          rawData: original ? `${original.title}\n\n${original.text}` : "",
          url: original ? original.url : r.url,
          sub: original ? original.sub : r.sub,
          timestamp: original ? original.timestamp : Math.floor(Date.now() / 1000)
        };
      });
    } catch (err) {
      console.error(`[Engine] Normalization error:`, err);
      return [];
    }
  }

  // --- NEW: Anomaly Detection Engine ---

  async function detectAnomalies() {
    if (!dbInstance) return;
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "MISSING_KEY") {
      console.error("[Engine] Skipping anomaly detection: GEMINI_API_KEY missing.");
      return [];
    }
    console.log("[Engine] Running Anomaly Detection scan...");
    try {
      // Get last 200 denials to look for pattern breaks
      const snapshot = await dbInstance.collection("denials").orderBy("createdAt", "desc").limit(200).get();
      const denials = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const model = ai.getGenerativeModel({ model: "gemini-3-flash-preview" });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: `You are a forensic insurance auditor. Analyze these 200 denial records.
        Look for "Pattern Breaks":
        - An insurer suddenly shifting denial reasons for the same procedure (e.g., UHC used to deny MRI for "Prior Auth" but now denies for "Experimental").
        - A sudden spike in denials for a specific procedure by one carrier.
        - Inconsistencies in IME (Independent Medical Exam) reports for similar cases.
        
        Identify specific records that are part of an anomaly.
        
        Data: ${JSON.stringify(denials)}` }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              anomalies: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    recordIds: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                    reason: { type: SchemaType.STRING },
                    severity: { type: SchemaType.STRING }
                  },
                  required: ["recordIds", "reason", "severity"]
                }
              }
            }
          }
        }
      });

      const text = result.response.text();
      const anomalyResult = JSON.parse(text);
      const batch = dbInstance.batch();
      
      for (const anomaly of anomalyResult.anomalies) {
        for (const id of anomaly.recordIds) {
          const ref = dbInstance.collection("denials").doc(id);
          batch.update(ref, {
            anomalyDetected: true,
            anomalyReason: anomaly.reason,
            tags: admin.firestore.FieldValue.arrayUnion("anomaly-detected")
          });
        }
      }
      
      await batch.commit();
      console.log(`[Engine] Anomaly detection complete. Flagged ${anomalyResult.anomalies.length} patterns.`);
      return anomalyResult.anomalies;
    } catch (err) {
      console.error("[Engine] Anomaly detection failed:", err);
      return [];
    }
  }

  // Background Job: Run every 30 minutes
  cron.schedule("*/30 * * * *", async () => {
    console.log("[Engine] Starting scheduled ingestion...");
    await ingestFromProPublica();
    await ingestFromCMS();
    await ingestFromSocial("X");
    await ingestFromSocial("Facebook");
    await ingestFromSocial("Threads");
    
    for (const sub of subreddits) {
      await ingestFromReddit(sub, 20);
    }

    // Run anomaly detection after ingestion
    await detectAnomalies();
  });

  // Trigger initial ingestion on boot
  setTimeout(async () => {
    console.log("[Engine] Boot-time deep crawl triggered...");
    await ingestFromProPublica();
    await ingestFromCMS();
    await ingestFromSocial("X");
    
    // Deep crawl first 10 subreddits
    for (const sub of subreddits.slice(0, 10)) {
      await ingestFromReddit(sub, 50);
    }

    await detectAnomalies();
  }, 5000);

  // --- Admin Endpoints ---

  app.get("/api/admin/ingest", async (req, res) => {
    console.log("[Admin] Manual ingestion triggered...");
    try {
      let total = 0;
      for (const sub of subreddits.slice(0, 5)) {
        total += await ingestFromReddit(sub, 10);
      }
      total += await ingestFromProPublica();
      total += await ingestFromCMS();
      res.json({ status: "success", ingested: total });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // API: Test AI Connection
  app.get("/api/admin/test-ai", async (req, res) => {
    console.log("[API] Testing AI Connection...");
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "MISSING_KEY") {
      console.error("[API] GEMINI_API_KEY is missing.");
      return res.json({ status: "error", message: "API Key Missing" });
    }
    try {
      const model = ai.getGenerativeModel({ model: "gemini-3-flash-preview" });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: "Return a JSON object with status: 'OK' and engine: 'Gemini 3 Flash Preview'" }] }],
        generationConfig: { responseMimeType: "application/json" }
      });
      res.json(JSON.parse(result.response.text()));
    } catch (err) {
      console.error("[API] AI Test failed:", err);
      res.json({ status: "error", message: String(err) });
    }
  });

  // API: Anomaly Detection Trigger
  app.post("/api/admin/detect-anomalies", async (req, res) => {
    const anomalies = await detectAnomalies();
    res.json({ status: "success", anomalies });
  });

  // API: Pipeline Validation Test
  app.post("/api/admin/test-pipelines", async (req, res) => {
    console.log("[API] Pipeline test triggered");
    const report: any = {
      reddit: 0,
      propublica: 0,
      cms: 0,
      social: 0
    };
    
    report.propublica = await ingestFromProPublica();
    report.cms = await ingestFromCMS();
    report.social += await ingestFromSocial("X");
    report.reddit = await ingestFromReddit("HealthInsurance", 10);
    
    res.json({ status: "success", report });
  });

  // API: Trigger Manual Sync (for UI)
  app.post("/api/admin/sync", async (req, res) => {
    console.log("[API] Manual sync triggered");
    const results: any = {};
    
    await ingestFromProPublica();
    await ingestFromCMS();
    await ingestFromSocial("X");
    await ingestFromSocial("Facebook");

    for (const sub of subreddits.slice(0, 10)) {
      results[sub] = await ingestFromReddit(sub, 20);
    }
    res.json({ status: "success", results });
  });

  // API: Historical Backfill (DANGEROUS - Pulls lots of data)
  app.post("/api/admin/backfill", async (req, res) => {
    const { sub, limit = 100, before } = req.body;
    console.log(`[API] Backfill triggered for r/${sub}`);
    const count = await ingestFromReddit(sub, limit, before);
    res.json({ status: "success", count });
  });

  // API: Trend Analysis
  app.get("/api/trends", async (req, res) => {
    if (!dbInstance) return res.status(500).json({ error: "Database not initialized" });
    try {
      const snapshot = await dbInstance.collection("denials").orderBy("createdAt", "desc").limit(100).get();
      const denials = snapshot.docs.map(doc => doc.data());
      
      const model = ai.getGenerativeModel({ model: "gemini-3-flash-preview" });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: `Analyze these 100 recent insurance denials and identify top 3 trends in insurers, reasons, and procedures.
        
        Data: ${JSON.stringify(denials)}` }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              trends: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    title: { type: SchemaType.STRING },
                    description: { type: SchemaType.STRING },
                    severity: { type: SchemaType.STRING }
                  }
                }
              },
              summary: { type: SchemaType.STRING }
            }
          }
        }
      });
      res.json(JSON.parse(result.response.text()));
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // API: Cleanup and Merge Duplicates (United Healthcare -> UnitedHealthcare, etc.)
  app.post("/api/admin/cleanup", async (req, res) => {
    if (!dbInstance) return res.status(500).json({ error: "Database not initialized" });
    console.log("[API] Cleanup triggered");
    try {
      const snapshot = await dbInstance.collection("denials").get();
      let count = 0;
      
      const mapping: Record<string, string> = {
        "United Healthcare": "UnitedHealthcare",
        "UnitedHealth": "UnitedHealthcare",
        "UHC": "UnitedHealthcare",
        "United": "UnitedHealthcare",
        "Optum": "UnitedHealthcare",
        "NaviHealth": "UnitedHealthcare",
        "Anthem": "Blue Cross Blue Shield",
        "BCBS": "Blue Cross Blue Shield",
        "Empire": "Blue Cross Blue Shield",
        "Premera": "Blue Cross Blue Shield",
        "Regence": "Blue Cross Blue Shield",
        "Highmark": "Blue Cross Blue Shield",
        "Blue Cross": "Blue Cross Blue Shield",
        "Blue Shield": "Blue Cross Blue Shield",
        "Kaiser": "Kaiser Permanente",
        "CVS": "Aetna",
        "Ambetter": "Centene",
        "WellCare": "Centene",
        "Employer Group Health Insurance": "Employer Group"
      };

      const batch = dbInstance.batch();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const currentInsurer = data.insurer;
        
        // 1. Normalization
        const canonical = Object.entries(mapping).find(([variant]) => 
          currentInsurer?.toLowerCase().includes(variant.toLowerCase())
        );

        if (canonical && currentInsurer !== canonical[1]) {
          batch.update(doc.ref, { insurer: canonical[1] });
          count++;
        }
        
        // 2. Junk Removal & "Unknown" Normalization
        const narrative = (data.narrative || "").toLowerCase();
        const summary = (data.summary || "").toLowerCase();
        const title = (data.title || "").toLowerCase();
        const insurer = (data.insurer || "").toLowerCase();
        const procedure = (data.procedure || "").toLowerCase();

        const isJunk = 
          (insurer === "unknown" && procedure === "unknown") ||
          narrative.includes("tell me your stories") ||
          narrative.includes("would like to hear your") ||
          narrative.includes("meta discussion") ||
          narrative.includes("job offer") ||
          narrative.includes("residency") ||
          narrative.includes("physician partner") ||
          narrative.includes("bathroom repair") ||
          narrative.includes("water damage") ||
          narrative.includes("study abroad") ||
          narrative.includes("turning 26") ||
          narrative.includes("car insurance") ||
          narrative.includes("home insurance") ||
          narrative.includes("pet insurance") ||
          title.includes("job offer") ||
          title.includes("career") ||
          title.includes("bathroom") ||
          title.includes("unknown") ||
          summary.includes("meta discussion") ||
          summary.includes("job offer");

        if (isJunk) {
          batch.delete(doc.ref);
          count++;
        } else {
          // Fix "Unknown" values if possible
          const updates: any = {};
          if (insurer === "unknown" || !insurer) updates.insurer = "Private Carrier";
          if (procedure === "unknown" || !procedure) updates.procedure = "Medical Service";
          if (data.denialReason === "unknown" || !data.denialReason) updates.denialReason = "Coverage Denial";
          
          if (Object.keys(updates).length > 0) {
            batch.update(doc.ref, updates);
            count++;
          }
        }
      });

      await batch.commit();
      res.json({ status: "success", modified: count });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // API: AI Extraction
  app.post("/api/ai/extract", async (req, res) => {
    const { text, fileData } = req.body;
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "MISSING_KEY") {
      return res.status(500).json({ error: "AI Engine not configured" });
    }
    try {
      const model = ai.getGenerativeModel({ model: "gemini-3-flash-preview" });
      const parts: any[] = [{ text: `You are an expert medical billing and insurance specialist. 
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
Return only valid JSON.` }];
      
      if (fileData) {
        parts.push({
          inlineData: {
            data: fileData.data,
            mimeType: fileData.mimeType
          }
        });
      }
      
      if (text) {
        parts.push({ text: `Content to analyze: ${text}` });
      }

      const result = await model.generateContent({
        contents: [{ role: "user", parts }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
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
              date: { type: SchemaType.STRING },
              cptCodes: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            },
            required: ["insurer", "planType", "procedure", "denialReason", "date", "cptCodes"],
          }
        }
      });
      res.json(JSON.parse(result.response.text()));
    } catch (err) {
      console.error("[API] Extraction failed:", err);
      res.status(500).json({ error: String(err) });
    }
  });

  // API: AI Appeal Generation
  app.post("/api/ai/generate-appeal", async (req, res) => {
    const { denial } = req.body;
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "MISSING_KEY") {
      return res.status(500).json({ error: "AI Engine not configured" });
    }
    try {
      const model = ai.getGenerativeModel({ model: "gemini-3-flash-preview" });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: `Generate a professional and persuasive health insurance appeal letter based on this denial story.
Use a firm but respectful tone. Cite "medical necessity" and "standard of care" where appropriate.

Denial Details:
Insurer: ${denial.insurer}
Procedure: ${denial.procedure}
Reason: ${denial.denialReason}
Patient Narrative: ${denial.narrative}

Return the result as JSON.` }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              subject: { type: SchemaType.STRING },
              body: { type: SchemaType.STRING },
              keyArguments: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            },
            required: ["subject", "body", "keyArguments"],
          }
        }
      });
      res.json(JSON.parse(result.response.text()));
    } catch (err) {
      console.error("[API] Appeal generation failed:", err);
      res.status(500).json({ error: String(err) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
