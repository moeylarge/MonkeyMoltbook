import { submitMcaLead } from '@/app/mca/actions';
import { mcaConsentText, mcaFundingOptions, mcaRevenueOptions, mcaTimeOptions, mcaUrgencyOptions } from '@/lib/forms';

export default function McaLeadForm({ pageUrl, landingPageSlug, title }: { pageUrl: string; landingPageSlug: string; title: string; }) {
  return (
    <div className="panel">
      <div className="h2">{title}</div>
      <form action={submitMcaLead} className="grid">
        <input type="hidden" name="pageUrl" value={pageUrl} />
        <input type="hidden" name="landingPageSlug" value={landingPageSlug} />
        <input type="hidden" name="utmSource" value="owned-site" />
        <input type="hidden" name="utmMedium" value="landing-page" />
        <input type="hidden" name="utmCampaign" value={landingPageSlug} />
        <div className="filterBar">
          <input className="input" name="first_name" placeholder="First name" required />
          <input className="input" name="last_name" placeholder="Last name" required />
          <input className="input" name="business_name" placeholder="Business name" required />
          <input className="input" name="phone" placeholder="Phone" required />
          <input className="input" name="email" placeholder="Email" required />
          <input className="input" name="business_type" placeholder="Business type" required />
        </div>
        <div className="filterBar">
          <input className="input" name="city" placeholder="City" required />
          <input className="input" name="state" placeholder="State" required />
          <select name="monthly_revenue_range" defaultValue="30k-60k">{mcaRevenueOptions.map(v => <option key={v} value={v}>{v}</option>)}</select>
          <select name="time_in_business" defaultValue="1_year_plus">{mcaTimeOptions.map(v => <option key={v} value={v}>{v}</option>)}</select>
          <select name="funding_amount_range" defaultValue="10k-25k">{mcaFundingOptions.map(v => <option key={v} value={v}>{v}</option>)}</select>
          <select name="urgency" defaultValue="this_week">{mcaUrgencyOptions.map(v => <option key={v} value={v}>{v}</option>)}</select>
        </div>
        <div className="filterBar">
          <select name="existing_advance" defaultValue="no"><option value="no">No existing advance</option><option value="yes">Existing advance</option></select>
          <input className="input" name="monthly_deposits_range" placeholder="Monthly deposits range" />
          <input className="input" name="amount_needed_by_when" placeholder="Need funds by when" />
          <input className="input" name="preferred_contact_method" defaultValue="phone" placeholder="Preferred contact method" />
        </div>
        <div className="small muted">{mcaConsentText}</div>
        <div><button className="button" type="submit">Check If You Qualify</button></div>
      </form>
    </div>
  );
}
