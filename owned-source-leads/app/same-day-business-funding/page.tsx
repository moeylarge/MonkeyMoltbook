import McaPage from '@/components/McaPage';

export default function Page() {
  return (
    <McaPage
      title="Same-Day Business Funding"
      subtitle="For businesses looking for near-term working capital options and fast qualification review."
      bullets={[
        'Targets urgency-driven business funding intent.',
        'Captures realistic funding amount and time-sensitive need.',
        'Feeds directly into scoring and dashboard review.',
      ]}
      pageUrl="/same-day-business-funding"
      landingPageSlug="same-day-business-funding"
    />
  );
}
