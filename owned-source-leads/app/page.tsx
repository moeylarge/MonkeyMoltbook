import Link from 'next/link';
import { getDashboardMetrics } from '@/lib/db.runtime';

export default async function DashboardPage() {
  const { metrics, lastInboundSubmissionTime, lastCollectionTime, byPage, queue } = await getDashboardMetrics();
  const cards = [
    ['New Leads Today', metrics.newLeadsToday ?? 0],
    ['Hot Leads Today', metrics.hotLeadsToday ?? 0],
    ['Hot MCA', metrics.hotMca ?? 0],
    ['Hot Debt', metrics.hotDebt ?? 0],
    ['Inbound Hot Leads', metrics.hotInbound ?? 0],
    ['Prospecting Hot Leads', metrics.hotProspecting ?? 0],
    ['Junk Leads', metrics.junkLeads ?? 0],
  ];

  return (
    <div className="grid">
      <div className="panel filterBar">
        <select defaultValue=""><option value="">All Verticals</option><option value="mca">MCA</option><option value="debt">Debt</option></select>
        <select defaultValue=""><option value="">All Lead Types</option><option value="inbound">Inbound</option><option value="prospecting">Prospecting</option></select>
        <select defaultValue=""><option value="">All Temperatures</option><option value="hot">Hot</option><option value="warm">Warm</option><option value="cold">Cold</option><option value="junk">Junk</option></select>
        <select defaultValue=""><option value="">All Review Statuses</option><option value="new">New</option><option value="in_review">In Review</option><option value="approved">Approved</option></select>
      </div>

      <div className="cards">
        {cards.map(([label, value]) => <div key={label} className="card"><div className="label">{label}</div><div className="metric">{value}</div></div>)}
        <div className="card"><div className="label">Last Inbound Submission</div><div className="small">{lastInboundSubmissionTime ?? '—'}</div></div>
        <div className="card"><div className="label">Last Collection Time</div><div className="small">{lastCollectionTime ?? '—'}</div></div>
      </div>

      <div className="row">
        <div className="col panel">
          <div className="h2">Hot / Recent Lead Queue</div>
          <table className="table">
            <thead><tr><th>ID</th><th>Vertical</th><th>Type</th><th>Source</th><th>Score</th><th>Temp</th><th>Status</th></tr></thead>
            <tbody>
              {queue.map((lead: any) => (
                <tr key={lead.id}>
                  <td><Link href={`/leads/${lead.id}`}>#{lead.id}</Link></td>
                  <td>{lead.vertical}</td>
                  <td>{lead.lead_type}</td>
                  <td>{lead.exact_source_detail}</td>
                  <td>{lead.score}</td>
                  <td><span className={`badge ${lead.temperature}`}>{lead.temperature}</span></td>
                  <td>{lead.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="col panel">
          <div className="h2">Leads by Landing Page</div>
          <table className="table">
            <thead><tr><th>Landing Page</th><th>Leads</th><th>Hot</th></tr></thead>
            <tbody>
              {byPage.map((row: any) => (
                <tr key={row.landing_page_slug}><td>{row.landing_page_slug}</td><td>{row.leads}</td><td>{row.hot}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
