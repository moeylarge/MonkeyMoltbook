import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required');
const sql = neon(databaseUrl);

await sql`CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  vertical TEXT NOT NULL,
  lead_type TEXT NOT NULL,
  source_type TEXT NOT NULL,
  exact_source_detail TEXT NOT NULL,
  status TEXT NOT NULL,
  score INTEGER NOT NULL,
  temperature TEXT NOT NULL,
  hot_explanation TEXT NOT NULL,
  scoring_version TEXT NOT NULL,
  export_ready INTEGER NOT NULL DEFAULT 0,
  buyer_readiness_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`;

console.log('Initialized base Neon schema');
