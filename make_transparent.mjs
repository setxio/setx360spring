import sharp from 'sharp';
import path from 'path';

const inputPath = 'c:/Users/montg/OneDrive/Desktop/SETX 360 Final/public/logo-setx-blue.png';
const outputPath = 'c:/Users/montg/OneDrive/Desktop/SETX 360 Final/public/logo-setx-transparent.png';

async function makeTransparent() {
  try {
    await sharp(inputPath)
      .ensureAlpha()
      .unflatten()
      .toFormat('png')
      .toBuffer()
      .then(async data => {
        // Simple thresholding for black pixels
        const { data: pixels, info } = await sharp(data).raw().toBuffer({ resolveWithObject: true });
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i+1];
          const b = pixels[i+2];
          // If pixel is very dark, make it transparent
          if (r < 20 && g < 20 && b < 20) {
            pixels[i+3] = 0;
          }
        }
        await sharp(pixels, { raw: { width: info.width, height: info.height, channels: 4 } })
          .toFile(outputPath);
        console.log('Success: Transparent logo created at', outputPath);
      });
  } catch (err) {
    console.error('Error:', err);
  }
}

makeTransparent();
