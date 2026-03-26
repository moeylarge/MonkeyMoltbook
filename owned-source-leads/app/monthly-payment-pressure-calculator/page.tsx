import DebtPage from '@/components/DebtPage';

export default function Page() {
  return (
    <DebtPage
      title="Monthly Payment Pressure Calculator"
      subtitle="Use this calculator-style intake path to assess whether your unsecured debt payment burden may justify a consultation."
      bullets={[
        'Calculator-assisted conversion path for debt intent.',
        'Captures pressure level and debt range before routing to consultation.',
        'Stores consent, attribution, and scoring outputs.',
      ]}
      pageUrl="/monthly-payment-pressure-calculator"
      landingPageSlug="monthly-payment-pressure-calculator"
      calculatorMode
    />
  );
}
