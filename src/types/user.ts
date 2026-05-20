export interface StaffClearance {
  id: string;
  profile_id: string;
  entity_type: 'civic' | 'ministry' | 'creator' | 'business' | string;
  entity_id: string;
  granted_at: string;
}

export type UserRole =
  | 'resident'
  | 'admin'
  | 'business'
  | 'official'
  | 'chamber'
  | 'media'
  | 'artist'
  | 'venue'
  | 'non_profit'
  | 'church'
  | 'city_worker'
  | 'city_manager'
  | 'driver'
  // verified variants
  | 'v_resident'
  | 'v_business'
  | 'v_official'
  | 'v_artist'
  | 'v_venue'
  | 'v_church'
  | 'v_non_profit'
  | string; // allow future roles without breaking

export interface User {
  id: string;
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  avatar_url?: string;
  banner_url?: string;
  location?: string;
  community?: string;
  county?: string;
  state?: string;
  country?: string;
  birth_month?: number;
  birth_day?: number;
  birth_year?: number;
  clearances: StaffClearance[];
  // optional profile extras
  bio?: string;
  website?: string;
  phone?: string;
  dest_tag?: number;
  enable_online_status?: boolean;
}
