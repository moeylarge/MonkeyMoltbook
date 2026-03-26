import DebtLeadForm from './DebtLeadForm';
import { CtaBand, FaqBlock, TrustStrip } from './PageSections';

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
      <TrustStrip items={['Assessment flow', 'Consent capture', 'Debt lead scoring']} />
      <div className="row">
        <div className="col panel">
          <div className="h1">{title}</div>
          <p className="muted">{subtitle}</p>
          <ul>
            {bullets.map((bullet) => <li key={bullet} style={{ marginBottom: 10 }}>{bullet}</li>)}
          </ul>
          <CtaBand text="Start a short assessment to see whether your debt situation may fit a consultation path." button="Start Free Assessment" />
        </div>
        <div className="col">
          <DebtLeadForm pageUrl={pageUrl} landingPageSlug={landingPageSlug} title={calculatorMode ? 'Complete Assessment' : 'Start Free Assessment'} calculatorMode={calculatorMode} />
        </div>
      </div>
      <FaqBlock items={[
        { q: 'What do you ask for?', a: 'We ask for contact information, debt range, payment pressure, hardship, and consultation intent.' },
        { q: 'Is consent stored?', a: 'Yes. Debt pages store consent and tie it to the page and form version.' },
        { q: 'What happens after submit?', a: 'The lead is scored and can be reviewed and routed if it meets buyer-ready requirements.' },
      ]} />
    </div>
  );
}
