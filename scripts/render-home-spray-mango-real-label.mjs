import sharp from "sharp";

const base = "art-direction/candidates/home-spray-mango-fruit-base.png";
const reference = "C:/Users/jorge/AppData/Local/Temp/codex-clipboard-65239ae6-ecef-4259-a508-42e1cae20b83.png";
const outputPng = "art-direction/candidates/home-spray-mango-premium-con-mango.png";
const outputWebp = "art-direction/candidates/home-spray-mango-premium-con-mango.webp";

// Crop only the physical label from the supplied real-product photograph.
// Its original artwork is preserved intact: logo, typography, border and ornaments.
const label = await sharp(reference)
  .extract({ left: 39, top: 24, width: 220, height: 433 })
  .resize({ width: 256, height: 469, fit: "fill" })
  .sharpen({ sigma: 0.45, m1: 0.7, m2: 1.1 })
  .png()
  .toBuffer();

const composed = await sharp(base)
  .composite([{ input: label, left: 435, top: 607 }])
  .png()
  .toBuffer();

await sharp(composed).png({ compressionLevel: 9 }).toFile(outputPng);
await sharp(composed)
  .resize({ width: 900, height: 1125, fit: "cover" })
  .webp({ quality: 86, effort: 6, smartSubsample: true })
  .toFile(outputWebp);

for (const file of [outputPng, outputWebp]) {
  const metadata = await sharp(file).metadata();
  console.log(`${file}: ${metadata.width}x${metadata.height}`);
}
