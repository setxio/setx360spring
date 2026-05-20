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
};

// Convenience type aliases
export type UserRole = NonNullable<ProfileRow['role']>;
export type StaffClearance = StaffClearanceRow;
