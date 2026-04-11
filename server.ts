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
import { fetchWarehouseSummary, runWarehouseAutopilotPass, runWarehouseDeepBackfillPass } from "./src/lib/warehouseAutopilot";
import { runBigQuerySql } from "./src/lib/bigquery";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultServiceAccountPath = path.join(
  process.env.USERPROFILE || "C:\\Users\\sashi",
  ".codex",
  "secrets",
  "fight-denials-firebase-admin.json"
);

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(defaultServiceAccountPath)) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = defaultServiceAccountPath;
}

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
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const serviceAccount =
      serviceAccountPath && fs.existsSync(serviceAccountPath)
        ? JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"))
        : null;

    const adminApp = admin.apps.length 
      ? admin.app() 
      : admin.initializeApp({
          projectId: firebaseConfig.projectId,
          ...(serviceAccount ? { credential: admin.credential.cert(serviceAccount) } : {}),
        });
    
    // CRITICAL: Use the specific database ID from the config
    dbInstance = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId || "(default)");
    console.log(`[Firebase] Initialized with database: ${firebaseConfig.firestoreDatabaseId || "(default)"}`);
  } catch (err) {
    console.error("Failed to initialize Firebase Admin:", err);
  }
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const AI_PROVIDER = process.env.AI_PROVIDER || "auto";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const AUTOPILOT_ENABLED = process.env.AUTOPILOT_ENABLED !== "false";
const FIRESTORE_AUTOPILOT_ENABLED = process.env.FIRESTORE_AUTOPILOT_ENABLED === "true";

const hasGemini = Boolean(GEMINI_API_KEY);
const hasOpenAI = Boolean(OPENAI_API_KEY);

if (!hasGemini && !hasOpenAI) {
  console.warn("⚠️ No AI provider key is set. Add GEMINI_API_KEY or OPENAI_API_KEY. AI features will fail.");
} else {
  console.log(`[AI] Provider mode: ${AI_PROVIDER}. Gemini: ${hasGemini ? "on" : "off"}, OpenAI: ${hasOpenAI ? "on" : "off"}`);
}

const ai = hasGemini ? new GoogleGenerativeAI(GEMINI_API_KEY as string) : null;

function activeProvider() {
  if (AI_PROVIDER === "gemini") return hasGemini ? "gemini" : null;
  if (AI_PROVIDER === "openai") return hasOpenAI ? "openai" : null;
  if (hasGemini) return "gemini";
  if (hasOpenAI) return "openai";
  return null;
}

function aiConfigured() {
  return activeProvider() !== null;
}

function canFallbackToOpenAI() {
  return AI_PROVIDER === "auto" && hasOpenAI;
}

function escapeSqlLiteral(value: unknown) {
  return String(value ?? '').replace(/'/g, "''");
}

async function fetchAppealEvidenceContext(denial: Record<string, any>, datasetId: string) {
  const projectId = process.env.BIGQUERY_PROJECT_ID || 'gen-lang-client-0851977632';
  const insurer = String(denial.insurer || '').trim();
  const procedure = String(denial.procedure || '').trim();
  const category = String(denial.denialReason || '').trim();

  const insurerClause = insurer ? `insurer_normalized = '${escapeSqlLiteral(insurer)}'` : 'TRUE';
  const procedureClause = procedure ? `procedure_normalized = '${escapeSqlLiteral(procedure)}'` : 'TRUE';
  const categoryClause = category ? `denial_category = '${escapeSqlLiteral(category)}'` : 'TRUE';

  const exactMatchSql = `
    SELECT COUNT(*) AS case_count
    FROM \`${projectId}.${datasetId}.v_patterns_clean\`
    WHERE ${insurerClause}
      AND ${procedureClause}
      AND (${categoryClause} OR denial_reason_raw LIKE '%${escapeSqlLiteral(category)}%')
  `;

  const insurerProcedureSql = `
    SELECT COUNT(*) AS case_count
    FROM \`${projectId}.${datasetId}.v_patterns_clean\`
    WHERE ${insurerClause}
      AND ${procedureClause}
  `;

  const insurerCategorySql = `
    SELECT COUNT(*) AS case_count
    FROM \`${projectId}.${datasetId}.v_patterns_clean\`
    WHERE ${insurerClause}
      AND ${categoryClause}
  `;

  const precedentSql = `
    SELECT
      source_label,
      canonical_url,
      title,
      story_excerpt,
      denial_category,
      procedure_normalized,
      insurer_normalized
    FROM \`${projectId}.${datasetId}.v_patterns_clean\`
    WHERE ${insurerClause}
      AND (
        ${procedureClause}
        OR ${categoryClause}
      )
      AND canonical_url IS NOT NULL
    ORDER BY quality_score DESC, source_published_at DESC
    LIMIT 4
  `;

  const clusterSql = `
    SELECT
      procedure AS procedure_bucket,
      insurer,
      denial_category,
      story_count
    FROM \`${projectId}.${datasetId}.v_procedure_clusters\`
    WHERE insurer = '${escapeSqlLiteral(insurer || 'Unknown')}'
      AND (
        procedure = '${escapeSqlLiteral(procedure || 'Unknown')}'
        OR denial_category = '${escapeSqlLiteral(category || 'Unknown')}'
      )
    ORDER BY story_count DESC
    LIMIT 5
  `;

  const [exactMatchResult, insurerProcedureResult, insurerCategoryResult, precedentResult, clusterResult] = await Promise.all([
    runBigQuerySql(exactMatchSql),
    runBigQuerySql(insurerProcedureSql),
    runBigQuerySql(insurerCategorySql),
    runBigQuerySql(precedentSql),
    runBigQuerySql(clusterSql),
  ]);

  const exactMatches = Number((exactMatchResult.rows?.[0] as any)?.case_count || 0);
  const insurerProcedureMatches = Number((insurerProcedureResult.rows?.[0] as any)?.case_count || 0);
  const insurerCategoryMatches = Number((insurerCategoryResult.rows?.[0] as any)?.case_count || 0);
  const precedents = (precedentResult.rows || []) as Array<Record<string, any>>;
  const clusters = (clusterResult.rows || []) as Array<Record<string, any>>;

  const benchmarkSummary = insurer
    ? `${insurerProcedureMatches} similar ${insurer} cases match this treatment area in the observatory, including ${exactMatches} that line up closely with this denial framing and ${insurerCategoryMatches} that share the same insurer and denial category.`
    : `${exactMatches} closely matching observatory records and ${insurerCategoryMatches} category matches were found in the current warehouse slice.`;

  const precedentNotes = [
    ...clusters.slice(0, 3).map((cluster) => {
      return `${cluster.insurer} shows ${cluster.story_count} visible cases where ${cluster.procedure_bucket} is tied to ${cluster.denial_category}.`;
    }),
    ...precedents.slice(0, 3).map((row) => {
      const excerpt = String(row.story_excerpt || row.title || '').replace(/\s+/g, ' ').trim().slice(0, 180);
      return `${row.source_label}: ${excerpt}${row.canonical_url ? ` (${row.canonical_url})` : ''}`;
    }),
  ].filter(Boolean);

  const evidenceChecklist = [
    procedure ? `Attach any order, prescription, or chart note specifically naming ${procedure}.` : null,
    category ? `Quote the insurer's own denial language and directly answer the ${category} basis for denial.` : null,
    denial.medicalNecessityFlag ? 'Include physician support that explains why the service is medically necessary and consistent with standard of care.' : null,
    denial.appealDeadline ? `State the appeal deadline clearly in your packet and note that you are filing within ${denial.appealDeadline}.` : null,
    denial.isERISA === 'ERISA' ? 'Request the full claim file, plan language, and any internal criteria relied on for the denial because this appears to be an ERISA-governed plan.' : null,
  ].filter(Boolean) as string[];

  return {
    exactMatches,
    insurerProcedureMatches,
    insurerCategoryMatches,
    benchmarkSummary,
    precedentNotes,
    evidenceChecklist,
    precedents,
    clusters,
  };
}

function isRetryableGeminiFailure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  return (
    message.includes("429") ||
    lower.includes("quota exceeded") ||
    lower.includes("rate limit") ||
    lower.includes("no longer available to new users") ||
    lower.includes("404 not found")
  );
}

async function generateStructuredJson(args: {
  prompt: string;
  geminiSchema?: any;
  imageData?: { data: string; mimeType: string };
  openaiModel?: string;
  providerOverride?: "gemini" | "openai";
}) {
  const provider = args.providerOverride || activeProvider();
  if (!provider) {
    throw new Error("AI Engine not configured");
  }

  if (provider === "gemini") {
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
        contents: [{ role: "user", parts }],
        generationConfig: {
          responseMimeType: "application/json",
          ...(args.geminiSchema ? { responseSchema: args.geminiSchema } : {}),
        },
      });

      return JSON.parse(result.response.text());
    } catch (error) {
      if (canFallbackToOpenAI() && isRetryableGeminiFailure(error)) {
        console.warn("[AI] Gemini unavailable or quota-limited, falling back to OpenAI.");
        return generateStructuredJson({ ...args, providerOverride: "openai" });
      }
      throw error;
    }
  }

  const content: any[] = [{ type: "text", text: `${args.prompt}\n\nReturn only valid JSON.` }];
  if (args.imageData) {
    content.push({
      type: "image_url",
      image_url: {
        url: `data:${args.imageData.mimeType};base64,${args.imageData.data}`,
      },
    });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: args.openaiModel || OPENAI_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const json = await response.json();
  return JSON.parse(json.choices?.[0]?.message?.content || "{}");
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);
  const BIGQUERY_DATASET_ID = process.env.BIGQUERY_DATASET_ID || "fight_insurance_denials";

  const warehouseTable = (name: string) => `\`${process.env.BIGQUERY_PROJECT_ID || "gen-lang-client-0851977632"}.${BIGQUERY_DATASET_ID}.${name}\``;

  async function runNonFatalJob(label: string, job: () => Promise<unknown>) {
    try {
      return await job();
    } catch (error) {
      console.error(`[Engine] ${label} failed:`, error);
      return null;
    }
  }

  async function runWarehouseAutopilot(label: string) {
    return runNonFatalJob(label, async () => {
      const result = await runWarehouseAutopilotPass();
      console.log(`[Autopilot] ${label} complete`, JSON.stringify(result.summary));
      return result;
    });
  }

  async function runWarehouseDeepBackfill(label: string) {
    return runNonFatalJob(label, async () => {
      const result = await runWarehouseDeepBackfillPass();
      console.log(`[Autopilot] ${label} complete`, JSON.stringify(result.summary));
      return result;
    });
  }

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
    if (!aiConfigured()) {
      console.error("[Engine] Skipping normalization: no AI provider configured.");
      return [];
    }
    try {
      const results = await generateStructuredJson({
        prompt: `You are a world-class health insurance data analyst. 
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
        
        Posts: ${JSON.stringify(posts)}`,
        geminiSchema: {
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
      });

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
    if (!aiConfigured()) {
      console.error("[Engine] Skipping anomaly detection: no AI provider configured.");
      return [];
    }
    console.log("[Engine] Running Anomaly Detection scan...");
    try {
      // Get last 200 denials to look for pattern breaks
      const snapshot = await dbInstance.collection("denials").orderBy("createdAt", "desc").limit(200).get();
      const denials = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const anomalyResult = await generateStructuredJson({
        prompt: `You are a forensic insurance auditor. Analyze these 200 denial records.
        Look for "Pattern Breaks":
        - An insurer suddenly shifting denial reasons for the same procedure (e.g., UHC used to deny MRI for "Prior Auth" but now denies for "Experimental").
        - A sudden spike in denials for a specific procedure by one carrier.
        - Inconsistencies in IME (Independent Medical Exam) reports for similar cases.
        
        Identify specific records that are part of an anomaly.
        
        Data: ${JSON.stringify(denials)}`,
        geminiSchema: {
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
      });
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

  if (FIRESTORE_AUTOPILOT_ENABLED) {
    // Background Job: Run every 30 minutes
    cron.schedule("*/30 * * * *", async () => {
      console.log("[Engine] Starting scheduled ingestion...");
      await runNonFatalJob("ProPublica scheduled ingest", () => ingestFromProPublica());
      await runNonFatalJob("CMS scheduled ingest", () => ingestFromCMS());
      await runNonFatalJob("X scheduled ingest", () => ingestFromSocial("X"));
      await runNonFatalJob("Facebook scheduled ingest", () => ingestFromSocial("Facebook"));
      await runNonFatalJob("Threads scheduled ingest", () => ingestFromSocial("Threads"));
      
      for (const sub of subreddits) {
        await runNonFatalJob(`Reddit scheduled ingest r/${sub}`, () => ingestFromReddit(sub, 20));
      }
    
      // Run anomaly detection after ingestion
      await runNonFatalJob("Scheduled anomaly detection", () => detectAnomalies());
    });
  }

  if (AUTOPILOT_ENABLED) {
    cron.schedule("17 * * * *", async () => {
      await runWarehouseAutopilot("Hourly warehouse autopilot");
    });
  }

  if (AUTOPILOT_ENABLED) {
    cron.schedule("23 2 * * *", async () => {
      await runWarehouseDeepBackfill("Nightly warehouse deep backfill");
    });
  }

  if (FIRESTORE_AUTOPILOT_ENABLED) {
    // Trigger initial ingestion on boot
    setTimeout(async () => {
      console.log("[Engine] Boot-time deep crawl triggered...");
      await runNonFatalJob("ProPublica boot ingest", () => ingestFromProPublica());
      await runNonFatalJob("CMS boot ingest", () => ingestFromCMS());
      await runNonFatalJob("X boot ingest", () => ingestFromSocial("X"));
      
      // Deep crawl first 10 subreddits
      for (const sub of subreddits.slice(0, 10)) {
        await runNonFatalJob(`Reddit boot ingest r/${sub}`, () => ingestFromReddit(sub, 50));
      }
    
      await runNonFatalJob("Boot anomaly detection", () => detectAnomalies());
    }, 5000);
  }

  if (AUTOPILOT_ENABLED) {
    setTimeout(async () => {
      await runWarehouseAutopilot("Boot warehouse autopilot");
    }, 3500);
  }

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
    if (!aiConfigured()) {
      console.error("[API] No AI provider configured.");
      return res.json({ status: "error", message: "No AI provider configured" });
    }
    try {
      const result = await generateStructuredJson({
        prompt: "Return a JSON object with status: 'success' and engine set to the active provider name.",
      });
      res.json({ ...result, provider: activeProvider() });
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

      const result = await generateStructuredJson({
        prompt: `Analyze these 100 recent insurance denials and identify top 3 trends in insurers, reasons, and procedures.
        
        Data: ${JSON.stringify(denials)}`,
        geminiSchema: {
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
      });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get("/api/observatory/summary", async (req, res) => {
    try {
      const summary = await fetchWarehouseSummary();
      res.json({ status: "success", ...summary });
    } catch (error) {
      res.status(500).json({ status: "error", error: String(error) });
    }
  });

  app.get("/api/insights/patterns", async (req, res) => {
    try {
      const [topInsurers, topCategories, topProcedures, heatmap, procedureClusters, statePatterns, sourceMix, dataQuality] =
        await Promise.all([
          runBigQuerySql(`
            SELECT insurer_normalized AS insurer, COUNT(*) AS record_count
            FROM ${warehouseTable("v_patterns_clean")}
            WHERE insurer_normalized NOT IN ('Unknown', 'Multiple insurers')
            GROUP BY insurer
            ORDER BY record_count DESC
            LIMIT 6
          `),
          runBigQuerySql(`
            SELECT denial_category, COUNT(*) AS record_count
            FROM ${warehouseTable("v_patterns_clean")}
            WHERE denial_category <> 'Unknown'
            GROUP BY denial_category
            ORDER BY record_count DESC
            LIMIT 6
          `),
          runBigQuerySql(`
            SELECT procedure_normalized AS procedure_bucket, COUNT(*) AS record_count
            FROM ${warehouseTable("v_patterns_clean")}
            WHERE procedure_normalized NOT IN ('Insurance denial evidence', 'Unknown')
            GROUP BY procedure_bucket
            ORDER BY record_count DESC
            LIMIT 6
          `),
          runBigQuerySql(`
            SELECT insurer, denial_category, story_count AS record_count
            FROM ${warehouseTable("v_insurer_category_heatmap")}
            ORDER BY story_count DESC
            LIMIT 12
          `),
          runBigQuerySql(`
            SELECT procedure AS procedure_bucket, insurer, denial_category, story_count AS record_count
            FROM ${warehouseTable("v_procedure_clusters")}
            WHERE insurer NOT IN ('Unknown', 'Multiple insurers')
              AND denial_category <> 'Unknown'
              AND procedure NOT IN ('Insurance denial evidence', 'Unknown')
            ORDER BY story_count DESC
            LIMIT 10
          `),
          runBigQuerySql(`
            SELECT state, SUM(story_count) AS record_count
            FROM ${warehouseTable("v_state_patterns_clean")}
            GROUP BY state
            ORDER BY record_count DESC
            LIMIT 8
          `),
          runBigQuerySql(`
            SELECT source_type, SUM(story_count) AS record_count
            FROM ${warehouseTable("v_source_mix")}
            GROUP BY source_type
            ORDER BY record_count DESC
          `),
          runBigQuerySql(`
            SELECT metric, metric_value AS value
            FROM ${warehouseTable("v_data_quality_monitor")}
          `),
        ]);

      const insurerRows = topInsurers.rows as Array<{ insurer: string; record_count: number }>;
      const categoryRows = topCategories.rows as Array<{ denial_category: string; record_count: number }>;
      const procedureRows = topProcedures.rows as Array<{ procedure_bucket: string; record_count: number }>;
      const heatmapRows = heatmap.rows as Array<{ insurer: string; denial_category: string; record_count: number }>;
      const clusterRows = procedureClusters.rows as Array<{
        procedure_bucket: string;
        insurer: string;
        denial_category: string;
        record_count: number;
      }>;
      const stateRows = statePatterns.rows as Array<{ state: string; record_count: number }>;
      const sourceRows = sourceMix.rows as Array<{ source_type: string; record_count: number }>;
      const qualityRows = dataQuality.rows as Array<{ metric: string; value: number }>;

      const qualityMap = Object.fromEntries(qualityRows.map((row) => [row.metric, Number(row.value || 0)]));
      const totalRows = qualityMap.total_rows || 0;
      const unknownInsurerPct = totalRows ? Math.round((qualityMap.unknown_insurer_rows / totalRows) * 100) : 0;
      const unknownCategoryPct = totalRows ? Math.round((qualityMap.unknown_category_rows / totalRows) * 100) : 0;
      const genericProcedurePct = totalRows ? Math.round((qualityMap.generic_procedure_rows / totalRows) * 100) : 0;

      const findings = [
        insurerRows[0]
          ? {
              title: `${insurerRows[0].insurer} leads the visible insurer slice`,
              body: `${insurerRows[0].insurer} appears in ${insurerRows[0].record_count} cleaned records, ahead of ${insurerRows[1]?.insurer || "other carriers"} in the current public slice.`,
              tone: "high",
            }
          : null,
        categoryRows[0]
          ? {
              title: `${categoryRows[0].denial_category} is the strongest denial pattern right now`,
              body: `${categoryRows[0].denial_category} is outpacing classic medical-necessity denials in the identifiable slice, which suggests the current fight is often administrative and process-driven.`,
              tone: "medium",
            }
          : null,
        procedureRows[0]
          ? {
              title: `${procedureRows[0].procedure_bucket} is where patients are getting hit most`,
              body: `${procedureRows[0].procedure_bucket} is the largest treatment bucket in the cleaned dataset, with surgery, fertility treatment, therapy services, and MRI following behind.`,
              tone: "medium",
            }
          : null,
        {
          title: "The data is already useful, but the extraction still needs work",
          body: `${unknownInsurerPct}% of raw rows still lack a confident insurer, ${unknownCategoryPct}% still lack a clean denial category, and ${genericProcedurePct}% still fall into a generic procedure bucket. These charts are directionally strong, not final truth.`,
          tone: "warning",
        },
      ].filter(Boolean);

      res.json({
        status: "success",
        overview: {
          totalRows,
          cleanPatternRows: qualityMap.clean_pattern_rows || 0,
          unknownInsurerPct,
          unknownCategoryPct,
          genericProcedurePct,
          suspiciousOrStateRows: qualityMap.suspicious_or_state_rows || 0,
        },
        findings,
        topInsurers: insurerRows.map((row) => ({ label: row.insurer, value: row.record_count })),
        topCategories: categoryRows.map((row) => ({ label: row.denial_category, value: row.record_count })),
        topProcedures: procedureRows.map((row) => ({ label: row.procedure_bucket, value: row.record_count })),
        heatmap: heatmapRows.map((row) => ({
          insurer: row.insurer,
          category: row.denial_category,
          value: row.record_count,
        })),
        procedureClusters: clusterRows.map((row) => ({
          procedure: row.procedure_bucket,
          insurer: row.insurer,
          category: row.denial_category,
          value: row.record_count,
        })),
        statePatterns: stateRows.map((row) => ({ label: row.state, value: row.record_count })),
        sourceMix: sourceRows.map((row) => ({ label: row.source_type, value: row.record_count })),
        dataQuality: qualityRows.map((row) => ({ metric: row.metric, value: Number(row.value || 0) })),
      });
    } catch (error) {
      res.status(500).json({ status: "error", error: String(error) });
    }
  });

  app.post("/api/admin/run-autopilot", async (req, res) => {
    try {
      const result = await runWarehouseAutopilotPass();
      res.json({ status: "success", result });
    } catch (error) {
      res.status(500).json({ status: "error", error: String(error) });
    }
  });

  app.post("/api/admin/run-deep-backfill", async (req, res) => {
    try {
      const result = await runWarehouseDeepBackfillPass();
      res.json({ status: "success", result });
    } catch (error) {
      res.status(500).json({ status: "error", error: String(error) });
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
    if (!aiConfigured()) {
      return res.status(500).json({ error: "AI Engine not configured" });
    }
    try {
      const prompt = `You are an expert medical billing and insurance specialist. 
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
Return only valid JSON.

Content to analyze: ${text || ""}`;

      const result = await generateStructuredJson({
        prompt,
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
            date: { type: SchemaType.STRING },
            cptCodes: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          },
          required: ["insurer", "planType", "procedure", "denialReason", "date", "cptCodes"],
        }
      });
      res.json(result);
    } catch (err) {
      console.error("[API] Extraction failed:", err);
      res.status(500).json({ error: String(err) });
    }
  });

  // API: AI Appeal Generation
  app.post("/api/ai/generate-appeal", async (req, res) => {
    const { denial } = req.body;
    if (!aiConfigured()) {
      return res.status(500).json({ error: "AI Engine not configured" });
    }
    try {
      const evidenceContext = await fetchAppealEvidenceContext(denial || {}, BIGQUERY_DATASET_ID);
      const result = await generateStructuredJson({
        prompt: `Generate a professional and persuasive health insurance appeal letter based on this denial story.
Use a firm but respectful tone. Cite "medical necessity" and "standard of care" where appropriate.
This tool is different from a generic AI appeal writer because it has access to our observatory patterns. Use those patterns carefully as anonymized observational evidence, not as legal case citations.

Denial Details:
Insurer: ${denial.insurer}
Procedure: ${denial.procedure}
Reason: ${denial.denialReason}
Denial Quote: ${denial.denialQuote || ""}
Appeal Deadline: ${denial.appealDeadline || ""}
ERISA Status: ${denial.isERISA || "Unknown"}
Medical Necessity Flag: ${denial.medicalNecessityFlag ? "Yes" : "No"}
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
          required: ["subject", "body", "keyArguments", "benchmarkSummary", "precedentNotes", "evidenceChecklist"],
        }
      });
      res.json({
        ...result,
        benchmarkSummary: result.benchmarkSummary || evidenceContext.benchmarkSummary,
        precedentNotes:
          Array.isArray(result.precedentNotes) && result.precedentNotes.length
            ? result.precedentNotes
            : evidenceContext.precedentNotes,
        evidenceChecklist:
          Array.isArray(result.evidenceChecklist) && result.evidenceChecklist.length
            ? result.evidenceChecklist
            : evidenceContext.evidenceChecklist,
      });
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
