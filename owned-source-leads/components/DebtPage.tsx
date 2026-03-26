import DebtLeadForm from './DebtLeadForm';

export default function DebtPage({
  title,
  subtitle,
  bullets,
  pageUrl,
  landingPageSlug,
  calculatorMode = false,
}: {
  title: string;
  subtitle: string;
  bullets: string[];
  pageUrl: string;
  landingPageSlug: string;
  calculatorMode?: boolean;
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
            <div>Assessment flow</div>
            <div>Consent capture</div>
            <div>Debt lead scoring</div>
          </div>
        </div>
        <div className="col">
          <DebtLeadForm pageUrl={pageUrl} landingPageSlug={landingPageSlug} title={calculatorMode ? 'Complete Assessment' : 'Start Free Assessment'} calculatorMode={calculatorMode} />
        </div>
      </div>
    </div>
  );
}
