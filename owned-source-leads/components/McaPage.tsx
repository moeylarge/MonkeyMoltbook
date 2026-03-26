import McaLeadForm from './McaLeadForm';

export default function McaPage({
  title,
  subtitle,
  bullets,
  pageUrl,
  landingPageSlug,
}: {
  title: string;
  subtitle: string;
  bullets: string[];
  pageUrl: string;
  landingPageSlug: string;
}) {
  return (
    <div className="grid">
      <div className="row">
        <div className="col panel">
          <div className="h1">{title}</div>
          <p className="muted">{subtitle}</p>
          <ul>
            {bullets.map((bullet) => <li key={bullet} style={{ marginBottom: 10 }}>{bullet}</li>)}
          </ul>
          <div className="row small muted">
            <div>Fast review</div>
            <div>Owned-source tracking</div>
            <div>Qualification scoring</div>
          </div>
        </div>
        <div className="col">
          <McaLeadForm pageUrl={pageUrl} landingPageSlug={landingPageSlug} title="Start Qualification Check" />
        </div>
      </div>
    </div>
  );
}
