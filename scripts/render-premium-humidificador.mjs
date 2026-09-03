import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { officialScentLabels as catalog } from "./official-scent-labels.mjs";


const slug = process.argv[2];
const item = catalog[slug];
if (!item) throw new Error(`Aroma no soportado: ${slug}`);
const [name, notes] = item;
const base = `art-direction/candidates/humidificador-${slug}-base.png`;
const out = `art-direction/candidates/humidificador-${slug}-premium`;

async function logoBuffer(width, height, color = [113, 87, 60]) {
  const src = await readFile("public/logo.png");
  const raster = sharp(src).resize({ width, height, fit: "contain" });
  const { data, info } = await raster.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const darkness = 255 - Math.round((data[i] + data[i + 1] + data[i + 2]) / 3);
    data[i] = color[0]; data[i + 1] = color[1]; data[i + 2] = color[2];
    data[i + 3] = darkness < 90 ? 0 : Math.min(220, (darkness - 90) * 1.9);
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

const mainLogo = await logoBuffer(72, 66);
const bottleLogo = await logoBuffer(54, 50, [46, 36, 28]);
const w = 260;
const h = 320;
const titleSize = name.length > 19 ? 14 : name.length > 14 ? 17 : 22;
const noteSize = notes.length > 2 ? 6.3 : 8;
const ink = "#70573d";
const mainSvg = Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <text x="130" y="104" text-anchor="middle" font-family="Georgia,serif" font-size="${titleSize}" letter-spacing=".7" fill="${ink}">${name}</text>
  <line x1="35" y1="120" x2="225" y2="120" stroke="#b59a76" stroke-width=".8"/>
  <text x="130" y="136" text-anchor="middle" font-family="Arial,sans-serif" font-size="6" letter-spacing="1.4" fill="${ink}">LUXURY HOME FRAGRANCE</text>
  <text x="130" y="178" text-anchor="middle" font-family="Georgia,serif" font-size="${noteSize}" fill="${ink}">${notes.map((line, i) => `<tspan x="130" dy="${i ? 12 : 0}">${line}</tspan>`).join("")}</text>
  <text x="130" y="258" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="${ink}">Humidificador</text>
  <text x="130" y="285" text-anchor="middle" font-family="Arial,sans-serif" font-size="7.3" fill="${ink}">www.aromastudio.cl</text>
</svg>`);
const mainArt = await sharp({ create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: mainLogo, left: 94, top: 15 }, { input: mainSvg, left: 0, top: 0 }]).png().toBuffer();

const bottleSvg = Buffer.from(`<svg width="110" height="135" xmlns="http://www.w3.org/2000/svg">
  <text x="55" y="90" text-anchor="middle" font-family="Georgia,serif" font-size="8" fill="#2c241d">${name.length > 14 ? name.split(" ")[0] : name}</text>
  <text x="55" y="116" text-anchor="middle" font-family="Arial,sans-serif" font-size="8" letter-spacing="1" fill="#2c241d">10 ml</text>
</svg>`);
const bottleArt = await sharp({ create: { width: 110, height: 135, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: bottleLogo, left: 28, top: 8 }, { input: bottleSvg, left: 0, top: 0 }]).png().toBuffer();

const final = await sharp(base).composite([
  { input: mainArt, left: 437, top: 645 },
  { input: bottleArt, left: 111, top: 1058 },
]).png().toBuffer();
await sharp(final).png({ compressionLevel: 9 }).toFile(`${out}.png`);
await sharp(final).resize({ width: 900, height: 1125, fit: "cover" }).webp({ quality: 86, effort: 6, smartSubsample: true }).toFile(`${out}.webp`);
console.log(`${out}.webp`);
