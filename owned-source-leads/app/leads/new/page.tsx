import { submitTestLead } from './actions';

export default function NewLeadPage() {
  return (
    <div className="panel">
      <div className="h2">Test Intake</div>
      <p className="muted">Create a test inbound lead to verify datastore, attribution, scoring, dashboard, lead detail, export-ready logic, and debt consent capture.</p>
      <form action={submitTestLead} className="grid">
        <div className="filterBar">
          <select name="vertical" defaultValue="mca"><option value="mca">MCA</option><option value="debt">Debt</option></select>
          <input className="input" name="pageUrl" defaultValue="/merchant-cash-advance" placeholder="Page URL" />
          <input className="input" name="landingPageSlug" defaultValue="merchant-cash-advance" placeholder="Landing page slug" />
          <input className="input" name="referrerUrl" defaultValue="https://google.com/search?q=merchant+cash+advance" placeholder="Referrer URL" />
          <input className="input" name="utmSource" defaultValue="google" placeholder="UTM source" />
          <input className="input" name="utmMedium" defaultValue="organic" placeholder="UTM medium" />
          <input className="input" name="utmCampaign" defaultValue="test-campaign" placeholder="UTM campaign" />
        </div>
        <div className="filterBar">
          <input className="input" name="first_name" placeholder="First name" defaultValue="Jane" />
          <input className="input" name="last_name" placeholder="Last name" defaultValue="Doe" />
          <input className="input" name="business_name" placeholder="Business name (MCA)" defaultValue="Doe Roofing LLC" />
          <input className="input" name="phone" placeholder="Phone" defaultValue="555-222-9999" />
          <input className="input" name="email" placeholder="Email" defaultValue="jane@example.com" />
          <input className="input" name="state" placeholder="State" defaultValue="CA" />
        </div>
        <div className="filterBar">
          <input className="input" name="monthly_revenue_range" placeholder="Monthly revenue range" defaultValue="30k-60k" />
          <input className="input" name="time_in_business" placeholder="Time in business" defaultValue="1_year_plus" />
          <input className="input" name="funding_amount_range" placeholder="Funding amount range" defaultValue="10k-25k" />
          <input className="input" name="urgency" placeholder="Urgency" defaultValue="this_week" />
          <input className="input" name="estimated_unsecured_debt_range" placeholder="Debt range" defaultValue="20k-40k" />
          <input className="input" name="payment_pressure_level" placeholder="Payment pressure" defaultValue="high" />
        </div>
        <div className="filterBar">
          <input className="input" name="hardship_indicator" placeholder="Hardship" defaultValue="yes" />
          <input className="input" name="consultation_intent" placeholder="Consultation intent" defaultValue="yes" />
          <input className="input" name="consent_checkbox" placeholder="Consent checkbox" defaultValue="yes" />
          <input className="input" name="calculator_completed" placeholder="Calculator completed" defaultValue="yes" />
          <input className="input" name="quiz_completed" placeholder="Quiz completed" defaultValue="yes" />
          <button className="button" type="submit">Create Test Lead</button>
        </div>
      </form>
    </div>
  );
}
