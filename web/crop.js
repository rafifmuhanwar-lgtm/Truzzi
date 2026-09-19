import { Jimp } from 'jimp';

async function crop() {
  const img = await Jimp.read(
    'C:/Users/Adess/.gemini/antigravity-ide/brain/bb170500-1c93-425e-902d-fe1d6fe827d3/.user_uploaded/media_1789571982335.png',
  );
  img.autocrop();
  await img.write('e:/The New SentraGo/web/public/favicon.png');
  await img.write('e:/The New SentraGo/jastiper/public/favicon.png');
  await img.write('e:/The New SentraGo/admin/public/favicon.png');
  await img.write('e:/The New SentraGo/landing/public/favicon.png');
  console.log('Done reverting');
}
crop();
