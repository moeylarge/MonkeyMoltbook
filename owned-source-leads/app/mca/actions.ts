'use server';

import { redirect } from 'next/navigation';
import { createInboundLead } from '@/lib/db';

export async function submitMcaLead(formData: FormData) {
  const pageUrl = String(formData.get('pageUrl') || '/merchant-cash-advance');
  const landingPageSlug = String(formData.get('landingPageSlug') || 'merchant-cash-advance');
  const referrerUrl = String(formData.get('referrerUrl') || '');
  const utmSource = String(formData.get('utmSource') || 'direct');
  const utmMedium = String(formData.get('utmMedium') || 'none');
  const utmCampaign = String(formData.get('utmCampaign') || 'mca-inbound');

  const fields = Object.fromEntries(Array.from(formData.entries()).map(([k, v]) => [k, String(v)]));
  const leadId = await createInboundLead({
    vertical: 'mca',
    sourceType: 'qualification_form',
    exactSourceDetail: pageUrl,
    pageUrl,
    landingPageSlug,
    sourceBucket: 'inbound_form',
    referrerUrl,
    formVersion: 'mca-v1',
    utmSource,
    utmMedium,
    utmCampaign,
    fields,
  });

  redirect(`/leads/${leadId}`);
}
}
