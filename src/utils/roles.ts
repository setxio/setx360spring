// Legacy User Roles (Deprecating most of these in favor of Pages)
export const LEGACY_PROFESSIONAL_ROLES = [
  'business', 'media', 'official', 'non_profit', 'church', 'chamber', 'venue', 'artist',
  'v_business', 'v_media', 'v_official', 'v_non_profit', 'v_church', 'v_chamber', 'v_venue', 'v_artist'
];

export const VENDOR_ROLES = ['business', 'v_business'];
export const OFFICIAL_ROLES = ['official', 'v_official'];
export const VERIFIED_ROLES = [
  'v_business', 'v_media', 'v_official', 'v_non_profit', 'v_church', 'v_chamber', 'v_venue', 'v_artist', 'admin'
];

export const isProfessional = (role: string) => LEGACY_PROFESSIONAL_ROLES.includes(role);
export const isVendor = (role: string) => VENDOR_ROLES.includes(role);
export const isOfficial = (role: string) => OFFICIAL_ROLES.includes(role);
export const isVerified = (role: string) => VERIFIED_ROLES.includes(role);
export const isAdmin = (role: string) => role === 'admin';

// --- New Pages Architecture ---

export const PAGE_TYPES = [
  'business', 
  'artist', 
  'non_profit', 
  'venue', 
  'official', 
  'chamber', 
  'media', 
  'church'
] as const;

export type PageType = typeof PAGE_TYPES[number];

export const isBusinessPage = (type: string) => type === 'business';
export const isArtistPage = (type: string) => type === 'artist';
export const isNonProfitPage = (type: string) => type === 'non_profit';
export const isCivicPage = (type: string) => ['official', 'chamber', 'church'].includes(type);

