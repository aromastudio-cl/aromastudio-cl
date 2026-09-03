import sharp from "sharp";

const base = "art-direction/candidates/home-spray-mango-fruit-base.png";
const logo = "public/logo.png";
const outputPng = "art-direction/candidates/home-spray-mango-premium-con-mango.png";
const outputWebp = "art-direction/candidates/home-spray-mango-premium-con-mango.webp";

const logoImage = sharp(logo).resize({ width: 112, height: 104, fit: "contain" });
const { data: logoPixels, info: logoInfo } = await logoImage
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

for (let i = 0; i < logoPixels.length; i += 4) {
  const darkness = 255 - Math.round((logoPixels[i] + logoPixels[i + 1] + logoPixels[i + 2]) / 3);
  logoPixels[i] = 23;
  logoPixels[i + 1] = 19;
  logoPixels[i + 2] = 15;
  logoPixels[i + 3] = darkness < 90
    ? 0
    : Math.min(255, Math.max(0, (darkness - 90) * 2.1));
}

const logoBuffer = await sharp(logoPixels, {
  raw: { width: logoInfo.width, height: logoInfo.height, channels: 4 },
}).png().toBuffer();

const artwork = Buffer.from(`
<svg width="1122" height="1402" viewBox="0 0 1122 1402" xmlns="http://www.w3.org/2000/svg">
  <style>
    .serif { font-family: Georgia, 'Times New Roman', serif; fill: #17130f; text-anchor: middle; }
    .sans { font-family: Arial, Helvetica, sans-serif; fill: #17130f; text-anchor: middle; }
    .gold { fill: none; stroke: #9b7952; stroke-linecap: round; stroke-linejoin: round; }
  </style>
  <rect x="441" y="610" width="245" height="459" rx="2" class="gold" stroke-width="1.2" opacity="0.72"/>
  <rect x="446" y="615" width="235" height="449" rx="1" class="gold" stroke-width="0.55" opacity="0.52"/>
  <g class="gold" stroke-width="1" opacity="0.78">
    <path d="M448 633 C448 623 454 618 465 618 M448 632 C456 632 460 627 460 619 M448 639 C456 639 463 633 464 625"/>
    <path d="M679 633 C679 623 673 618 662 618 M679 632 C671 632 667 627 667 619 M679 639 C671 639 664 633 663 625"/>
    <path d="M448 1041 C448 1051 454 1057 465 1057 M448 1042 C456 1042 460 1047 460 1056 M448 1035 C456 1035 463 1041 464 1049"/>
    <path d="M679 1041 C679 1051 673 1057 662 1057 M679 1042 C671 1042 667 1047 667 1056 M679 1035 C671 1035 664 1041 663 1049"/>
  </g>
  <text x="563" y="758" class="serif" font-size="35" letter-spacing="1.8">MANGO</text>
  <line x1="466" y1="777" x2="660" y2="777" stroke="#9b7952" stroke-width="1" opacity="0.72"/>
  <text x="563" y="798" class="sans" font-size="8.7" letter-spacing="2.2">LUXURY HOME FRAGRANCE</text>
  <text x="563" y="846" class="serif" font-size="10.6">
    <tspan x="563" dy="0">NOTAS DE MANGO, PIÑA,</tspan>
    <tspan x="563" dy="16">MANZANA, DURAZNO, COCO,</tspan>
    <tspan x="563" dy="16">NARANJA, JAZMÍN, MUGUET,</tspan>
    <tspan x="563" dy="16">ALGODÓN DE AZÚCAR, ALMIZCLE</tspan>
  </text>
  <text x="563" y="978" class="sans" font-size="17" letter-spacing="0.5">Home Spray</text>
  <text x="563" y="1003" class="sans" font-size="14" letter-spacing="2.6">250 ml</text>
  <text x="563" y="1032" class="sans" font-size="10.5" letter-spacing="0.45">www.aromastudio.cl</text>
</svg>`);

const composed = await sharp(base).composite([
  { input: logoBuffer, left: 507, top: 621 },
  { input: artwork, left: 0, top: 0 },
]).png().toBuffer();

await sharp(composed).png({ compressionLevel: 9 }).toFile(outputPng);
await sharp(composed)
  .resize({ width: 900, height: 1125, fit: "cover" })
  .webp({ quality: 84, effort: 6, smartSubsample: true })
  .toFile(outputWebp);

for (const file of [outputPng, outputWebp]) {
  const metadata = await sharp(file).metadata();
  console.log(`${file}: ${metadata.width}x${metadata.height}`);
}
