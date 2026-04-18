const Jimp = require('jimp');

Jimp.read('public/sticker.png').then(image => {
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  
  const isBg = new Uint8Array(width * height);
  const queue = [];
  
  const getIdx = (x, y) => (y * width + x) * 4;
  const getBgIdx = (x, y) => y * width + x;
  
  // Seed the edges
  for(let x=0; x<width; x++) {
    queue.push([x, 0]);
    queue.push([x, height-1]);
  }
  for(let y=0; y<height; y++) {
    queue.push([0, y]);
    queue.push([width-1, y]);
  }
  
  let head = 0;
  while(head < queue.length) {
    const [x, y] = queue[head++];
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    
    const bgIdx = getBgIdx(x, y);
    if (isBg[bgIdx]) continue;
    
    const idx = getIdx(x, y);
    const r = image.bitmap.data[idx];
    const g = image.bitmap.data[idx+1];
    const b = image.bitmap.data[idx+2];
    
    // We want to eat ALL the white/light gray background AND the sticker's white outline.
    // The sticker's body is black (< 50) and gold (>150 but distinct hue).
    // If we consume everything that is light (R>150, G>150, B>150), we will eat the white outline
    // and the grayish anti-aliasing around it.
    if (r > 100 && g > 100 && b > 100) {
       // Wait, gold is R=255, G=215, B=0.
       // Its B is 0! So b > 100 will NOT eat the gold!
       // Yellow rays are R=255, G=230, B=50. B is 50. Will NOT be eaten!
       // So r>150 && g>150 && b>150 perfectly targets whites and grays!
    }
    if (r > 150 && g > 150 && b > 150) {
      isBg[bgIdx] = 1;
      queue.push([x+1, y], [x-1, y], [x, y+1], [x, y-1]);
    }
  }
  
  // Second pass: apply the mask and soften edges
  for(let y=0; y<height; y++) {
    for(let x=0; x<width; x++) {
      const bgIdx = getBgIdx(x, y);
      if (isBg[bgIdx]) {
        const idx = getIdx(x, y);
        image.bitmap.data[idx+3] = 0; // Make it completely transparent!
      }
    }
  }

  image.write('public/sticker_transparent.png', () => {
    console.log('Background flood-filled and fully clean!');
  });
}).catch(err => console.error(err));
