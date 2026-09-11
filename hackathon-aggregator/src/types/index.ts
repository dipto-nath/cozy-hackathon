export interface Hackathon {
  id: string;
  title: string;
  organization: string;
  platform_source: string;
  url: string;
  mode: 'Online' | 'Offline' | 'Hybrid';
  fee_type: 'Free' | 'Paid';
  state_location: string;
  registration_deadline: string;
  event_date: string;
}

export type FilterMode = 'All' | 'Online' | 'Offline' | 'Hybrid';
export type FilterFee = 'All' | 'Free' | 'Paid';

export interface FilterState {
  mode: FilterMode;
  fee: FilterFee;
  country: string;
  state: string;
  search: string;
}
