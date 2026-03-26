import { getDashboardMetrics, getLeadDetail } from '@/lib/db.runtime';
import { getExportReadyLeads } from '@/lib/export';

export default async function ProofPage() {
  const dashboard = await getDashboardMetrics();
  const lead3 = await getLeadDetail(3);
  const lead4 = await getLeadDetail(4);
  const lead6 = await getLeadDetail(6);
  const exportReady = await getExportReadyLeads();

  return (
    <div className="grid">
      <div className="panel">
        <div className="h2">Phase 6 Proof</div>
        <div className="kv">
          <div className="label">Dashboard queue count</div><div>{dashboard.queue.length}</div>
          <div className="label">Export-ready count</div><div>{exportReady.length}</div>
          <div className="label">MCA inbound verified</div><div>{lead3 ? 'yes' : 'no'}</div>
          <div className="label">Debt inbound verified</div><div>{lead4 ? 'yes' : 'no'}</div>
          <div className="label">MCA prospecting verified</div><div>{lead6 ? 'yes' : 'no'}</div>
        </div>
      </div>

      <div className="row">
        <div className="col panel">
          <div className="h2">Attribution Proof</div>
          <div className="small muted">Lead 3 page source: {lead3?.inbound?.page_url ?? '—'}</div>
          <div className="small muted">Lead 4 page source: {lead4?.inbound?.page_url ?? '—'}</div>
          <div className="small muted">Lead 6 source URL: {lead6?.prospect?.source_url ?? '—'}</div>
        </div>
        <div className="col panel">
          <div className="h2">Scoring / Hot Proof</div>
          <div className="small muted">Lead 3: {lead3?.lead?.score} / {lead3?.lead?.hot_explanation}</div>
          <div className="small muted">Lead 4: {lead4?.lead?.score} / {lead4?.lead?.hot_explanation}</div>
          <div className="small muted">Lead 6: {lead6?.lead?.score} / {lead6?.lead?.hot_explanation}</div>
        </div>
      </div>
    </div>
  );
}
