import { submitDebtLead } from '@/app/debt/actions';
import { consultationIntentOptions, debtAmountOptions, debtConsentText, debtPressureOptions, hardshipOptions } from '@/lib/debtForms';

export default function DebtLeadForm({ pageUrl, landingPageSlug, title, calculatorMode = false }: { pageUrl: string; landingPageSlug: string; title: string; calculatorMode?: boolean; }) {
  return (
    <div className="panel">
      <div className="h2">{title}</div>
      <form action={submitDebtLead} className="grid">
        <input type="hidden" name="pageUrl" value={pageUrl} />
        <input type="hidden" name="landingPageSlug" value={landingPageSlug} />
        <input type="hidden" name="utmSource" value="owned-site" />
        <input type="hidden" name="utmMedium" value="landing-page" />
        <input type="hidden" name="utmCampaign" value={landingPageSlug} />
        <input type="hidden" name="calculator_completed" value={calculatorMode ? 'yes' : 'no'} />
        <div className="filterBar">
          <input className="input" name="first_name" placeholder="First name" required />
          <input className="input" name="last_name" placeholder="Last name" required />
          <input className="input" name="phone" placeholder="Phone" required />
          <input className="input" name="email" placeholder="Email" required />
          <input className="input" name="state" placeholder="State" required />
        </div>
        <div className="filterBar">
          <select name="estimated_unsecured_debt_range" defaultValue="20k-40k">{debtAmountOptions.map(v => <option key={v} value={v}>{v}</option>)}</select>
          <select name="payment_pressure_level" defaultValue="high">{debtPressureOptions.map(v => <option key={v} value={v}>{v}</option>)}</select>
          <select name="hardship_indicator" defaultValue="yes">{hardshipOptions.map(v => <option key={v} value={v}>{v}</option>)}</select>
          <select name="consultation_intent" defaultValue="yes">{consultationIntentOptions.map(v => <option key={v} value={v}>{v}</option>)}</select>
          <input className="input" name="preferred_contact_method" defaultValue="phone" placeholder="Preferred contact method" />
        </div>
        {calculatorMode ? (
          <div className="panel small muted">This page acts as a calculator-assisted conversion path. Result summary is implied by the completed intake step.</div>
        ) : null}
        <label className="small muted"><input type="checkbox" name="consent_checkbox" value="yes" required defaultChecked /> {debtConsentText}</label>
        <div><button className="button" type="submit">Start Free Assessment</button></div>
      </form>
    </div>
  );
}
