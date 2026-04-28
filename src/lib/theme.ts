/**
 * Theme Helper Library
 * Ported from SETXIO3 to support Custom and Dynamic (Seasonal) themes.
 */

// Helper to convert hex to HSL string compatible with CSS variables
export function hexToHSLString(hex: string): string {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt("0x" + hex[1] + hex[1]);
    g = parseInt("0x" + hex[2] + hex[2]);
    b = parseInt("0x" + hex[3] + hex[3]);
  } else if (hex.length === 7) {
    r = parseInt("0x" + hex[1] + hex[2]);
    g = parseInt("0x" + hex[3] + hex[4]);
    b = parseInt("0x" + hex[5] + hex[6]);
  }
  r /= 255; g /= 255; b /= 255;
  let cmin = Math.min(r, g, b), cmax = Math.max(r, g, b), delta = cmax - cmin;
  let h = 0, s = 0, l = 0;

  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);
  if (h < 0) h += 360;
  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return `${h} ${s}% ${l}%`;
}

// Helper to determine theme based on date
export function getSeasonalTheme(): string {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const day = now.getDate();

  // Specific Holiday logic
  if (month === 12 && day === 25) return 'christmas-formal';
  if (month === 12 && day >= 1 && day <= 24) return 'candy-cane';

  // Seasons logic
  if ((month === 3 && day >= 20) || (month > 3 && month < 6) || (month === 6 && day <= 20)) return 'spring';
  if ((month === 6 && day >= 21) || (month > 6 && month < 9) || (month === 9 && day <= 21)) return 'summer';
  if ((month === 9 && day >= 22) || (month > 9 && month < 12) || (month === 12 && day <= 20)) return 'autumn';
  
  return 'winter';
}

// Applies custom variables to the root element
export function applyCustomThemeVariables(primary: string, accent: string, tertiary: string, buttonStyle: string) {
  const root = document.documentElement;
  root.style.setProperty('--theme-primary', hexToHSLString(primary));
  root.style.setProperty('--theme-secondary', hexToHSLString(accent));
  root.style.setProperty('--theme-tertiary', hexToHSLString(tertiary));
  
  root.style.setProperty('--theme-gradient-from', primary);
  root.style.setProperty('--theme-gradient-via', tertiary);
  root.style.setProperty('--theme-gradient-to', accent);
  
  root.style.setProperty('--theme-color-1', primary);
  root.style.setProperty('--theme-color-2', tertiary);
  root.style.setProperty('--theme-color-3', accent);
  root.style.setProperty('--theme-color-4', tertiary);
  
  if (buttonStyle === 'gradient') {
    root.setAttribute('data-button-style', 'gradient');
  } else {
    root.removeAttribute('data-button-style');
  }
}

// Clears custom variables
export function clearCustomThemeVariables() {
  const root = document.documentElement;
  const props = [
    '--theme-primary', '--theme-secondary', '--theme-tertiary',
    '--theme-gradient-from', '--theme-gradient-via', '--theme-gradient-to',
    '--theme-color-1', '--theme-color-2', '--theme-color-3', '--theme-color-4'
  ];
  props.forEach(p => root.style.removeProperty(p));
  root.removeAttribute('data-button-style');
}
