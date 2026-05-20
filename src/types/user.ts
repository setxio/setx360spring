import type { Database } from './database';

// The canonical profile row from Supabase — single source of truth
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type StaffClearanceRow = Database['public']['Tables']['staff_clearance']['Row'];

// Runtime user object: ProfileRow fields + auth metadata + clearances
// We pick the fields we actually use and add a few auth-only fields
export type User = Pick<ProfileRow,
  | 'id'
  | 'email'
  | 'name'
  | 'first_name'
  | 'last_name'
  | 'role'
  | 'avatar_url'
  | 'banner_url'
  | 'bio'
  | 'website'
  | 'phone'
  | 'location'
  | 'community'
  | 'county'
  | 'state'
  | 'country'
  | 'birth_month'
  | 'birth_day'
  | 'birth_year'
  | 'handle'
  | 'is_verified'
  | 'is_verified_resident'
  | 'is_public'
  | 'show_online_status'
  | 'allow_dms'
  | 'occupation'
  | 'company'
  | 'position'
  | 'denomination'
  | 'jurisdiction'
  | 'zip'
  | 'status'
  | 'store_type'
  | 'business_category'
  | 'driver_mode_active'
  | 'driver_rating'
  | 'xrpl_destination_tag'
  | 'verification_requested'
  | 'cover_url'
> & {
  // Extra runtime fields not in profiles table
  clearances: StaffClearanceRow[];
  // full_name used by CorporateView (derived, not stored)
  full_name?: string;
};

// Convenience type aliases
export type UserRole = NonNullable<ProfileRow['role']>;
export type StaffClearance = StaffClearanceRow;
