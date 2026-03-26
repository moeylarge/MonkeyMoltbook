'use server';

import { redirect } from 'next/navigation';
import { createInboundLead } from '@/lib/db.runtime';

export async function submitTestLead(formData: FormData) {
  const vertical = String(formData.get('vertical')) as 'mca' | 'debt';
  const entries = Object.fromEntries(Array.from(formData.entries()).map(([k, v]) => [k, String(v)]));
  const leadId = createInboundLead({
    vertical,
    sourceType: vertical === 'mca' ? 'qualification_form' : 'assessment_form',
    exactSourceDetail: String(formData.get('pageUrl')),
    pageUrl: String(formData.get('pageUrl')),
    landingPageSlug: String(formData.get('landingPageSlug')),
    sourceBucket: vertical === 'mca' ? 'inbound_form' : 'inbound_quiz',
    referrerUrl: String(formData.get('referrerUrl') || ''),
    formVersion: 'v1',
    utmSource: String(formData.get('utmSource') || ''),
    utmMedium: String(formData.get('utmMedium') || ''),
    utmCampaign: String(formData.get('utmCampaign') || ''),
    fields: entries,
  });
  redirect(`/leads/${leadId}`);
}
