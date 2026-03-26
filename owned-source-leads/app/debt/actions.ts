'use server';

import { redirect } from 'next/navigation';
import { createInboundLead } from '@/lib/db';

export async function submitDebtLead(formData: FormData) {
  const pageUrl = String(formData.get('pageUrl') || '/debt-settlement');
  const landingPageSlug = String(formData.get('landingPageSlug') || 'debt-settlement');
  const referrerUrl = String(formData.get('referrerUrl') || '');
  const utmSource = String(formData.get('utmSource') || 'owned-site');
  const utmMedium = String(formData.get('utmMedium') || 'landing-page');
  const utmCampaign = String(formData.get('utmCampaign') || landingPageSlug);

  const fields = Object.fromEntries(Array.from(formData.entries()).map(([k, v]) => [k, String(v)]));
  const leadId = createInboundLead({
    vertical: 'debt',
    sourceType: fields.calculator_completed === 'yes' ? 'calculator' : 'assessment_form',
    exactSourceDetail: pageUrl,
    pageUrl,
    landingPageSlug,
    sourceBucket: fields.calculator_completed === 'yes' ? 'inbound_calculator' : 'inbound_form',
    referrerUrl,
    formVersion: 'debt-v1',
    utmSource,
    utmMedium,
    utmCampaign,
    fields,
  });

  redirect(`/leads/${leadId}`);
}
