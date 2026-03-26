const checks = [
  'Landing pages load cleanly',
  'Primary CTA is visible above the fold',
  'Form submit creates a lead',
  'Attribution fields are stored',
  'Scoring and hot explanation are visible',
  'Buyer routing works',
  'Postback updates conversion status',
  'Export-ready records are visible',
  'FAQ and trust sections exist on LPs',
  'Traffic should not be sent until the path is verified',
];

export default function TrafficReadinessPage() {
  return (
    <div className="panel">
      <div className="h2">Traffic Readiness</div>
      <p className="muted">Operational checklist before sending real traffic into the system.</p>
      <div className="grid">
        {checks.map((check) => (
          <div key={check} className="panel small">□ {check}</div>
        ))}
      </div>
    </div>
  );
}
