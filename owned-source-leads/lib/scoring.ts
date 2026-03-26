import type { Temperature, Vertical } from './types';

export interface ScoreResult {
  score: number;
  temperature: Temperature;
  explanation: string;
  reasons: string[];
}

function temperatureFromScore(vertical: Vertical, score: number): Temperature {
  if (vertical === 'mca') {
    if (score >= 80) return 'hot';
    if (score >= 55) return 'warm';
    if (score >= 30) return 'cold';
    return 'junk';
  }
  if (score >= 80) return 'hot';
  if (score >= 55) return 'warm';
  if (score >= 30) return 'cold';
  return 'junk';
}

export function scoreInboundLead(vertical: Vertical, fields: Record<string, string>): ScoreResult {
  let score = 0;
  const reasons: string[] = [];

  if (vertical === 'mca') {
    score += 25; reasons.push('Self-submitted through owned MCA path');
    if (fields.phone && fields.email) { score += 15; reasons.push('Complete contact info'); }
    if (fields.business_name) { score += 10; reasons.push('Business name present'); }
    if (fields.monthly_revenue_range && fields.monthly_revenue_range !== 'unknown') { score += 15; reasons.push('Revenue band provided'); }
    if (fields.time_in_business && fields.time_in_business !== 'unknown') { score += 10; reasons.push('Time in business provided'); }
    if (fields.urgency && ['urgent','this_week','this_month'].includes(fields.urgency)) { score += 10; reasons.push('Near-term funding urgency'); }
    if (fields.funding_amount_range) { score += 10; reasons.push('Funding amount provided'); }
    if (fields.existing_advance || fields.monthly_deposits_range || fields.amount_needed_by_when) { score += 5; reasons.push('Second-step qualifiers present'); }
  } else {
    score += 20; reasons.push('Self-submitted through owned debt path');
    if (fields.consent_checkbox === 'yes') { score += 20; reasons.push('Consent captured'); }
    if (fields.phone && fields.email) { score += 15; reasons.push('Complete contact info'); }
    if (fields.estimated_unsecured_debt_range && fields.estimated_unsecured_debt_range !== 'unknown') { score += 15; reasons.push('Debt range provided'); }
    if (fields.payment_pressure_level && fields.payment_pressure_level !== 'low') { score += 10; reasons.push('Payment pressure present'); }
    if (fields.hardship_indicator && fields.hardship_indicator !== 'no') { score += 10; reasons.push('Hardship signal present'); }
    if (fields.consultation_intent && fields.consultation_intent !== 'not_sure') { score += 5; reasons.push('Consultation intent present'); }
    if (fields.quiz_completed === 'yes' || fields.calculator_completed === 'yes') { score += 5; reasons.push('Quiz/calculator completed'); }
  }

  const temperature = temperatureFromScore(vertical, score);
  const explanation = reasons.slice(0, 4).join('; ');
  return { score, temperature, explanation, reasons };
}
