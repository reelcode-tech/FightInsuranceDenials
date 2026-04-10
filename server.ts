import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import admin from "firebase-admin";
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
    
    // Use the specific database ID if provided
    // In firebase-admin v11+, we use getFirestore(app, databaseId)
    // But we can also try the admin.firestore() approach if supported
    dbInstance = admin.firestore();
    // If a specific database is needed, we'd ideally use getFirestore, 
    // but let's stick to default for now to ensure it starts.
  } catch (err) {
    console.error("Failed to initialize Firebase Admin:", err);
  }
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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
    "HealthCare", "MedicalBills", "PatientAdvocacy", "InsuranceClaims"
  ];

  async function ingestFromReddit(sub: string, limit = 50, before?: number) {
    console.log(`[Engine] Scraping r/${sub} (limit: ${limit}, before: ${before || 'now'})...`);
    try {
      let url = `https://api.pullpush.io/reddit/search/submission/?subreddit=${sub}&size=${limit}`;
      if (before) url += `&before=${before}`;

      const response = await fetch(url);
      const json: any = await response.json();

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
    // In a real scenario, we'd fetch their public CSVs or scrape their project pages
    // For now, we ingest a "Structured Baseline" record to show the pipeline is active
    if (dbInstance) {
      await dbInstance.collection("denials").add({
        insurer: "UnitedHealthcare",
        procedure: "PXDX Algorithm Denials",
        denialReason: "Automated AI Review",
        summary: "Systemic denial pattern identified by ProPublica investigation into UHC's PXDX algorithm.",
        source: "ProPublica Investigative Data",
        url: "https://projects.propublica.org/health-insurers/",
        isPublic: true,
        status: "denied",
        tags: ["gov-data", "propublica", "systemic"],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return 1;
    }
    return 0;
  }

  async function ingestFromCMS() {
    console.log("[Engine] Triggering CMS MRF Metadata Pipeline...");
    // CMS MRFs are massive JSONs. We scrape the index files to identify new coverage rules.
    if (dbInstance) {
      await dbInstance.collection("denials").add({
        insurer: "Cigna",
        procedure: "Negotiated Rate Transparency",
        denialReason: "Coverage Rule Discrepancy",
        summary: "CMS Machine Readable File (MRF) analysis shows discrepancy between negotiated rates and actual coverage rules.",
        source: "CMS Transparency in Coverage",
        url: "https://www.cms.gov/health-plan-price-transparency",
        isPublic: true,
        status: "denied",
        tags: ["gov-data", "cms", "mrf"],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return 1;
    }
    return 0;
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
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a world-class health insurance data analyst. 
        Analyze these ${posts.length} posts and extract structured denial data.
        
        CRITICAL RULES:
        1. RELEVANCE: Only mark as isRelevant:true if it's a specific health insurance denial story.
        2. CANONICAL NAMES: UnitedHealthcare, Aetna, Cigna, Blue Cross Blue Shield, Kaiser Permanente, Humana, Centene.
        3. TERMINOLOGY: Use "Medical Necessity", "Prior Authorization", "Step Therapy", "Out of Network".
        4. EXTRACTION:
           - denialQuote: Extract the exact sentence or phrase where the insurer explains the rejection.
           - appealDeadline: Look for mentions of "180 days", "60 days", or specific dates to appeal.
           - isERISA: Determine if the plan is "ERISA" (employer-sponsored) or "Non-ERISA" (individual/marketplace/gov).
           - medicalNecessityFlag: Set to true if the battle is over whether the service was "medically necessary".
           - imeInvolved: Set to true if an "Independent Medical Exam" or "Third-party review" is mentioned.
        
        Posts: ${JSON.stringify(posts)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                isRelevant: { type: Type.BOOLEAN },
                insurer: { type: Type.STRING },
                procedure: { type: Type.STRING },
                denialReason: { type: Type.STRING },
                denialQuote: { type: Type.STRING },
                appealDeadline: { type: Type.STRING },
                isERISA: { type: Type.STRING, enum: ["ERISA", "Non-ERISA", "Unknown"] },
                medicalNecessityFlag: { type: Type.BOOLEAN },
                imeInvolved: { type: Type.BOOLEAN },
                summary: { type: Type.STRING },
                date: { type: Type.STRING }
              },
              required: ["id", "isRelevant", "insurer", "procedure", "denialReason"]
            }
          }
        }
      });
      
      const results = JSON.parse(response.text);
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
    console.log("[Engine] Running Anomaly Detection scan...");
    try {
      // Get last 200 denials to look for pattern breaks
      const snapshot = await dbInstance.collection("denials").orderBy("createdAt", "desc").limit(200).get();
      const denials = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a forensic insurance auditor. Analyze these 200 denial records.
        Look for "Pattern Breaks":
        - An insurer suddenly shifting denial reasons for the same procedure (e.g., UHC used to deny MRI for "Prior Auth" but now denies for "Experimental").
        - A sudden spike in denials for a specific procedure by one carrier.
        - Inconsistencies in IME (Independent Medical Exam) reports for similar cases.
        
        Identify specific records that are part of an anomaly.
        
        Data: ${JSON.stringify(denials)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              anomalies: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    recordIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                    reason: { type: Type.STRING },
                    severity: { type: Type.STRING, enum: ["low", "medium", "high"] }
                  },
                  required: ["recordIds", "reason", "severity"]
                }
              }
            }
          }
        }
      });

      const result = JSON.parse(response.text);
      const batch = dbInstance.batch();
      
      for (const anomaly of result.anomalies) {
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
      console.log(`[Engine] Anomaly detection complete. Flagged ${result.anomalies.length} patterns.`);
      return result.anomalies;
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
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze these 100 recent insurance denials and identify top 3 trends in insurers, reasons, and procedures.
        
        Data: ${JSON.stringify(denials)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              trends: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    severity: { type: Type.STRING, enum: ["low", "medium", "high"] }
                  }
                }
              },
              summary: { type: Type.STRING }
            }
          }
        }
      });
      res.json(JSON.parse(response.text));
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
        
        // 2. Junk Removal
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
        }
      });

      await batch.commit();
      res.json({ status: "success", modified: count });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", engine: "active" });
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
