import McaPage from '@/components/McaPage';

export default function Page() {
  return (
    <McaPage
      title="Merchant Cash Advance for Small Businesses"
      subtitle="Check if your business may qualify for working capital based on revenue, time in business, and funding need."
      bullets={[
        'Built for business owners looking for fast access to working capital.',
        'Short qualification check with owned-source attribution and scoring.',
        'Strong fit for businesses with active revenue and near-term funding needs.',
      ]}
      pageUrl="/merchant-cash-advance"
      landingPageSlug="merchant-cash-advance"
    />
  );
}
