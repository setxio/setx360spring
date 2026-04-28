const sharp = require('sharp');
const path = require('path');

const svgPath = path.join(__dirname, '../public/favicon.svg');

// The SVG is 48x46 — we need to scale it up with padding for a proper icon
// Add a white/transparent background and scale up to icon sizes
async function generateIcon(size, outputPath) {
  const padding = Math.round(size * 0.15);
  const innerSize = size - padding * 2;

  await sharp(svgPath)
    .resize(innerSize, innerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .png()
    .toFile(outputPath);

  console.log(`Generated ${outputPath} (${size}x${size})`);
}

async function main() {
  await generateIcon(192, path.join(__dirname, '../public/icon-192.png'));
  await generateIcon(512, path.join(__dirname, '../public/icon-512.png'));
  console.log('Done!');
}

main().catch(console.error);
