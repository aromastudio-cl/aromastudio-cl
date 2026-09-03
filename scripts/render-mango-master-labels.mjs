import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Faltan credenciales Supabase");
const supabase = createClient(url, key, { auth: { persistSession: false } });
const logo = await readFile(path.resolve("public/logo.png"));
const root = path.resolve("art-direction/masters");
const reviewRoot = path.resolve("art-direction/review");
await mkdir(reviewRoot, { recursive: true });

const masters = {
  "home-spray": { source: "master-home-spray-mango.png", output: "mango-home-spray.webp", box: [656, 783, 333, 865], pick: "largest" },
  "mikados-varilla": { source: "master-mikado-mango.png", output: "mango-mikado.webp", box: [665, 1144, 278, 488], pick: "largest" },
  "difusor-auto": { source: "master-difusor-auto-mango.png", output: "mango-difusor-auto.webp", box: [622, 1269, 356, 360], pick: "default" },
  "esencias-puras": { source: "master-esencia-pura-mango.png", output: "mango-esencia-pura.webp", box: [603, 900, 384, 670], pick: "default" },
};

const escapeXml = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const wrap = (value, max) => {
  const words = String(value).split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    if (`${line} ${word}`.trim().length > max && line) { lines.push(line); line = word; }
    else line = `${line} ${word}`.trim();
  }
  if (line) lines.push(line);
  return lines;
};

async function makeTypography(width, height, { fragrance, notes, productName, volume }) {
  const compact = height < 450;
  const logoW = Math.round(width * 0.43);
  const logoH = Math.round(logoW * 351 / 379);
  const logoTop = Math.round(height * 0.035);
  const fragranceSize = compact ? 27 : Math.round(width * 0.095);
  const fragranceY = logoTop + logoH + Math.round(height * 0.035);
  const noteSize = compact ? 12 : Math.max(13, Math.round(width * 0.042));
  const notesY = fragranceY + fragranceSize + Math.round(height * 0.055);
  const notesLines = wrap(`NOTAS DE ${notes.replace(/[.]$/, "")}.`.toUpperCase(), compact ? 34 : 32).slice(0, compact ? 5 : 7);
  const noteStep = noteSize * 1.25;
  const websiteY = height - Math.round(height * 0.025);
  const volumeY = volume ? websiteY - (compact ? 22 : 30) : null;
  const productY = (volumeY ?? websiteY) - (compact ? 23 : 34);
  const text = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <text x="50%" y="${fragranceY}" text-anchor="middle" font-family="Georgia,serif" font-size="${fragranceSize}" fill="#17130f">${escapeXml(fragrance.toUpperCase())}</text>
    ${notesLines.map((line, index) => `<text x="50%" y="${notesY + index * noteStep}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${noteSize}" fill="#211d18">${escapeXml(line)}</text>`).join("")}
    <text x="50%" y="${productY}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${compact ? 15 : 19}" fill="#211d18">${escapeXml(productName)}</text>
    ${volume ? `<text x="50%" y="${volumeY}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${compact ? 18 : 23}" fill="#17130f">${escapeXml(volume)}</text>` : ""}
    <text x="50%" y="${websiteY}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${compact ? 12 : 15}" fill="#17130f">www.aromastudio.cl</text>
  </svg>`);
  const logoLayer = await sharp(logo).resize({ width: logoW, height: logoH, fit: "contain", withoutEnlargement: true }).png().toBuffer();
  return sharp({ create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([
    { input: logoLayer, left: Math.round((width - logoW) / 2), top: logoTop },
    { input: text, left: 0, top: 0 },
  ]).png().toBuffer();
}

for (const [categorySlug, config] of Object.entries(masters)) {
  const { data: product, error } = await supabase.from("products")
    .select("categories(name),product_variants(name,size_value,size_unit,is_default,sort_order,scents(name,notes))")
    .eq("slug", `${categorySlug}-mango`).single();
  if (error) throw error;
  const variants = [...product.product_variants].sort((a, b) => config.pick === "largest"
    ? Number(b.size_value ?? 0) - Number(a.size_value ?? 0)
    : Number(Boolean(b.is_default)) - Number(Boolean(a.is_default)) || (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const variant = variants[0];
  const scent = variant.scents;
  const volume = variant.size_unit === "ml" && variant.size_value ? `${Number(variant.size_value)} ml` : null;
  const [left, top, width, height] = config.box;
  const label = await makeTypography(width, height, { fragrance: scent.name, notes: scent.notes, productName: product.categories.name, volume });
  await sharp(path.join(root, config.source)).composite([{ input: label, left, top }]).webp({ quality: 90, effort: 6 }).toFile(path.join(reviewRoot, config.output));
}

console.log("4 masters Mango etiquetados para revisión; no se subieron a Supabase.");
