import Database from 'better-sqlite3';
import path from 'path';
import { scoreInboundLead } from './scoring';
import { normalizePhone, scoreMcaProspect, type ProspectInput } from './prospecting';

const dbPath = path.join(process.cwd(), 'data', 'leads.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    );

    CREATE TABLE IF NOT EXISTS inbound_lead_details (
      lead_id INTEGER PRIMARY KEY,
      page_url TEXT,
      landing_page_slug TEXT,
      referrer_url TEXT,
      source_bucket TEXT,
      funnel_step TEXT,
      form_version TEXT,
      submission_timestamp TEXT
    );

    CREATE TABLE IF NOT EXISTS lead_fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      field_key TEXT NOT NULL,
      field_value TEXT,
      UNIQUE(lead_id, field_key)
    );

    CREATE TABLE IF NOT EXISTS attribution_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER,
      event_type TEXT NOT NULL,
      page_url TEXT,
      referrer_url TEXT,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      event_timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scoring_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      vertical TEXT NOT NULL,
      lead_type TEXT NOT NULL,
      final_score INTEGER NOT NULL,
      final_temperature TEXT NOT NULL,
      explanation_text TEXT NOT NULL,
      reasons_json TEXT NOT NULL,
      scored_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS consent_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      consent_checkbox_value TEXT,
      consent_text_shown TEXT,
      consent_text_version TEXT,
      page_url TEXT,
      form_version TEXT,
      consent_timestamp TEXT
    );
  `);
}

init();

function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) as count FROM leads').get() as { count: number };
  if (count.count > 0) return;
  createInboundLead({
    vertical: 'mca',
    sourceType: 'qualification_form',
    exactSourceDetail: '/do-i-qualify-for-mca',
    pageUrl: '/do-i-qualify-for-mca',
    landingPageSlug: 'do-i-qualify-for-mca',
    sourceBucket: 'inbound_quiz',
    referrerUrl: 'https://google.com/search?q=do+i+qualify+for+mca',
    formVersion: 'v1',
    utmSource: 'google',
    utmMedium: 'organic',
    utmCampaign: 'mca-qualify',
    fields: {
      first_name: 'Ava', last_name: 'Cole', business_name: 'Cole Logistics', phone: '555-111-2222', email: 'ava@colelogistics.com', business_type: 'trucking', city: 'Houston', state: 'TX', monthly_revenue_range: '50k-100k', time_in_business: '2_years_plus', funding_amount_range: '25k-50k', urgency: 'urgent', preferred_contact_method: 'phone'
    }
  });
  createInboundLead({
    vertical: 'debt',
    sourceType: 'calculator',
    exactSourceDetail: '/monthly-payment-pressure-calculator',
    pageUrl: '/monthly-payment-pressure-calculator',
    landingPageSlug: 'monthly-payment-pressure-calculator',
    sourceBucket: 'inbound_calculator',
    referrerUrl: 'https://google.com/search?q=monthly+payment+pressure+calculator',
    formVersion: 'v1',
    utmSource: 'google',
    utmMedium: 'organic',
    utmCampaign: 'debt-calculator',
    fields: {
      first_name: 'Eli', last_name: 'Stone', phone: '555-333-4444', email: 'eli@example.com', state: 'CA', estimated_unsecured_debt_range: '20k-40k', payment_pressure_level: 'high', hardship_indicator: 'yes', consultation_intent: 'yes', preferred_contact_method: 'phone', consent_checkbox: 'yes', calculator_completed: 'yes'
    }
  });
}

seedIfEmpty();

export function createInboundLead(input: {
  vertical: 'mca' | 'debt';
  sourceType: string;
  exactSourceDetail: string;
  pageUrl: string;
  landingPageSlug: string;
  sourceBucket: string;
  referrerUrl?: string;
  formVersion: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  fields: Record<string, string>;
}) {
  const now = new Date().toISOString();
  const score = scoreInboundLead(input.vertical, input.fields);
  const exportReady = score.temperature === 'hot' ? 1 : 0;
  const status = 'new';
  const insertLead = db.prepare(`INSERT INTO leads (vertical, lead_type, source_type, exact_source_detail, status, score, temperature, hot_explanation, scoring_version, export_ready, buyer_readiness_status, created_at, updated_at)
  VALUES (@vertical, 'inbound', @sourceType, @exactSourceDetail, @status, @score, @temperature, @hotExplanation, 'v1', @exportReady, @buyerReadinessStatus, @createdAt, @updatedAt)`);
  const tx = db.transaction(() => {
    const leadResult = insertLead.run({
      vertical: input.vertical,
      sourceType: input.sourceType,
      exactSourceDetail: input.exactSourceDetail,
      status,
      score: score.score,
      temperature: score.temperature,
      hotExplanation: score.explanation,
      exportReady,
      buyerReadinessStatus: exportReady ? 'ready' : 'review_required',
      createdAt: now,
      updatedAt: now,
    });
    const leadId = Number(leadResult.lastInsertRowid);
    db.prepare(`INSERT INTO inbound_lead_details (lead_id, page_url, landing_page_slug, referrer_url, source_bucket, funnel_step, form_version, submission_timestamp)
      VALUES (?, ?, ?, ?, ?, 'submitted', ?, ?)`)
      .run(leadId, input.pageUrl, input.landingPageSlug, input.referrerUrl ?? '', input.sourceBucket, input.formVersion, now);

    const fieldStmt = db.prepare('INSERT OR REPLACE INTO lead_fields (lead_id, field_key, field_value) VALUES (?, ?, ?)');
    for (const [key, value] of Object.entries(input.fields)) fieldStmt.run(leadId, key, value);

    db.prepare(`INSERT INTO attribution_events (lead_id, event_type, page_url, referrer_url, utm_source, utm_medium, utm_campaign, event_timestamp)
      VALUES (?, 'form_submit', ?, ?, ?, ?, ?, ?)`)
      .run(leadId, input.pageUrl, input.referrerUrl ?? '', input.utmSource ?? '', input.utmMedium ?? '', input.utmCampaign ?? '', now);

    db.prepare(`INSERT INTO scoring_snapshots (lead_id, vertical, lead_type, final_score, final_temperature, explanation_text, reasons_json, scored_at)
      VALUES (?, ?, 'inbound', ?, ?, ?, ?, ?)`)
      .run(leadId, input.vertical, score.score, score.temperature, score.explanation, JSON.stringify(score.reasons), now);

    if (input.vertical === 'debt') {
      db.prepare(`INSERT INTO consent_records (lead_id, consent_checkbox_value, consent_text_shown, consent_text_version, page_url, form_version, consent_timestamp)
        VALUES (?, ?, ?, 'v1', ?, ?, ?)`)
        .run(leadId, input.fields.consent_checkbox ?? 'no', 'By submitting, you agree to be contacted about debt relief options.', input.pageUrl, input.formVersion, now);
    }
    return leadId;
  });
  return tx();
}

export function createMcaProspect(input: ProspectInput) {
  const now = new Date().toISOString();
  const score = scoreMcaProspect(input);
  const exportReady = score.temperature === 'hot' ? 1 : 0;
  const leadResult = db.prepare(`INSERT INTO leads (vertical, lead_type, source_type, exact_source_detail, status, score, temperature, hot_explanation, scoring_version, export_ready, buyer_readiness_status, created_at, updated_at)
    VALUES ('mca', 'prospecting', 'public_business_source', @exactSourceDetail, 'new', @score, @temperature, @hotExplanation, 'v1', @exportReady, @buyerReadinessStatus, @createdAt, @updatedAt)`)
    .run({
      exactSourceDetail: input.source_url,
      score: score.score,
      temperature: score.temperature,
      hotExplanation: score.explanation,
      exportReady,
      buyerReadinessStatus: exportReady ? 'ready' : 'review_required',
      createdAt: now,
      updatedAt: now,
    });

  const leadId = Number(leadResult.lastInsertRowid);
  db.prepare(`INSERT INTO prospect_details (lead_id, business_name, website, public_phone, public_business_email, city, state, category, source_platform, source_url, contact_page_url, notes, normalized_domain, normalized_phone, last_verified_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(
      leadId,
      input.business_name,
      input.website ?? '',
      input.public_phone ?? '',
      input.public_business_email ?? '',
      input.city ?? '',
      input.state ?? '',
      input.category ?? '',
      input.source_platform,
      input.source_url,
      input.contact_page_url ?? '',
      input.notes ?? '',
      score.normalized_domain,
      normalizePhone(input.public_phone),
      now,
    );

  db.prepare(`INSERT INTO scoring_snapshots (lead_id, vertical, lead_type, final_score, final_temperature, explanation_text, reasons_json, scored_at)
    VALUES (?, 'mca', 'prospecting', ?, ?, ?, ?, ?)`)
    .run(leadId, score.score, score.temperature, score.explanation, JSON.stringify(score.reasons), now);

  return leadId;
}

export function getDashboardMetrics() {
  const today = new Date().toISOString().slice(0, 10);
  const metrics = db.prepare(`
    SELECT
      COUNT(*) as newLeadsToday,
      SUM(CASE WHEN temperature = 'hot' THEN 1 ELSE 0 END) as hotLeadsToday,
      SUM(CASE WHEN vertical = 'mca' AND temperature = 'hot' THEN 1 ELSE 0 END) as hotMca,
      SUM(CASE WHEN vertical = 'debt' AND temperature = 'hot' THEN 1 ELSE 0 END) as hotDebt,
      SUM(CASE WHEN lead_type = 'inbound' AND temperature = 'hot' THEN 1 ELSE 0 END) as hotInbound,
      SUM(CASE WHEN lead_type = 'prospecting' AND temperature = 'hot' THEN 1 ELSE 0 END) as hotProspecting,
      SUM(CASE WHEN temperature = 'junk' THEN 1 ELSE 0 END) as junkLeads
    FROM leads WHERE substr(created_at, 1, 10) = ?
  `).get(today) as Record<string, number>;

  const lastInbound = db.prepare(`SELECT created_at FROM leads WHERE lead_type='inbound' ORDER BY created_at DESC LIMIT 1`).get() as { created_at?: string } | undefined;
  const byPage = db.prepare(`SELECT landing_page_slug, COUNT(*) as leads, SUM(CASE WHEN l.temperature='hot' THEN 1 ELSE 0 END) as hot FROM inbound_lead_details d JOIN leads l ON l.id = d.lead_id GROUP BY landing_page_slug ORDER BY leads DESC LIMIT 10`).all();
  const queue = db.prepare(`SELECT * FROM leads ORDER BY created_at DESC LIMIT 20`).all();
  return { metrics, lastInboundSubmissionTime: lastInbound?.created_at ?? null, lastCollectionTime: lastInbound?.created_at ?? null, byPage, queue };
}

export function listLeads(filters?: { vertical?: string; leadType?: string; temperature?: string; status?: string; }) {
  let sql = 'SELECT * FROM leads WHERE 1=1';
  const params: string[] = [];
  if (filters?.vertical) { sql += ' AND vertical = ?'; params.push(filters.vertical); }
  if (filters?.leadType) { sql += ' AND lead_type = ?'; params.push(filters.leadType); }
  if (filters?.temperature) { sql += ' AND temperature = ?'; params.push(filters.temperature); }
  if (filters?.status) { sql += ' AND status = ?'; params.push(filters.status); }
  sql += ' ORDER BY created_at DESC';
  return db.prepare(sql).all(...params);
}

export function getLeadDetail(id: number) {
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
  if (!lead) return null;
  const inbound = db.prepare('SELECT * FROM inbound_lead_details WHERE lead_id = ?').get(id);
  const fields = db.prepare('SELECT field_key, field_value FROM lead_fields WHERE lead_id = ? ORDER BY field_key').all(id);
  const attribution = db.prepare('SELECT * FROM attribution_events WHERE lead_id = ? ORDER BY event_timestamp DESC').all(id);
  const scoring = db.prepare('SELECT * FROM scoring_snapshots WHERE lead_id = ? ORDER BY scored_at DESC LIMIT 1').get(id);
  const consent = db.prepare('SELECT * FROM consent_records WHERE lead_id = ? ORDER BY consent_timestamp DESC LIMIT 1').get(id);
  return { lead, inbound, fields, attribution, scoring, consent };
}
