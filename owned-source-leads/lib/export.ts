import { listLeads } from './db.runtime';

export async function getExportReadyLeads() {
  const leads = await listLeads();
  return (leads as any[]).filter((lead) => Number(lead.export_ready) === 1);
}

export function toBuyerReadyRecord(lead: any) {
  return {
    lead_id: lead.id,
    vertical: lead.vertical,
    lead_type: lead.lead_type,
    source_type: lead.source_type,
    exact_source_detail: lead.exact_source_detail,
    created_at: lead.created_at,
    score: lead.score,
    temperature: lead.temperature,
    status: lead.status,
    hot_explanation: lead.hot_explanation,
    export_ready: !!lead.export_ready,
    buyer_readiness_status: lead.buyer_readiness_status,
  };
}
