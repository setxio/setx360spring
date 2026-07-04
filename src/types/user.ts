import type { Database } from './database';

// The canonical profile row from Supabase — single source of truth
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type StaffClearanceRow = Database['public']['Tables']['staff_clearance']['Row'];

// Runtime user object — a partial view of the profiles row plus auth metadata.
// All profile fields are optional (fetched progressively), only auth essentials are required.
export type User = {
  // Always present (from Supabase auth)
  id: string;
  email: string;
  name: string;
  clearances: StaffClearanceRow[];
} & Partial<Omit<ProfileRow, 'id' | 'email' | 'name'>> & {
  // Extra runtime fields not stored in profiles
  full_name?: string;
  // Messaging preferences (real DB columns not yet in generated types)
  enable_read_receipts?: boolean;
  enable_typing_indicators?: boolean;
  translation_language?: string;
  arcade_coins?: number;
  arcade_badges?: string[];
};


// Convenience type aliases
export type UserRole = NonNullable<ProfileRow['role']>;
export type StaffClearance = StaffClearanceRow;

// --- Pages Architecture ---

export type PageType = 'business' | 'artist' | 'non_profit' | 'venue' | 'official' | 'chamber' | 'media' | 'church';

export interface Page {
  id: string;
  owner_id: string;
  page_type: PageType;
  name: string;
  avatar_url?: string | null;
  cover_url?: string | null;
  about?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  website?: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface PageMember {
  id: string;
  page_id: string;
  user_id: string;
  access_level: 'admin' | 'editor' | 'contributor';
  created_at: string;
}
