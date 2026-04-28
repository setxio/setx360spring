/**
 * Generates a consistent blue/green gradient background for avatars 
 * based on the user's name or ID.
 */
export const getGradientAvatar = (seed: string) => {
  const hash = seed.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  const hue1 = Math.abs(hash % 40) + 140; // Greenish (140-180 range)
  const hue2 = Math.abs((hash >> 4) % 40) + 200; // Bluish (200-240 range)

  const color1 = `hsl(${hue1}, 70%, 50%)`;
  const color2 = `hsl(${hue2}, 80%, 45%)`;

  return `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;
};
