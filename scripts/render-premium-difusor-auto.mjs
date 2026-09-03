import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { officialScentLabels as catalog } from "./official-scent-labels.mjs";


const slug = process.argv[2];
const item = catalog[slug];
if (!item) throw new Error(`Aroma no soportado: ${slug}`);
const [name, notes] = item;
const base = `art-direction/candidates/difusor-auto-${slug}-base.png`;
const out = `art-direction/candidates/difusor-auto-${slug}-10-premium`;

const src = await readFile("public/logo.png");
const raster = sharp(src).resize({ width: 78, height: 72, fit: "contain" });
const { data, info } = await raster.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (let i = 0; i < data.length; i += 4) {
  const darkness = 255 - Math.round((data[i] + data[i + 1] + data[i + 2]) / 3);
  data[i] = 24; data[i + 1] = 19; data[i + 2] = 14;
  data[i + 3] = darkness < 90 ? 0 : Math.min(255, (darkness - 90) * 2.1);
}
const logo = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();

const w = 250;
const h = 405;
const titleSize = name.length > 19 ? 14 : name.length > 14 ? 17 : 23;
const noteSize = notes.length > 2 ? 6.7 : 8.2;
const art = Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <text x="125" y="112" text-anchor="middle" font-family="Georgia,serif" font-size="${titleSize}" fill="#1a140f">${name}</text>
  <line x1="25" y1="128" x2="225" y2="128" stroke="#b58a51" stroke-width=".8"/>
  <text x="125" y="144" text-anchor="middle" font-family="Arial,sans-serif" font-size="6" letter-spacing="1.4" fill="#30261f">LUXURY HOME FRAGRANCE</text>
  <text x="125" y="190" text-anchor="middle" font-family="Georgia,serif" font-size="${noteSize}" fill="#211a15">${notes.map((line, i) => `<tspan x="125" dy="${i ? 12 : 0}">${line}</tspan>`).join("")}</text>
  <text x="125" y="320" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="#211a15">Difusor Auto</text>
  <text x="125" y="341" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" letter-spacing="1.8" fill="#211a15">10 ml</text>
  <text x="125" y="365" text-anchor="middle" font-family="Arial,sans-serif" font-size="7.5" fill="#211a15">www.aromastudio.cl</text>
</svg>`);

const artwork = await sharp({ create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: logo, left: 86, top: 12 }, { input: art, left: 0, top: 0 }])
  .png()
  .toBuffer();

const final = await sharp(base).composite([{ input: artwork, left: 432, top: 660 }]).png().toBuffer();
await sharp(final).png({ compressionLevel: 9 }).toFile(`${out}.png`);
await sharp(final).resize({ width: 900, height: 1125, fit: "cover" }).webp({ quality: 87, effort: 6, smartSubsample: true }).toFile(`${out}.webp`);
console.log(`${out}.webp`);
