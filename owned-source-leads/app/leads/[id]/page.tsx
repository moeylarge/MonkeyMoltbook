import { getLeadDetail } from '@/lib/db';

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = getLeadDetail(Number(id));
  if (!detail) return <div className="panel">Lead not found.</div>;

  return (
    <div className="grid">
      <div className="cards">
        <div className="card"><div className="label">Lead Type</div><div className="metric" style={{ fontSize: 20 }}>{detail.lead.lead_type}</div></div>
        <div className="card"><div className="label">Vertical</div><div className="metric" style={{ fontSize: 20 }}>{detail.lead.vertical}</div></div>
        <div className="card"><div className="label">Score</div><div className="metric">{detail.lead.score}</div></div>
        <div className="card"><div className="label">Temperature</div><div className={`badge ${detail.lead.temperature}`}>{detail.lead.temperature}</div></div>
        <div className="card"><div className="label">Review Status</div><div className="metric" style={{ fontSize: 20 }}>{detail.lead.status}</div></div>
        <div className="card"><div className="label">Export Readiness</div><div className="metric" style={{ fontSize: 20 }}>{detail.lead.export_ready ? 'Ready' : 'Needs review'}</div></div>
      </div>

      <div className="row">
        <div className="col panel">
          <div className="h2">Source</div>
          <div className="kv">
            <div className="label">Exact Source</div><div>{detail.lead.exact_source_detail}</div>
            <div className="label">Page URL</div><div>{detail.inbound?.page_url ?? '—'}</div>
            <div className="label">Source URL</div><div>{detail.inbound?.referrer_url ?? '—'}</div>
            <div className="label">Landing Page</div><div>{detail.inbound?.landing_page_slug ?? '—'}</div>
            <div className="label">Submitted</div><div>{detail.inbound?.submission_timestamp ?? detail.lead.created_at}</div>
          </div>
        </div>
        <div className="col panel">
          <div className="h2">Scoring</div>
          <div className="kv">
            <div className="label">Why scored that way</div><div>{detail.scoring?.explanation_text ?? detail.lead.hot_explanation}</div>
            <div className="label">Why marked hot</div><div>{detail.lead.hot_explanation}</div>
            <div className="label">Scoring snapshot</div><div>{detail.scoring?.reasons_json ?? '[]'}</div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="h2">Collected Fields</div>
        <div className="kv">
          {detail.fields.map((field: any) => (
            <><div key={`${field.field_key}-k`} className="label">{field.field_key}</div><div key={`${field.field_key}-v`}>{field.field_value}</div></>
          ))}
        </div>
      </div>

      <div className="row">
        <div className="col panel">
          <div className="h2">Consent</div>
          {detail.consent ? (
            <div className="kv">
              <div className="label">Checkbox</div><div>{detail.consent.consent_checkbox_value}</div>
              <div className="label">Text</div><div>{detail.consent.consent_text_shown}</div>
              <div className="label">Timestamp</div><div>{detail.consent.consent_timestamp}</div>
            </div>
          ) : <div className="muted">No consent record required/present.</div>}
        </div>
        <div className="col panel">
          <div className="h2">Attribution Events</div>
          <table className="table"><thead><tr><th>Event</th><th>Page</th><th>UTM</th><th>Time</th></tr></thead><tbody>
            {detail.attribution.map((event: any) => (
              <tr key={event.id}><td>{event.event_type}</td><td>{event.page_url}</td><td>{event.utm_source || '—'} / {event.utm_campaign || '—'}</td><td>{event.event_timestamp}</td></tr>
            ))}
          </tbody></table>
        </div>
      </div>
    </div>
  );
}
