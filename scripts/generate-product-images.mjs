import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Faltan credenciales Supabase");

const supabase = createClient(url, key, { auth: { persistSession: false } });
const sourceRoot = path.resolve("public/products/generated");
const outputRoot = path.resolve("tmp/catalog-images");
const officialLogoSource = await readFile(path.resolve("public/logo.png"));
const labelBackground = await readFile(path.resolve("scripts/assets/label-background.png"));

const logoRaster = sharp(officialLogoSource).resize({ width: 420, height: 388, fit: "contain" });
const { data: logoPixels, info: logoInfo } = await logoRaster.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (let i = 0; i < logoPixels.length; i += 4) {
  const darkness = 255 - Math.round((logoPixels[i] + logoPixels[i + 1] + logoPixels[i + 2]) / 3);
  logoPixels[i] = 23;
  logoPixels[i + 1] = 19;
  logoPixels[i + 2] = 15;
  logoPixels[i + 3] = darkness < 90 ? 0 : Math.min(255, (darkness - 90) * 2.1);
}
const officialLogo = await sharp(logoPixels, { raw: { width: logoInfo.width, height: logoInfo.height, channels: 4 } }).png().toBuffer();

const layouts = {
  "home-spray": [472, 525, 193, 360],
  "mikados-varilla": [438, 710, 222, 225],
  "esencias-puras": [444, 535, 211, 260],
  "difusor-auto": [420, 384, 285, 206],
  humidificadores: [401, 525, 300, 285],
};

const escapeXml = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const wrap = (value, max) => {
  const words = String(value).split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    if (`${line} ${word}`.trim().length > max && line) {
      lines.push(line);
      line = word;
    } else line = `${line} ${word}`.trim();
  }
  if (line) lines.push(line);
  return lines;
};

async function renderLabel({ width, height, fragrance, notes, productName, volume }) {
  const compact = height <= 225;
  const logoWidth = Math.round(width * (compact ? 0.34 : 0.40));
  const logoHeight = Math.round(logoWidth * (351 / 379));
  const logoTop = compact ? 9 : 14;
  const fragranceSize = compact ? (fragrance.length > 16 ? 11 : 15) : (fragrance.length > 18 ? 15 : 23);
  const fragranceLines = wrap(fragrance.toUpperCase(), compact ? 20 : 22).slice(0, 2);
  const fragranceY = logoTop + logoHeight + (compact ? 9 : 14);
  const fragranceStep = fragranceSize * 1.08;
  const subtitleY = fragranceY + fragranceLines.length * fragranceStep + (compact ? 8 : 12);
  const noteSize = compact ? 6.6 : Math.max(8, Math.round(width * 0.043));
  const noteCopy = notes?.trim()
    ? `NOTAS DE ${notes.trim().replace(/[.]$/, "")}.`.toUpperCase()
    : "NOTAS AROMÁTICAS PENDIENTES";
  const noteLines = wrap(noteCopy, compact ? 31 : 30).slice(0, compact ? 4 : 6);
  const notesY = subtitleY + (compact ? 20 : 31);
  const notesStep = noteSize * 1.25;
  const websiteSize = compact ? 6.2 : 8;
  const websiteY = height - (compact ? 9 : 13);
  const volumeY = volume ? websiteY - (compact ? 14 : 19) : null;
  const productY = (volumeY ?? websiteY) - (compact ? 14 : 20);

  const typography = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    ${fragranceLines.map((line, i) => `<text x="50%" y="${fragranceY + i * fragranceStep}" text-anchor="middle" font-family="Georgia, serif" font-size="${fragranceSize}" fill="#17130f">${escapeXml(line)}</text>`).join("")}
    <line x1="10%" y1="${subtitleY - (compact ? 5 : 7)}" x2="90%" y2="${subtitleY - (compact ? 5 : 7)}" stroke="#b68b50" stroke-width="0.7" opacity="0.7"/>
    <text x="50%" y="${subtitleY + (compact ? 4 : 5)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${compact ? 5.5 : 7.2}" letter-spacing="${compact ? 1.1 : 1.5}" fill="#332820">LUXURY HOME FRAGRANCE</text>
    ${noteLines.map((line, i) => `<text x="50%" y="${notesY + i * notesStep}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${noteSize}" fill="#211d18">${escapeXml(line)}</text>`).join("")}
    <text x="50%" y="${productY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${compact ? 8 : 11}" letter-spacing="0.25" fill="#211d18">${escapeXml(productName)}</text>
    ${volume ? `<text x="50%" y="${volumeY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${compact ? 11 : 15}" letter-spacing="1" fill="#17130f">${escapeXml(volume)}</text>` : ""}
    <text x="50%" y="${websiteY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${websiteSize}" fill="#17130f">www.aromastudio.cl</text>
  </svg>`);

  const background = await sharp(labelBackground).resize(width, height, { fit: "fill" }).png().toBuffer();
  const logo = await sharp(officialLogo).resize({ width: logoWidth, height: logoHeight, fit: "contain" }).png().toBuffer();
  return sharp(background).composite([
    { input: logo, left: Math.round((width - logoWidth) / 2), top: logoTop },
    { input: typography, left: 0, top: 0 },
  ]).png().toBuffer();
}

const { data: products, error } = await supabase
  .from("products")
  .select("id,name,slug,categories(name,slug),product_variants(id,name,size_value,size_unit,is_default,sort_order,active,scents(name,slug,notes))")
  .eq("active", true)
  .order("slug");
if (error) throw error;

await mkdir(outputRoot, { recursive: true });
let generated = 0;
for (const product of products ?? []) {
  const category = product.categories;
  const layout = layouts[category?.slug];
  if (!layout) continue;
  const variants = [...(product.product_variants ?? [])].sort((a, b) => Number(Boolean(b.is_default)) - Number(Boolean(a.is_default)) || (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const scent = variants[0]?.scents;
  if (!scent) throw new Error(`Producto sin fragancia: ${product.slug}`);
  const sourceSlug = product.slug.replace("fig-no-7", "fig-7");
  const source = path.join(sourceRoot, `${sourceSlug}.webp`);
  const [left, top, width, height] = layout;
  for (const variant of variants.filter((item) => item.active !== false)) {
    const volume = variant.size_unit === "ml" && variant.size_value ? `${Number(variant.size_value)} ml` : null;
    const label = await renderLabel({ width, height, fragrance: scent.name, notes: scent.notes, productName: category.name, volume });
    await sharp(source)
      .rotate()
      .composite([{ input: label, left, top }])
      .resize(1100, 1100, { fit: "cover" })
      .webp({ quality: 84, effort: 6, smartSubsample: true })
      .toFile(path.join(outputRoot, `${product.slug}--${variant.id}.webp`));
    generated++;
  }
}

console.log(`Generadas ${generated} imágenes de variante desde datos reales de Supabase.`);
