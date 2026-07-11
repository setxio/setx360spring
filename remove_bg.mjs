import Jimp from 'jimp';

function colorDistance(c1, c2) {
  const r1 = (c1 >> 24) & 255;
  const g1 = (c1 >> 16) & 255;
  const b1 = (c1 >> 8) & 255;
  const r2 = (c2 >> 24) & 255;
  const g2 = (c2 >> 16) & 255;
  const b2 = (c2 >> 8) & 255;
  return Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
}

async function processImage(path) {
  try {
    const image = await Jimp.read(path);
    const bgColor = image.getPixelColor(0, 0);
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    image.scan(0, 0, width, height, function(x, y, idx) {
      const color = image.getPixelColor(x, y);
      if (colorDistance(color, bgColor) < 80) {
        this.bitmap.data[idx + 3] = 0; // transparent
      }
    });
    
    await image.writeAsync(path);
    console.log("Processed " + path);
  } catch(e) {
    console.error("Failed on " + path, e);
  }
}

async function run() {
  const files = [
    'public/images/gator-chase/red_gator.png',
    'public/images/gator-chase/pink_gator.png',
    'public/images/gator-chase/cyan_gator.png',
    'public/images/gator-chase/orange_gator.png',
    'public/images/gator-chase/coin.png',
    'public/images/gator-chase/crawfish.png'
  ];
  for (const f of files) {
    await processImage(f);
  }
}
run();
