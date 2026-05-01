export const PROFESSIONAL_ROLES = [
  'business', 'media', 'official', 'non_profit', 'church', 'chamber', 'venue',
  'v_business', 'v_media', 'v_official', 'v_non_profit', 'v_church', 'v_chamber', 'v_venue'
];

export const VENDOR_ROLES = ['business', 'v_business'];
export const OFFICIAL_ROLES = ['official', 'v_official'];
export const VERIFIED_ROLES = [
  'v_business', 'v_media', 'v_official', 'v_non_profit', 'v_church', 'v_chamber', 'v_venue', 'admin'
];

export const isProfessional = (role: string) => PROFESSIONAL_ROLES.includes(role);
export const isVendor = (role: string) => VENDOR_ROLES.includes(role);
export const isOfficial = (role: string) => OFFICIAL_ROLES.includes(role);
export const isVerified = (role: string) => VERIFIED_ROLES.includes(role);
export const isAdmin = (role: string) => role === 'admin';
