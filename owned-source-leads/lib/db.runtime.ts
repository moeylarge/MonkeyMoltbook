import * as sqliteDb from './db';
import {
  hasDatabaseUrl,
  initPg,
  createInboundLeadPg,
  createMcaProspectPg,
  listLeadsPg,
  getLeadDetailPg,
  getDashboardMetricsPg,
  routeLeadToBuyerPg,
  recordConversionPg,
} from './db.pg-runtime';
import type { ProspectInput } from './prospecting';

let pgReady: Promise<void> | null = null;
async function ensurePg() {
  if (!hasDatabaseUrl()) return;
  if (!pgReady) pgReady = initPg();
  await pgReady;
}

export async function createInboundLead(input: Parameters<typeof sqliteDb.createInboundLead>[0]) {
  if (!hasDatabaseUrl()) return sqliteDb.createInboundLead(input);
  await ensurePg();
  return createInboundLeadPg(input);
}

export async function createMcaProspect(input: ProspectInput) {
  if (!hasDatabaseUrl()) return sqliteDb.createMcaProspect(input);
  await ensurePg();
  return createMcaProspectPg(input);
}

export async function listLeads(filters?: { vertical?: string; leadType?: string; temperature?: string; status?: string; }) {
  if (!hasDatabaseUrl()) return sqliteDb.listLeads(filters);
  await ensurePg();
  return listLeadsPg(filters);
}

export async function getLeadDetail(id: number) {
  if (!hasDatabaseUrl()) return sqliteDb.getLeadDetail(id);
  await ensurePg();
  return getLeadDetailPg(id);
}

export async function getDashboardMetrics() {
  if (!hasDatabaseUrl()) return sqliteDb.getDashboardMetrics();
  await ensurePg();
  return getDashboardMetricsPg();
}

export async function routeLeadToBuyer(input: Parameters<typeof sqliteDb.routeLeadToBuyer>[0]) {
  if (!hasDatabaseUrl()) return sqliteDb.routeLeadToBuyer(input);
  await ensurePg();
  return routeLeadToBuyerPg(input);
}

export async function recordConversion(input: Parameters<typeof sqliteDb.recordConversion>[0]) {
  if (!hasDatabaseUrl()) return sqliteDb.recordConversion(input);
  await ensurePg();
  return recordConversionPg(input);
}
