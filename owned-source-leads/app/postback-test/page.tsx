export default function PostbackTestPage() {
  return (
    <div className="panel">
      <div className="h2">Postback Test</div>
      <p className="muted">Send a POST to <code>/api/postback</code> with buyer_id, sub_id, event_type, and optional payout_value.</p>
      <div className="small muted">Example payload: {`{"buyer_id":"mca-company-1","sub_id":"mca-company-1--lead-8","event_type":"conversion","payout_value":"250"}`}</div>
    </div>
  );
}
