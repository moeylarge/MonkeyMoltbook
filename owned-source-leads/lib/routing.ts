import { getBuyerById } from './buyers';
import { getLeadDetail, routeLeadToBuyer as routeLeadToBuyerDb } from './db';

export function buildSubId(leadId: number, buyerId: string) {
  return `${buyerId}--lead-${leadId}`;
}

export function buildTrackedUrl(destinationUrl: string, affId: string, subId: string) {
  const url = new URL(destinationUrl);
  url.searchParams.set('aff_id', affId);
  url.searchParams.set('sub_id', subId);
  return url.toString();
}

export function routeLeadToBuyer(leadId: number, buyerId: string) {
  const buyer = getBuyerById(buyerId);
  if (!buyer) throw new Error('Buyer not found');

  const leadDetail = getLeadDetail(leadId);
  if (!leadDetail) throw new Error('Lead not found');

  const subId = buildSubId(leadId, buyerId);
  const trackedUrl = buildTrackedUrl(buyer.destination_url, buyer.aff_id, subId);

  await routeLeadToBuyerDb({
    leadId,
    buyerId: buyer.id,
    buyerName: buyer.name,
    vertical: buyer.vertical,
    handoffType: buyer.handoff_type,
    destinationUrl: trackedUrl,
    affId: buyer.aff_id,
    subId,
  });

  return {
    leadId,
    buyerId: buyer.id,
    buyerName: buyer.name,
    affId: buyer.aff_id,
    subId,
    trackedUrl,
  };
}
}
