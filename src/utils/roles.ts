export const VERIFIED_ROLES = ['verified_pro', 'admin', 'super admin'];
export const LEGACY_PROFESSIONAL_ROLES = ['verified_pro', 'admin', 'super admin']; // To safely sunset it

// Since Profile.role is now simple, but Page.page_type holds the actual flavor (business, official),
// we adjust functions depending on whether they take a User.role or a Page.page_type.
export const VENDOR_TYPES = ['business', 'retail', 'merchant', 'vendor'];
export const OFFICIAL_TYPES = ['official', 'chamber', 'civic', 'non_profit', 'church', 'ministry'];
export const CREATOR_TYPES = ['artist', 'creator', 'media'];

export const isProfessional = (typeOrRole: string) => 
  VERIFIED_ROLES.includes(typeOrRole) || 
  VENDOR_TYPES.includes(typeOrRole) || 
  OFFICIAL_TYPES.includes(typeOrRole) || 
  CREATOR_TYPES.includes(typeOrRole);

export const isVendor = (type: string) => VENDOR_TYPES.includes(type);
export const isOfficial = (type: string) => OFFICIAL_TYPES.includes(type);
export const isVerified = (role: string) => VERIFIED_ROLES.includes(role) || isProfessional(role);
export const isAdmin = (role: string) => role === 'admin' || role === 'super admin';

// --- New Pages Architecture ---

export const PAGE_TYPES = [
  'retail',
  'restaurant',
  'service',
  'artist', 
  'non_profit', 
  'venue', 
  'official', 
  'chamber', 
  'media', 
  'church'
] as const;

export type PageType = typeof PAGE_TYPES[number];

export const isBusinessPage = (type: string) => type === 'retail' || type === 'business';
export const isArtistPage = (type: string) => type === 'artist' || type === 'media';
export const isNonProfitPage = (type: string) => type === 'non_profit';
export const isCivicPage = (type: string) => ['official', 'chamber', 'church', 'civic'].includes(type);
