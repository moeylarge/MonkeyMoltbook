import DebtPage from '@/components/DebtPage';

export default function Page() {
  return (
    <DebtPage
      title="Do I Qualify for Debt Settlement?"
      subtitle="Use this assessment path to check if your debt level, payment pressure, and hardship signals look like a fit."
      bullets={[
        'Qualification-focused page for debt relief intent.',
        'Designed to create attributable, consented debt leads.',
        'Feeds directly into lead scoring and dashboard review.',
      ]}
      pageUrl="/do-i-qualify-for-debt-settlement"
      landingPageSlug="do-i-qualify-for-debt-settlement"
    />
  );
}
