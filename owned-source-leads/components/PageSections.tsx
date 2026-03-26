export function TrustStrip({ items }: { items: string[] }) {
  return (
    <div className="panel small muted">
      <div className="row">
        {items.map((item) => <div key={item}>{item}</div>)}
      </div>
    </div>
  );
}

export function FaqBlock({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="panel">
      <div className="h2">FAQ</div>
      <div className="grid">
        {items.map((item) => (
          <div key={item.q}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{item.q}</div>
            <div className="muted small">{item.a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CtaBand({ text, button }: { text: string; button: string }) {
  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700 }}>{text}</div>
          <div className="small muted">Owned-source capture, attribution, and qualification flow.</div>
        </div>
        <div className="button">{button}</div>
      </div>
    </div>
  );
}
