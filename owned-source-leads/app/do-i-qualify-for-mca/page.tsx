import McaPage from '@/components/McaPage';

export default function Page() {
  return (
    <McaPage
      title="Do I Qualify for MCA?"
      subtitle="Use the qualification form to see if your business shows the strongest fit signals for merchant cash advance offers."
      bullets={[
        'Best for owners who want to check fit before speaking to anyone.',
        'Captures revenue, time in business, urgency, and funding amount.',
        'Designed to create high-intent owned-source MCA leads.',
      ]}
      pageUrl="/do-i-qualify-for-mca"
      landingPageSlug="do-i-qualify-for-mca"
    />
  );
}
