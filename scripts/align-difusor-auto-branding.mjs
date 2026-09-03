import sharp from "sharp";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const sourceDir = path.resolve(process.argv[2] || "art-direction/principal-notes-final");
const outputDir = path.resolve(process.argv[3] || "art-direction/branding-aligned-final");
const capOnly = process.argv.includes("--cap-only");
const fixFrontLogo = process.argv.includes("--fix-front-logo");
const frontBlank = process.argv.includes("--front-blank");
await mkdir(outputDir, { recursive: true });

const products = {
  "bubble-gum": "BUBBLE GUM",
  "cedron-limon-menta": "CEDRÓN LIMÓN & MENTA",
  "fig-no-7": "FIG N° 7",
  "green-elixir": "GREEN ELIXIR",
  infinity: "INFINITY",
  mango: "MANGO",
  "manzana-canela": "MANZANA CANELA",
  "noir-coffee": "NOIR COFFEE",
  "red-velvet": "RED VELVET",
  "soleil-blanc": "SOLEIL BLANC",
  verbena: "VERBENA",
};

const capCenters = {
  "bubble-gum": 591,
  "cedron-limon-menta": 587,
  "fig-no-7": 596,
  "green-elixir": 581,
  infinity: 581,
  mango: 587,
  "manzana-canela": 587,
  "noir-coffee": 587,
  "red-velvet": 587,
  "soleil-blanc": 587,
  verbena: 582,
};

const escapeXml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

const officialLogo = await readFile(path.resolve("public/logo-hd.png"));

async function darkLogo(width) {
  const raster = sharp(officialLogo).resize({ width, fit: "contain" });
  const { data, info } = await raster.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const darkness = 255 - Math.round((data[i] + data[i + 1] + data[i + 2]) / 3);
    data[i] = 24;
    data[i + 1] = 19;
    data[i + 2] = 14;
    data[i + 3] = darkness < 8 ? 0 : Math.min(255, Math.round((darkness - 8) * 8));
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

for (const [slug, title] of Object.entries(products)) {
  const input = path.join(sourceDir, `${slug}.png`);
  const meta = await sharp(input).metadata();
  const sx = meta.width / 1122;
  const sy = meta.height / 1402;

  // A single optical axis is used for cap mark, label mark and every text line.
  const centerX = Math.round(598 * sx);
  const labelW = Math.round(250 * sx);
  const labelH = Math.round(294 * sy);
  const labelLeft = centerX - Math.round(labelW / 2);
  const labelTop = Math.round(724 * sy);
  const labelLogoW = Math.round(92 * sx);
  const capLogoW = Math.round(88 * sx);
  const labelLogo = await darkLogo(labelLogoW);
  const capLogo = await darkLogo(capLogoW);

  const titleSize = Math.round((title.length > 19 ? 15 : title.length > 14 ? 18 : 22) * sx);
  const labelSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${labelW}" height="${labelH}">
    <rect x="1" y="1" width="${labelW - 2}" height="${labelH - 2}" rx="8" fill="#f7f5f2" stroke="#d9d0c5" stroke-width="2"/>
    <text x="50%" y="${Math.round(labelH * .58)}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${titleSize}" font-weight="600" fill="#9a5d62">${escapeXml(title)}</text>
    <text x="50%" y="${Math.round(labelH * .74)}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${Math.round(10 * sx)}" font-weight="700" letter-spacing="${Math.round(2 * sx)}" fill="#27211d">DIFUSOR AUTO</text>
    <text x="50%" y="${Math.round(labelH * .86)}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${Math.round(11 * sx)}" font-weight="700" letter-spacing="${Math.round(1.5 * sx)}" fill="#27211d">10 ml</text>
  </svg>`);

  const label = await sharp({ create: { width: labelW, height: labelH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      { input: labelSvg, left: 0, top: 0 },
      { input: labelLogo, left: Math.round((labelW - labelLogoW) / 2), top: Math.round(labelH * .075) },
    ])
    .png().toBuffer();

  // The source has a professionally restored blank wooden face. Place the exact
  // official logo at the measured geometric centre of each individual cap.
  const capCenterX = Math.round(capCenters[slug] * sx);
  const capTop = Math.round(475 * sy);
  const capBottom = Math.round(697 * sy);
  const capCenterY = Math.round((capTop + capBottom) / 2);
  const capLogoMeta = await sharp(capLogo).metadata();
  const frontLogo = await darkLogo(Math.round(92 * sx));
  const frontLogoMeta = await sharp(frontLogo).metadata();

  let frontCleanup;
  if (fixFrontLogo && !frontBlank) {
    const cleanupW = Math.round(154 * sx);
    const cleanupH = Math.round(126 * sy);
    const cleanSample = await sharp(input)
      .extract({
        left: Math.round(521 * sx),
        top: Math.round(738 * sy),
        width: cleanupW,
        height: Math.round(54 * sy),
      })
      .resize(cleanupW, cleanupH, { fit: "fill" })
      .blur(.35)
      .png().toBuffer();
    const cleanMask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cleanupW}" height="${cleanupH}">
      <defs><filter id="f"><feGaussianBlur stdDeviation="8"/></filter></defs>
      <rect x="10" y="10" width="${cleanupW - 20}" height="${cleanupH - 20}" rx="18" fill="white" filter="url(#f)"/>
    </svg>`);
    frontCleanup = await sharp(cleanSample).ensureAlpha()
      .composite([{ input: cleanMask, blend: "dest-in" }]).png().toBuffer();
  }

  const output = path.join(outputDir, `${slug}.png`);
  const layers = [
    {
      input: capLogo,
      left: capCenterX - Math.round(capLogoMeta.width / 2),
      top: capCenterY - Math.round(capLogoMeta.height / 2),
      blend: "over",
    },
  ];
  if (fixFrontLogo) {
    if (!frontBlank) layers.push({
        input: frontCleanup,
        left: centerX - Math.round(77 * sx),
        top: Math.round(770 * sy),
        blend: "over",
      });
    layers.push({
      input: frontLogo,
      left: centerX - Math.round(frontLogoMeta.width / 2),
      top: Math.round(778 * sy),
      blend: "over",
    });
  }
  if (!capOnly) layers.push({ input: label, left: labelLeft, top: labelTop, blend: "over" });
  await sharp(input).composite(layers).png({ compressionLevel: 9 }).toFile(output);
  console.log(output);
}
