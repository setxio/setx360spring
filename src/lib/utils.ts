export const getAvatarUrl = (profile: any) => {
  if (profile?.avatar_url && !profile.avatar_url.includes('pravatar.cc')) {
    return profile.avatar_url;
  }
  
  // Generate a consistent gradient based on name
  const name = profile?.name || 'User';
  const colors = ['#10b981', '#3b82f6', '#6366f1', '#06b6d4'];
  const hash = name.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const color1 = colors[hash % colors.length];
  const color2 = colors[(hash + 1) % colors.length];
  
  // Return a data URI for a simple SVG gradient
  const svg = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" fill="url(#grad)" />
    <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="40" font-weight="bold">
      ${name[0].toUpperCase()}
    </text>
  </svg>`;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};
