'use server';

import { redirect } from 'next/navigation';
import { routeLeadToBuyer } from '@/lib/routing';

export async function routeLeadAction(formData: FormData) {
  const leadId = Number(formData.get('lead_id'));
  const buyerId = String(formData.get('buyer_id'));
  await routeLeadToBuyer(leadId, buyerId);
  redirect(`/leads/${leadId}`);
}
