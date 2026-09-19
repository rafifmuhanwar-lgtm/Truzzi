import fs from 'fs';
const img = fs.readFileSync(
  'C:/Users/Adess/.gemini/antigravity-ide/brain/bb170500-1c93-425e-902d-fe1d6fe827d3/.user_uploaded/media_1789571982335.png',
);
const base64 = img.toString('base64');
const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="5 0 90 70">
  <image href="data:image/png;base64,` +
  base64 +
  `" x="0" y="0" width="100" height="100" />
</svg>`;
fs.writeFileSync('e:/The New SentraGo/web/public/favicon.svg', svg);
fs.writeFileSync('e:/The New SentraGo/jastiper/public/favicon.svg', svg);
fs.writeFileSync('e:/The New SentraGo/admin/public/favicon.svg', svg);
fs.writeFileSync('e:/The New SentraGo/landing/public/favicon.svg', svg);
console.log('Done SVG');
