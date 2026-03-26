import { submitProspect } from './actions';

export default function ProspectingPage() {
  return (
    <div className="panel">
      <div className="h2">MCA Prospect Collector</div>
      <p className="muted">Capture lawful public-business prospects, normalize them, score them, and send them into the review-ready MCA prospect queue.</p>
      <form action={submitProspect} className="grid">
        <div className="filterBar">
          <input className="input" name="business_name" placeholder="Business name" required defaultValue="Prime Roofing Co" />
          <input className="input" name="website" placeholder="Website" defaultValue="https://primeroofingco.com" />
          <input className="input" name="public_phone" placeholder="Public phone" defaultValue="(555) 123-4567" />
          <input className="input" name="public_business_email" placeholder="Public business email" defaultValue="info@primeroofingco.com" />
          <input className="input" name="city" placeholder="City" defaultValue="Houston" />
          <input className="input" name="state" placeholder="State" defaultValue="TX" />
        </div>
        <div className="filterBar">
          <input className="input" name="category" placeholder="Category" defaultValue="roofing" />
          <input className="input" name="source_platform" placeholder="Source platform" defaultValue="public_business_site" />
          <input className="input" name="source_url" placeholder="Source URL" defaultValue="https://primeroofingco.com/contact" />
          <input className="input" name="contact_page_url" placeholder="Contact page URL" defaultValue="https://primeroofingco.com/contact" />
          <input className="input" name="notes" placeholder="Notes" defaultValue="Public site with clear business contact path." />
          <button className="button" type="submit">Create Prospect</button>
        </div>
      </form>
    </div>
  );
}
