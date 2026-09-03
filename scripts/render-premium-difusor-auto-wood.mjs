import sharp from "sharp";
import { readFile } from "node:fs/promises";

const catalog = {
  "bubble-gum": ["BUBBLE GUM", ["NARANJA, MANDARINA, PLÁTANO,", "FRUTOS ROJOS, JAZMÍN, VIOLETAS,", "TUTTI FRUTTI Y ALGODÓN DE AZÚCAR."]],
  "cedron-limon-menta": ["CEDRÓN LIMÓN &amp; MENTA", ["CÁSCARA DE LIMÓN, HOJAS DE MENTA,", "VERBENA, NOTAS HERBALES Y", "NOTAS MADEROSAS DE CEDRO."]],
  "fig-no-7": ["FIG N° 7", ["BERGAMOTA, HIGO, CASSIS,", "LECHE DE COCO Y JAZMÍN."]],
  "green-elixir": ["GREEN ELIXIR", ["BERGAMOTA, POMELO, MANZANA, MENTA,", "CARDAMOMO, ALBAHACA, JAZMÍN, ROSA,", "CEDRO, SÁNDALO, MUSGO, TONKA,", "ÁMBAR Y ALMIZCLE."]],
  infinity: ["INFINITY", ["MELÓN, PEPINO, TALLO DE BAMBÚ,", "MUGUET, JAZMÍN, VIOLETA,", "NOTAS OZÓNICAS, CEDRO Y ALMIZCLE."]],
  mango: ["MANGO", ["MANGO, PIÑA, MANZANA, DURAZNO,", "COCO, NARANJA, JAZMÍN, MUGUET,", "ALGODÓN DE AZÚCAR Y ALMIZCLE."]],
  "manzana-canela": ["MANZANA CANELA", ["MANZANA FRESCA, CANELA Y", "NOTAS ESPECIADAS DULCES."]],
  "noir-coffee": ["NOIR COFFEE", ["CAFÉ, CAPUCHINO, NARANJA,", "VAINILLA Y CEDRO."]],
  "red-velvet": ["RED VELVET", ["FRUTILLA, GUINDA, PIÑA, PERA,", "FRAMBUESA, PLÁTANO Y DURAZNO;", "ANÍS Y ALGODÓN DE AZÚCAR."]],
  "soleil-blanc": ["SOLEIL BLANC", ["COCO, LECHE DE COCO,", "FLOR DE VAINILLA Y", "ALGODÓN DE AZÚCAR."]],
  verbena: ["VERBENA", ["LIMÓN, LIMA, VERBENA, JAZMÍN,", "MUGUET Y ALMIZCLE."]],
};

const slug = process.argv[2];
const item = catalog[slug];
if (!item) throw new Error(`Aroma no soportado: ${slug}`);
const [name] = item;
const base = `art-direction/candidates/difusor-auto-${slug}-wood-base.png`;
const out = `art-direction/candidates/difusor-auto-${slug}-10-premium`;

const src = await readFile("public/logo.png");
const makeLogo = async (width, height, color, maxAlpha) => {
  const { data, info } = await sharp(src)
    // Remove the faint right-edge seam present in the raster master.
    .extract({ left: 0, top: 0, width: 330, height: 347 })
    .resize({ width, height, fit: "contain" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const x = (i / 4) % info.width;
    const darkness = 255 - Math.round((data[i] + data[i + 1] + data[i + 2]) / 3);
    data[i] = color[0]; data[i + 1] = color[1]; data[i + 2] = color[2];
    data[i + 3] = darkness < 80 || x < info.width * 0.13 || x > info.width * 0.87
      ? 0
      : Math.min(maxAlpha, (darkness - 80) * 2.2);
  }

  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
};

const capLogo = await makeLogo(116, 106, [74, 44, 22], 205);
const labelLogo = await makeLogo(96, 88, [24, 22, 20], 240);

const w = 292;
const h = 445;
const titleSize = name.length > 19 ? 15 : name.length > 14 ? 17 : 22;
const ink = "#211d1a";
const art = Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <text x="146" y="332" text-anchor="middle" font-family="Georgia,serif" font-size="${titleSize}" font-weight="500" letter-spacing=".25" fill="#b66f78">${name}</text>
  <text x="146" y="374" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" font-weight="700" letter-spacing="2.2" fill="${ink}">DIFUSOR AUTO</text>
  <text x="146" y="403" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" font-weight="600" letter-spacing="1.5" fill="${ink}">10 ml</text>
</svg>`);

const engraving = await sharp({ create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([
    { input: capLogo, left: 88, top: 3 },
    { input: labelLogo, left: 98, top: 211 },
    { input: art, left: 0, top: 0 },
  ])
  .png()
  .toBuffer();

const final = await sharp(base).composite([{ input: engraving, left: 481, top: 515, blend: "multiply" }]).png().toBuffer();
await sharp(final).png({ compressionLevel: 9 }).toFile(`${out}.png`);
await sharp(final).resize({ width: 900, height: 1125, fit: "cover" }).webp({ quality: 87, effort: 6, smartSubsample: true }).toFile(`${out}.webp`);
console.log(`${out}.webp`);
