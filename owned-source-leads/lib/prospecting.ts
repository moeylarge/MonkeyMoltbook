import type { Temperature } from './types';

export interface ProspectInput {
  business_name: string;
  website?: string;
  public_phone?: string;
  public_business_email?: string;
  city?: string;
  state?: string;
  category?: string;
  source_platform: string;
  source_url: string;
  contact_page_url?: string;
  notes?: string;
}

export interface ProspectScoreResult {
  score: number;
  temperature: Temperature;
  explanation: string;
  reasons: string[];
  normalized_domain: string;
}

export function normalizeDomain(url?: string) {
  if (!url) return '';
  return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
}

export function normalizePhone(phone?: string) {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

export function scoreMcaProspect(input: ProspectInput): ProspectScoreResult {
  let score = 0;
  const reasons: string[] = [];
  const normalized_domain = normalizeDomain(input.website);

  if (normalized_domain) { score += 20; reasons.push('Live business website present'); }
  if (input.public_phone) { score += 15; reasons.push('Public business phone present'); }
  if (input.public_business_email) { score += 15; reasons.push('Public business email present'); }
  if (input.contact_page_url) { score += 10; reasons.push('Contact page present'); }
  if (input.category && ['restaurant','trucking','auto repair','roofing','construction'].includes(input.category.toLowerCase())) {
    score += 15; reasons.push('Strong category fit for working-capital demand');
  }
  if (input.city && input.state) { score += 10; reasons.push('Geography fully identified'); }
  if (input.source_platform) { score += 10; reasons.push('Source platform recorded'); }
  if (input.source_url) { score += 5; reasons.push('Source URL recorded'); }

  let temperature: Temperature = 'junk';
  if (score >= 75) temperature = 'hot';
  else if (score >= 50) temperature = 'warm';
  else if (score >= 25) temperature = 'cold';

  return {
    score,
    temperature,
    explanation: reasons.slice(0, 4).join('; '),
    reasons,
    normalized_domain,
  };
}
