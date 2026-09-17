const { Jimp } = require('jimp');

async function removeWhiteBackground(inputPath, outputPath) {
  try {
    const image = await Jimp.read(inputPath);
    const tolerance = 25; 
    
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];

      if (red > 255 - tolerance && green > 255 - tolerance && blue > 255 - tolerance) {
        this.bitmap.data[idx + 3] = 0;
      }
    });

    await image.write(outputPath);
    console.log('Background removed successfully for:', outputPath);
  } catch (error) {
    console.error('Error processing image:', error);
  }
}

async function run() {
  const file1 = 'E:/The New SentraGo/web/src/assets/images/truzzi_logo.png';
  const file2 = 'E:/The New SentraGo/jastiper/src/assets/images/truzzi_logo.png';
  
  await removeWhiteBackground(file1, file1);
  await removeWhiteBackground(file2, file2);
}

run();
