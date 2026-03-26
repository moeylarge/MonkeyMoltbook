import { neon } from '@neondatabase/serverless';
import { scoreInboundLead } from './scoring';
import { normalizePhone, scoreMcaProspect, type ProspectInput } from './prospecting';

const databaseUrl = process.env.DATABASE_URL!;
const sql = neon(databaseUrl);

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

export async function initPg() {
  await sql`CREATE TABLE IF NOT EXISTS leads (id SERIAL PRIMARY KEY, vertical TEXT NOT NULL, lead_type TEXT NOT NULL, source_type TEXT NOT NULL, exact_source_detail TEXT NOT NULL, status TEXT NOT NULL, score INTEGER NOT NULL, temperature TEXT NOT NULL, hot_explanation TEXT NOT NULL, scoring_version TEXT NOT NULL, export_ready INTEGER NOT NULL DEFAULT 0, buyer_readiness_status TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`;
  await sql`CREATE TABLE IF NOT EXISTS inbound_lead_details (lead_id INTEGER PRIMARY KEY, page_url TEXT, landing_page_slug TEXT, referrer_url TEXT, source_bucket TEXT, funnel_step TEXT, form_version TEXT, submission_timestamp TEXT)`;
  await sql`CREATE TABLE IF NOT EXISTS lead_fields (id SERIAL PRIMARY KEY, lead_id INTEGER NOT NULL, field_key TEXT NOT NULL, field_value TEXT, UNIQUE(lead_id, field_key))`;
  await sql`CREATE TABLE IF NOT EXISTS attribution_events (id SERIAL PRIMARY KEY, lead_id INTEGER, event_type TEXT NOT NULL, page_url TEXT, referrer_url TEXT, utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, event_timestamp TEXT NOT NULL)`;
  await sql`CREATE TABLE IF NOT EXISTS scoring_snapshots (id SERIAL PRIMARY KEY, lead_id INTEGER NOT NULL, vertical TEXT NOT NULL, lead_type TEXT NOT NULL, final_score INTEGER NOT NULL, final_temperature TEXT NOT NULL, explanation_text TEXT NOT NULL, reasons_json TEXT NOT NULL, scored_at TEXT NOT NULL)`;
  await sql`CREATE TABLE IF NOT EXISTS consent_records (id SERIAL PRIMARY KEY, lead_id INTEGER NOT NULL, consent_checkbox_value TEXT, consent_text_shown TEXT, consent_text_version TEXT, page_url TEXT, form_version TEXT, consent_timestamp TEXT)`;
  await sql`CREATE TABLE IF NOT EXISTS prospect_details (lead_id INTEGER PRIMARY KEY, business_name TEXT, website TEXT, public_phone TEXT, public_business_email TEXT, city TEXT, state TEXT, category TEXT, source_platform TEXT, source_url TEXT, contact_page_url TEXT, notes TEXT, normalized_domain TEXT, normalized_phone TEXT, last_verified_at TEXT)`;
  await sql`CREATE TABLE IF NOT EXISTS buyer_routes (id SERIAL PRIMARY KEY, lead_id INTEGER NOT NULL, buyer_id TEXT NOT NULL, buyer_name TEXT NOT NULL, vertical TEXT NOT NULL, handoff_type TEXT NOT NULL, destination_url TEXT NOT NULL, aff_id TEXT NOT NULL, sub_id TEXT NOT NULL, route_status TEXT NOT NULL, routed_at TEXT NOT NULL, conversion_status TEXT NOT NULL DEFAULT 'pending', conversion_value TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '')`;
  await sql`CREATE TABLE IF NOT EXISTS conversion_events (id SERIAL PRIMARY KEY, buyer_route_id INTEGER NOT NULL, buyer_id TEXT NOT NULL, sub_id TEXT NOT NULL, event_type TEXT NOT NULL, payout_value TEXT NOT NULL DEFAULT '', raw_payload TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL)`;
}

export async function createInboundLeadPg(input: { vertical:'mca'|'debt'; sourceType:string; exactSourceDetail:string; pageUrl:string; landingPageSlug:string; sourceBucket:string; referrerUrl?:string; formVersion:string; utmSource?:string; utmMedium?:string; utmCampaign?:string; fields:Record<string,string> }) {
  const now = new Date().toISOString();
  const score = scoreInboundLead(input.vertical, input.fields);
  const exportReady = score.temperature === 'hot' ? 1 : 0;
  const inserted = await sql`INSERT INTO leads (vertical, lead_type, source_type, exact_source_detail, status, score, temperature, hot_explanation, scoring_version, export_ready, buyer_readiness_status, created_at, updated_at) VALUES (${input.vertical}, 'inbound', ${input.sourceType}, ${input.exactSourceDetail}, 'new', ${score.score}, ${score.temperature}, ${score.explanation}, 'v1', ${exportReady}, ${exportReady ? 'ready' : 'review_required'}, ${now}, ${now}) RETURNING id`;
  const leadId = Number(inserted[0].id);
  await sql`INSERT INTO inbound_lead_details (lead_id, page_url, landing_page_slug, referrer_url, source_bucket, funnel_step, form_version, submission_timestamp) VALUES (${leadId}, ${input.pageUrl}, ${input.landingPageSlug}, ${input.referrerUrl ?? ''}, ${input.sourceBucket}, 'submitted', ${input.formVersion}, ${now})`;
  for (const [k,v] of Object.entries(input.fields)) await sql`INSERT INTO lead_fields (lead_id, field_key, field_value) VALUES (${leadId}, ${k}, ${v}) ON CONFLICT (lead_id, field_key) DO UPDATE SET field_value = EXCLUDED.field_value`;
  await sql`INSERT INTO attribution_events (lead_id, event_type, page_url, referrer_url, utm_source, utm_medium, utm_campaign, event_timestamp) VALUES (${leadId}, 'form_submit', ${input.pageUrl}, ${input.referrerUrl ?? ''}, ${input.utmSource ?? ''}, ${input.utmMedium ?? ''}, ${input.utmCampaign ?? ''}, ${now})`;
  await sql`INSERT INTO scoring_snapshots (lead_id, vertical, lead_type, final_score, final_temperature, explanation_text, reasons_json, scored_at) VALUES (${leadId}, ${input.vertical}, 'inbound', ${score.score}, ${score.temperature}, ${score.explanation}, ${JSON.stringify(score.reasons)}, ${now})`;
  if (input.vertical === 'debt') await sql`INSERT INTO consent_records (lead_id, consent_checkbox_value, consent_text_shown, consent_text_version, page_url, form_version, consent_timestamp) VALUES (${leadId}, ${input.fields.consent_checkbox ?? 'no'}, ${'By submitting, you agree to be contacted about debt relief options.'}, 'v1', ${input.pageUrl}, ${input.formVersion}, ${now})`;
  return leadId;
}

export async function createMcaProspectPg(input: ProspectInput) {
  const now = new Date().toISOString();
  const score = scoreMcaProspect(input);
  const exportReady = score.temperature === 'hot' ? 1 : 0;
  const inserted = await sql`INSERT INTO leads (vertical, lead_type, source_type, exact_source_detail, status, score, temperature, hot_explanation, scoring_version, export_ready, buyer_readiness_status, created_at, updated_at) VALUES ('mca', 'prospecting', 'public_business_source', ${input.source_url}, 'new', ${score.score}, ${score.temperature}, ${score.explanation}, 'v1', ${exportReady}, ${exportReady ? 'ready' : 'review_required'}, ${now}, ${now}) RETURNING id`;
  const leadId = Number(inserted[0].id);
  await sql`INSERT INTO prospect_details (lead_id, business_name, website, public_phone, public_business_email, city, state, category, source_platform, source_url, contact_page_url, notes, normalized_domain, normalized_phone, last_verified_at) VALUES (${leadId}, ${input.business_name}, ${input.website ?? ''}, ${input.public_phone ?? ''}, ${input.public_business_email ?? ''}, ${input.city ?? ''}, ${input.state ?? ''}, ${input.category ?? ''}, ${input.source_platform}, ${input.source_url}, ${input.contact_page_url ?? ''}, ${input.notes ?? ''}, ${score.normalized_domain}, ${normalizePhone(input.public_phone)}, ${now})`;
  await sql`INSERT INTO scoring_snapshots (lead_id, vertical, lead_type, final_score, final_temperature, explanation_text, reasons_json, scored_at) VALUES (${leadId}, 'mca', 'prospecting', ${score.score}, ${score.temperature}, ${score.explanation}, ${JSON.stringify(score.reasons)}, ${now})`;
  return leadId;
}

export async function listLeadsPg(filters?: { vertical?: string; leadType?: string; temperature?: string; status?: string; }) {
  const rows = await sql`SELECT * FROM leads ORDER BY created_at DESC`;
  return rows.filter((r:any) => (!filters?.vertical || r.vertical===filters.vertical) && (!filters?.leadType || r.lead_type===filters.leadType) && (!filters?.temperature || r.temperature===filters.temperature) && (!filters?.status || r.status===filters.status));
}

export async function getLeadDetailPg(id:number) {
  const leadRows = await sql`SELECT * FROM leads WHERE id = ${id}`; const lead=leadRows[0]; if(!lead) return null;
  const inboundRows = await sql`SELECT * FROM inbound_lead_details WHERE lead_id = ${id}`;
  const prospectRows = await sql`SELECT * FROM prospect_details WHERE lead_id = ${id}`;
  const fieldRows = await sql`SELECT field_key, field_value FROM lead_fields WHERE lead_id = ${id} ORDER BY field_key`;
  const attributionRows = await sql`SELECT * FROM attribution_events WHERE lead_id = ${id} ORDER BY event_timestamp DESC`;
  const scoringRows = await sql`SELECT * FROM scoring_snapshots WHERE lead_id = ${id} ORDER BY scored_at DESC LIMIT 1`;
  const consentRows = await sql`SELECT * FROM consent_records WHERE lead_id = ${id} ORDER BY consent_timestamp DESC LIMIT 1`;
  const routeRows = await sql`SELECT * FROM buyer_routes WHERE lead_id = ${id} ORDER BY routed_at DESC`;
  const conversionRows = await sql`SELECT ce.* FROM conversion_events ce JOIN buyer_routes br ON br.id = ce.buyer_route_id WHERE br.lead_id = ${id} ORDER BY ce.created_at DESC`;
  return { lead, inbound: inboundRows[0] ?? null, prospect: prospectRows[0] ?? null, fields: fieldRows, attribution: attributionRows, scoring: scoringRows[0] ?? null, consent: consentRows[0] ?? null, routes: routeRows, conversions: conversionRows };
}

export async function getDashboardMetricsPg() {
  const rows = await sql`SELECT * FROM leads ORDER BY created_at DESC`;
  const today = new Date().toISOString().slice(0,10);
  const todays = rows.filter((r:any)=> String(r.created_at).slice(0,10)===today);
  const byPage = await sql`SELECT d.landing_page_slug, COUNT(*) as leads, SUM(CASE WHEN l.temperature='hot' THEN 1 ELSE 0 END) as hot FROM inbound_lead_details d JOIN leads l ON l.id=d.lead_id GROUP BY d.landing_page_slug ORDER BY leads DESC LIMIT 10`;
  const lastInbound = rows.find((r:any)=> r.lead_type==='inbound');
  return { metrics: { newLeadsToday:todays.length, hotLeadsToday:todays.filter((r:any)=>r.temperature==='hot').length, hotMca:todays.filter((r:any)=>r.vertical==='mca'&&r.temperature==='hot').length, hotDebt:todays.filter((r:any)=>r.vertical==='debt'&&r.temperature==='hot').length, hotInbound:todays.filter((r:any)=>r.lead_type==='inbound'&&r.temperature==='hot').length, hotProspecting:todays.filter((r:any)=>r.lead_type==='prospecting'&&r.temperature==='hot').length, junkLeads:todays.filter((r:any)=>r.temperature==='junk').length }, lastInboundSubmissionTime:lastInbound?.created_at ?? null, lastCollectionTime:lastInbound?.created_at ?? null, byPage, queue: rows.slice(0,20) };
}

export async function routeLeadToBuyerPg(input:{leadId:number;buyerId:string;buyerName:string;vertical:string;handoffType:string;destinationUrl:string;affId:string;subId:string;}) {
  const now = new Date().toISOString();
  await sql`INSERT INTO buyer_routes (lead_id, buyer_id, buyer_name, vertical, handoff_type, destination_url, aff_id, sub_id, route_status, routed_at) VALUES (${input.leadId}, ${input.buyerId}, ${input.buyerName}, ${input.vertical}, ${input.handoffType}, ${input.destinationUrl}, ${input.affId}, ${input.subId}, 'routed', ${now})`;
  return true;
}

export async function recordConversionPg(input:{buyerId:string;subId:string;eventType:string;payoutValue?:string;rawPayload?:string;}) {
  const routeRows = await sql`SELECT * FROM buyer_routes WHERE buyer_id = ${input.buyerId} AND sub_id = ${input.subId} ORDER BY routed_at DESC LIMIT 1`;
  const route = routeRows[0]; if(!route) return null;
  const now = new Date().toISOString();
  await sql`UPDATE buyer_routes SET conversion_status='converted', conversion_value=${input.payoutValue ?? ''} WHERE id=${route.id}`;
  await sql`INSERT INTO conversion_events (buyer_route_id, buyer_id, sub_id, event_type, payout_value, raw_payload, created_at) VALUES (${route.id}, ${input.buyerId}, ${input.subId}, ${input.eventType}, ${input.payoutValue ?? ''}, ${input.rawPayload ?? ''}, ${now})`;
  return { routeId: route.id, leadId: route.lead_id };
}
