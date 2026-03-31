export interface Partner {
  id: string;
  name: string;
  firm: string;
  category: string;
  specialty: string;
  languages: string[];
  email: string;
  website: string;
  verified: boolean;
  created_at: string;
}

export interface Guide {
  id: string;
  title: string;
  slug: string;
  category: string;
  phase: number;
  content: string;
  published: boolean;
  created_at: string;
}

export interface WaitlistEntry {
  id: string;
  email: string;
  brand_name: string;
  origin_country: string;
  target_open_date: string;
  created_at: string;
}

export interface Neighborhood {
  id: string;
  name: string;
  avg_rent_sqft: number;
  foot_traffic_score: number;
  asian_dining_score: number;
  competitor_count: number;
  lat: number;
  lng: number;
}
