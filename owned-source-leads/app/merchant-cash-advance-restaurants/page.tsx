import McaPage from '@/components/McaPage';

export default function Page() {
  return (
    <McaPage
      title="Merchant Cash Advance for Restaurants"
      subtitle="Restaurant operators can check for working-capital fit based on revenue, timing, and business history."
      bullets={[
        'Built for restaurant cash-flow and operating-capital intent.',
        'Industry-specific qualification path for stronger fit signals.',
        'Feeds directly into hot-lead scoring for MCA buyers.',
      ]}
      pageUrl="/merchant-cash-advance-restaurants"
      landingPageSlug="merchant-cash-advance-restaurants"
    />
  );
}
