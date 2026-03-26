import { getExportReadyLeads, toBuyerReadyRecord } from '@/lib/export';

export default function ExportPage() {
  const leads = getExportReadyLeads().map(toBuyerReadyRecord);
  return (
    <div className="panel">
      <div className="h2">Buyer-Ready Export View</div>
      <p className="muted">Proof surface for export-ready leads and required buyer fields.</p>
      <table className="table">
        <thead>
          <tr>
            <th>Lead ID</th><th>Vertical</th><th>Type</th><th>Source</th><th>Score</th><th>Temp</th><th>Ready</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead: any) => (
            <tr key={lead.lead_id}>
              <td>{lead.lead_id}</td>
              <td>{lead.vertical}</td>
              <td>{lead.lead_type}</td>
              <td>{lead.exact_source_detail}</td>
              <td>{lead.score}</td>
              <td>{lead.temperature}</td>
              <td>{String(lead.export_ready)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
