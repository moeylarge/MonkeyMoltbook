import DebtPage from '@/components/DebtPage';

export default function Page() {
  return (
    <DebtPage
      title="Debt Settlement Assessment"
      subtitle="Check whether your unsecured debt situation may fit a debt-settlement consultation path."
      bullets={[
        'Built for self-submitted debt assessment leads.',
        'Captures debt amount, payment pressure, hardship, and contactability.',
        'Stores consent and attribution inside our owned-source system.',
      ]}
      pageUrl="/debt-settlement"
      landingPageSlug="debt-settlement"
    />
  );
}
