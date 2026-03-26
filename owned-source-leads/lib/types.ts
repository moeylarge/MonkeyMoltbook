export type Vertical = 'mca' | 'debt';
export type LeadType = 'inbound' | 'prospecting';
export type Temperature = 'hot' | 'warm' | 'cold' | 'junk';
export type LeadStatus = 'new' | 'in_review' | 'approved' | 'rejected' | 'exported' | 'duplicate' | 'junk';

export interface LeadRow {
  id: number;
  vertical: Vertical;
  lead_type: LeadType;
  source_type: string;
  exact_source_detail: string;
  status: LeadStatus;
  score: number;
  temperature: Temperature;
  hot_explanation: string;
  export_ready: number;
  buyer_readiness_status: string;
  created_at: string;
  updated_at: string;
}
