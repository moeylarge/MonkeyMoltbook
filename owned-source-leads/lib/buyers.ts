export interface BuyerProfile {
  id: string;
  name: string;
  vertical: 'mca' | 'debt' | 'roofing';
  handoff_type: 'post' | 'redirect' | 'internal';
  destination_url: string;
  aff_id: string;
  active: boolean;
}

export const buyerProfiles: BuyerProfile[] = [
  {
    id: 'mca-company-1',
    name: 'MCA Company 1',
    vertical: 'mca',
    handoff_type: 'redirect',
    destination_url: 'https://example-mca-buyer.com/apply',
    aff_id: 'AFF-MCA-001',
    active: true,
  },
  {
    id: 'debt-company-1',
    name: 'Debt Company 1',
    vertical: 'debt',
    handoff_type: 'redirect',
    destination_url: 'https://example-debt-buyer.com/apply',
    aff_id: 'AFF-DEBT-001',
    active: true,
  },
];

export function getBuyersByVertical(vertical: string) {
  return buyerProfiles.filter((buyer) => buyer.vertical === vertical && buyer.active);
}

export function getBuyerById(id: string) {
  return buyerProfiles.find((buyer) => buyer.id === id) ?? null;
}
