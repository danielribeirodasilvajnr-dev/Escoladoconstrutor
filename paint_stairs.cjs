const Jimp = require('jimp');

Jimp.read('public/sticker_transparent.png').then(image => {
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    const a = this.bitmap.data[idx + 3];
    
    if (a < 10) return;

    // Detect white/gray (neutral color)
    // R, G, B should be fairly high and close to each other
    if (r > 120 && g > 120 && b > 120 && Math.abs(r-g) < 40 && Math.abs(g-b) < 40) {
       // Tint to #22ff88 (R:34, G:255, B:136)
       // We'll calculate a lightness factor (0 to 1) based on grayscale intensity
       const lightness = (r + g + b) / (3 * 255);
       
       // For bright whites, we want full #22ff88. 
       // For darker grays, we want a darker #22ff88.
       this.bitmap.data[idx + 0] = Math.min(255, 34 * (lightness + 0.2)); 
       this.bitmap.data[idx + 1] = Math.min(255, 255 * lightness);
       this.bitmap.data[idx + 2] = Math.min(255, 136 * lightness);
    }
  });
  
  image.write('public/sticker_transparent.png', () => {
    console.log('Stairs painted green!');
  });
}).catch(err => console.error(err));
