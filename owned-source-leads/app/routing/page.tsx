import { listLeads } from '@/lib/db.runtime';
import { buyerProfiles } from '@/lib/buyers';
import { routeLeadAction } from './actions';

export default async function RoutingPage() {
  const leads = (await listLeads() as any[]).slice(0, 20);
  return (
    <div className="panel">
      <div className="h2">Buyer Routing</div>
      <p className="muted">Route a lead to a buyer with AFF ID and subID tracking.</p>
      <table className="table">
        <thead>
          <tr>
            <th>Lead</th><th>Vertical</th><th>Type</th><th>Score</th><th>Buyer</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const buyers = buyerProfiles.filter((buyer) => buyer.vertical === lead.vertical);
            return (
              <tr key={lead.id}>
                <td>#{lead.id}</td>
                <td>{lead.vertical}</td>
                <td>{lead.lead_type}</td>
                <td>{lead.score}</td>
                <td>
                  <form action={routeLeadAction} className="row" style={{ alignItems: 'center' }}>
                    <input type="hidden" name="lead_id" value={lead.id} />
                    <select name="buyer_id" defaultValue={buyers[0]?.id ?? ''}>
                      {buyers.map((buyer) => <option key={buyer.id} value={buyer.id}>{buyer.name}</option>)}
                    </select>
                    <button className="button" type="submit">Route</button>
                  </form>
                </td>
                <td className="small muted">AFF/subID attached on route</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
