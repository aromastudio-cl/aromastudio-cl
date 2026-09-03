import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { officialScentLabels } from "./official-scent-labels.mjs";

const slug = process.argv[2];
const volume = process.argv[3] === "250" ? "250" : "120";
const labelSpec = officialScentLabels[slug];
if (!labelSpec) throw new Error(`Aroma no soportado: ${slug}`);
const [labelName, lines] = labelSpec;
const scent = slug === "cedron-limon-menta"
  ? { name: "CEDRÓN LIMÓN", name2: "Y MENTA", lines }
  : { name: labelName, lines };
const base = `art-direction/candidates/home-spray-${slug}-base.png`;
const outputPng = `art-direction/candidates/home-spray-${slug}-${volume}-premium.png`;
const outputWebp = `art-direction/candidates/home-spray-${slug}-${volume}-premium.webp`;
const width = 262;
const height = 476;

const logoSource = await readFile("public/logo.png");
const logoRaster = sharp(logoSource).resize({ width: 108, height: 100, fit: "contain" });
const { data: pixels, info } = await logoRaster.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (let i = 0; i < pixels.length; i += 4) {
  const darkness = 255 - Math.round((pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3);
  pixels[i] = 23;
  pixels[i + 1] = 19;
  pixels[i + 2] = 15;
  pixels[i + 3] = darkness < 90 ? 0 : Math.min(255, (darkness - 90) * 2.1);
}
const logo = await sharp(pixels, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();

const paper = await sharp("scripts/assets/label-background.png")
  .resize(width, height, { fit: "fill" })
  .png()
  .toBuffer();

// The top and bottom edges bow with the cylindrical bottle, while the side
// margins and tonal falloff make the paper read as physically wrapped.
const mask = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <path d="M5 8 Q131 0 257 8 L257 466 Q131 478 5 466 Z" fill="white"/>
</svg>`);
const wrappedPaper = await sharp(paper)
  .composite([{ input: mask, blend: "dest-in" }])
  .png()
  .toBuffer();

const typography = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="curve" x1="0" x2="1">
      <stop offset="0" stop-color="#6c4a2c" stop-opacity="0.13"/>
      <stop offset="0.12" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="0.82" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="1" stop-color="#6c4a2c" stop-opacity="0.16"/>
    </linearGradient>
  </defs>
  <text x="131" y="${scent.name2 ? 157 : 157}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${scent.name2 ? 20 : scent.name.length > 17 ? 23 : 30}" fill="#18130f" letter-spacing="0.7">${scent.name}</text>
  ${scent.name2 ? `<text x="131" y="181" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="20" fill="#18130f">${scent.name2}</text>` : ""}
  <line x1="39" y1="${scent.name2 ? 198 : 177}" x2="223" y2="${scent.name2 ? 198 : 177}" stroke="#b58a51" stroke-width="0.8"/>
  <text x="131" y="${scent.name2 ? 216 : 196}" text-anchor="middle" font-family="Arial, sans-serif" font-size="7.8" letter-spacing="1.8" fill="#30261f">LUXURY HOME FRAGRANCE</text>
  <text x="131" y="${scent.name2 ? 267 : 251}" text-anchor="middle" font-family="Georgia, serif" font-size="${scent.lines.length > 2 ? 8.8 : 11.2}" fill="#211a15">
    ${scent.lines.map((line, index) => `<tspan x="131" dy="${index === 0 ? 0 : 17}">${line}</tspan>`).join("")}
  </text>
  <text x="131" y="388" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" fill="#211a15">Home Spray</text>
  <text x="131" y="414" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" letter-spacing="2.4" fill="#18130f">${volume} ml</text>
  <text x="131" y="443" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#211a15">www.aromastudio.cl</text>
  <path d="M5 8 Q131 0 257 8 L257 466 Q131 478 5 466 Z" fill="url(#curve)"/>
</svg>`);

const label = await sharp(wrappedPaper)
  .composite([
    { input: logo, left: 77, top: 30 },
    { input: typography, left: 0, top: 0 },
  ])
  .png()
  .toBuffer();

const final = await sharp(base)
  .composite([{ input: label, left: 432, top: 601 }])
  .png()
  .toBuffer();

await sharp(final).png({ compressionLevel: 9 }).toFile(outputPng);
await sharp(final)
  .resize({ width: 900, height: 1125, fit: "cover" })
  .webp({ quality: 87, effort: 6, smartSubsample: true })
  .toFile(outputWebp);

console.log(outputPng);
console.log(outputWebp);
