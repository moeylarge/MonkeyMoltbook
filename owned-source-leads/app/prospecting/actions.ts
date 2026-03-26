'use server';

import { redirect } from 'next/navigation';
import { createMcaProspect } from '@/lib/db';

export async function submitProspect(formData: FormData) {
  const leadId = await createMcaProspect({
    business_name: String(formData.get('business_name') || ''),
    website: String(formData.get('website') || ''),
    public_phone: String(formData.get('public_phone') || ''),
    public_business_email: String(formData.get('public_business_email') || ''),
    city: String(formData.get('city') || ''),
    state: String(formData.get('state') || ''),
    category: String(formData.get('category') || ''),
    source_platform: String(formData.get('source_platform') || ''),
    source_url: String(formData.get('source_url') || ''),
    contact_page_url: String(formData.get('contact_page_url') || ''),
    notes: String(formData.get('notes') || ''),
  });

  redirect(`/leads/${leadId}`);
}
}
