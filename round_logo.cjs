const { Jimp } = require('jimp');

async function roundLogo() {
  const image = await Jimp.read('logo.png');
  const w = image.bitmap.width;
  const h = image.bitmap.height;
  const r = 60; // Smaller radius for "just the tips"

  image.scan(0, 0, w, h, function(x, y, idx) {
    let dx = 0;
    let dy = 0;
    let outside = false;

    if (x < r && y < r) { // top-left
      dx = r - x; dy = r - y;
      if (dx * dx + dy * dy > r * r) outside = true;
    } else if (x > w - r && y < r) { // top-right
      dx = x - (w - r); dy = r - y;
      if (dx * dx + dy * dy > r * r) outside = true;
    } else if (x < r && y > h - r) { // bottom-left
      dx = r - x; dy = y - (h - r);
      if (dx * dx + dy * dy > r * r) outside = true;
    } else if (x > w - r && y > h - r) { // bottom-right
      dx = x - (w - r); dy = y - (h - r);
      if (dx * dx + dy * dy > r * r) outside = true;
    }

    if (outside) {
      this.bitmap.data[idx + 3] = 0; // Transparent
    }
  });

  await image.write('logo_rounded.png');
  console.log('Logo rounded slightly!');
}

roundLogo().catch(console.error);
