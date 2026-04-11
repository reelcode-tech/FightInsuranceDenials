import dotenv from 'dotenv';
import { withNeonClient } from './_neonClient';

dotenv.config();

const statements = [
  `
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  `,
  `
  CREATE TABLE IF NOT EXISTS source_records (
    source_record_id TEXT PRIMARY KEY,
    source_type TEXT NOT NULL,
    source_weight TEXT,
    priority TEXT,
    access_level TEXT,
    canonical_url TEXT,
    title TEXT,
    raw_text TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS raw_web_observations (
    observation_id TEXT PRIMARY KEY,
    source_record_id TEXT REFERENCES source_records(source_record_id) ON DELETE SET NULL,
    canonical_url TEXT,
    source_type TEXT NOT NULL,
    source_label TEXT NOT NULL,
    source_weight TEXT,
    title TEXT,
    raw_text TEXT,
    story_excerpt TEXT,
    insurer_raw TEXT,
    insurer_normalized TEXT,
    procedure_raw TEXT,
    procedure_normalized TEXT,
    denial_reason_raw TEXT,
    denial_category TEXT,
    state TEXT,
    plan_type TEXT,
    erisa_status TEXT,
    appeal_outcome TEXT,
    quality_score INTEGER DEFAULT 0,
    is_low_signal BOOLEAN DEFAULT FALSE,
    fingerprint TEXT,
    source_published_at TIMESTAMPTZ,
    ingested_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
  );
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_raw_web_observations_source_type
  ON raw_web_observations (source_type);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_raw_web_observations_insurer
  ON raw_web_observations (insurer_normalized);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_raw_web_observations_category
  ON raw_web_observations (denial_category);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_raw_web_observations_quality
  ON raw_web_observations (quality_score DESC);
  `,
  `
  CREATE TABLE IF NOT EXISTS curated_stories (
    story_id TEXT PRIMARY KEY,
    source_story_id TEXT,
    observation_id TEXT REFERENCES raw_web_observations(observation_id) ON DELETE SET NULL,
    source_record_id TEXT REFERENCES source_records(source_record_id) ON DELETE SET NULL,
    consent_level TEXT DEFAULT 'public_story',
    is_anonymized BOOLEAN DEFAULT TRUE,
    status TEXT DEFAULT 'published',
    source_type TEXT NOT NULL,
    source_label TEXT NOT NULL,
    source_url TEXT,
    extracted_insurer TEXT,
    plan_type TEXT,
    state TEXT,
    erisa_status TEXT,
    denial_category TEXT,
    procedure_condition TEXT,
    denial_reason_raw TEXT,
    denial_reason_normalized TEXT,
    patient_narrative_summary TEXT,
    why_unfair_patient_quote TEXT,
    similar_cases_count INTEGER DEFAULT 0,
    overturn_rate NUMERIC(6, 4) DEFAULT 0,
    anomaly_detected BOOLEAN DEFAULT FALSE,
    anomaly_reason TEXT,
    quality_score INTEGER DEFAULT 0,
    date_of_denial DATE,
    submission_timestamp TIMESTAMPTZ DEFAULT NOW(),
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb
  );
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_curated_stories_insurer
  ON curated_stories (extracted_insurer);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_curated_stories_category
  ON curated_stories (denial_category);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_curated_stories_procedure
  ON curated_stories (procedure_condition);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_curated_stories_timestamp
  ON curated_stories (submission_timestamp DESC);
  `,
  `
  CREATE TABLE IF NOT EXISTS benchmark_snapshots (
    snapshot_id TEXT PRIMARY KEY,
    insurer TEXT,
    denial_category TEXT,
    procedure_condition TEXT,
    similar_cases_count INTEGER DEFAULT 0,
    appeal_count INTEGER DEFAULT 0,
    overturned_count INTEGER DEFAULT 0,
    overturn_rate NUMERIC(6, 4) DEFAULT 0,
    source_mix JSONB DEFAULT '{}'::jsonb,
    snapshot_at TIMESTAMPTZ DEFAULT NOW()
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS insurer_daily_metrics (
    metric_date DATE NOT NULL,
    insurer TEXT NOT NULL,
    denial_category TEXT,
    procedure_condition TEXT,
    story_count INTEGER DEFAULT 0,
    appeal_count INTEGER DEFAULT 0,
    overturned_count INTEGER DEFAULT 0,
    average_quality_score NUMERIC(8, 2) DEFAULT 0,
    source_diversity_count INTEGER DEFAULT 0,
    PRIMARY KEY (metric_date, insurer, denial_category, procedure_condition)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS app_users (
    uid TEXT PRIMARY KEY,
    email TEXT,
    subscription_tier TEXT DEFAULT 'standard',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS user_cases (
    case_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uid TEXT REFERENCES app_users(uid) ON DELETE SET NULL,
    story_id TEXT REFERENCES curated_stories(story_id) ON DELETE SET NULL,
    private_notes TEXT,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS appeals (
    appeal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id TEXT REFERENCES curated_stories(story_id) ON DELETE CASCADE,
    case_id UUID REFERENCES user_cases(case_id) ON DELETE SET NULL,
    level TEXT,
    outcome TEXT DEFAULT 'pending',
    submission_date DATE,
    generated_letter TEXT,
    generated_letter_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  `,
  `
  CREATE OR REPLACE VIEW public_story_rollup AS
  SELECT
    extracted_insurer,
    denial_category,
    procedure_condition,
    COUNT(*) AS story_count,
    ROUND(AVG(quality_score)::numeric, 2) AS average_quality_score,
    COUNT(*) FILTER (WHERE anomaly_detected) AS anomaly_flags
  FROM curated_stories
  GROUP BY extracted_insurer, denial_category, procedure_condition;
  `,
];

async function main() {
  await withNeonClient(async (client) => {
    for (const statement of statements) {
      await client.query(statement);
    }

    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log(
      JSON.stringify(
        {
          status: 'ok',
          tables: result.rows.map((row) => row.table_name),
        },
        null,
        2
      )
    );
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
