import McaLeadForm from './McaLeadForm';
import { CtaBand, FaqBlock, TrustStrip } from './PageSections';

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
      <TrustStrip items={['Fast review', 'Owned-source tracking', 'Qualification scoring']} />
      <div className="row">
        <div className="col panel">
          <div className="h1">{title}</div>
          <p className="muted">{subtitle}</p>
          <ul>
            {bullets.map((bullet) => <li key={bullet} style={{ marginBottom: 10 }}>{bullet}</li>)}
          </ul>
          <CtaBand text="Check if your business may qualify in a short review flow." button="Check If You Qualify" />
        </div>
        <div className="col">
          <McaLeadForm pageUrl={pageUrl} landingPageSlug={landingPageSlug} title="Start Qualification Check" />
        </div>
      </div>
      <FaqBlock items={[
        { q: 'What information is used?', a: 'We collect business contact and qualification inputs such as revenue, time in business, urgency, and funding amount.' },
        { q: 'Is this the buyer page?', a: 'No. This is our owned-source qualification page used to capture and score leads before routing.' },
        { q: 'What happens after submit?', a: 'The lead is scored, reviewed, and can then be routed to an appropriate buyer with tracking attached.' },
      ]} />
    </div>
  );
}
