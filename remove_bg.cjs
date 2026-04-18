const Jimp = require('jimp');

Jimp.read('public/sticker.png').then(image => {
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    
    // Very relaxed tolerance for white compression artifacts
    // If pixel is light gray or white, make it transparent
    if (r > 220 && g > 220 && b > 220) {
      this.bitmap.data[idx + 3] = 0; // alpha = 0
    }
  });
  
  image.write('public/sticker_transparent.png', () => {
    console.log('Background removed!');
  });
}).catch(err => {
  console.error(err);
});
