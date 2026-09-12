/** TechEvent types for the /techevents feature */
export interface TechEvent {
  id: string;
  title: string;
  event_date: string;        // YYYY-MM-DD
  location: string;          // City, Country or Virtual
  url: string;
  category: 'Web3' | 'AI' | 'General Tech';
  platform_source: string;
  fee_type: 'Free' | 'Paid';
  mode: 'Online' | 'Offline' | 'Hybrid';
}

export type TechEventCategory = 'Web3' | 'AI' | 'General Tech';
export type TechEventMode = 'Online' | 'Offline' | 'Hybrid';
export type TechEventFeeType = 'Free' | 'Paid';

export interface TechEventFilterState {
  category: TechEventCategory | 'All';
  mode: TechEventMode | 'All';
  fee: TechEventFeeType | 'All';
}

export interface TechEventGridProps {
  events: TechEvent[];
  loading: boolean;
  error: string | null;
  favourites?: Set<string>;
  onToggleFavourite?: (id: string) => void;
}

export interface TechEventFilterBarProps {
  filters: TechEventFilterState;
  onFiltersChange: (filters: Partial<TechEventFilterState>) => void;
  hasActiveFilters: boolean;
  onClearAll: () => void;
}

export interface TechEventCardProps {
  event: TechEvent;
  isFavourite?: boolean;
  onToggleFavourite?: (id: string) => void;
}

/** Raw event data from scrapers before normalization */
export interface RawTechEvent {
  id?: string;
  title: string;
  date?: string;
  location?: string;
  url: string;
  category?: string;
  platform_source: string;
  fee_type?: string;
  mode?: string;
  [key: string]: unknown;
}

/** Firecrawl extraction schema for different platforms */
export interface FirecrawlExtractSchema {
  events: Array<{
    title: string;
    date: string;
    location: string;
    url: string;
    category?: string;
    fee_type?: string;
    mode?: string;
  }>;
}