import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Faltan credenciales Supabase");

const supabase = createClient(url, key, { auth: { persistSession: false } });
const { data: products, error } = await supabase
  .from("products")
  .select("id,slug,active,categories(slug),product_variants(id,name,size_value,size_unit,active,product_images(id,image_url,storage_path,width,height,file_size_bytes,mime_type,is_primary,active))")
  .eq("active", true);
if (error) throw error;

const variants = products.flatMap((product) =>
  product.product_variants
    .filter((variant) => variant.active)
    .map((variant) => ({ product, variant }))
);

const rows = [];
const missing = [];
const duplicatePrimary = [];
const sizePathMismatches = [];
for (const { product, variant } of variants) {
  const primary = variant.product_images.filter((image) => image.active && image.is_primary);
  if (primary.length === 0) missing.push(`${product.slug}:${variant.size_value ?? "estandar"}`);
  if (primary.length > 1) duplicatePrimary.push(`${product.slug}:${variant.size_value ?? "estandar"}`);
  if (primary[0]) {
    const expectedSize = variant.size_value == null
      ? "estandar"
      : `${Number(variant.size_value)}-${variant.size_unit}`;
    if (!primary[0].storage_path.includes(`-${expectedSize}-`)) {
      sizePathMismatches.push({
        product: product.slug,
        expectedSize,
        storagePath: primary[0].storage_path,
      });
    }
    rows.push({ category: product.categories.slug, product, variant, image: primary[0] });
  }
}

const urlChecks = [];
for (let i = 0; i < rows.length; i += 8) {
  const batch = rows.slice(i, i + 8);
  const checked = await Promise.all(batch.map(async ({ product, variant, image }) => {
    try {
      const response = await fetch(image.image_url, { method: "HEAD" });
      return { slug: product.slug, size: variant.size_value, status: response.status, ok: response.ok };
    } catch (checkError) {
      return { slug: product.slug, size: variant.size_value, status: 0, ok: false, error: checkError.message };
    }
  }));
  urlChecks.push(...checked);
}

const byCategory = Object.fromEntries(
  [...new Set(rows.map((row) => row.category))].sort().map((category) => [
    category,
    rows.filter((row) => row.category === category).length,
  ])
);

const report = {
  activeProducts: products.length,
  activeVariants: variants.length,
  primaryImages: rows.length,
  byCategory,
  missing,
  duplicatePrimary,
  sizePathMismatches,
  all900x1125: rows.every(({ image }) => image.width === 900 && image.height === 1125),
  allWebP: rows.every(({ image }) => image.mime_type === "image/webp" && image.storage_path.endsWith(".webp")),
  allInProductImagesBucket: rows.every(({ image }) => image.image_url.includes("/storage/v1/object/public/product-images/")),
  allUnder150KiB: rows.every(({ image }) => image.file_size_bytes < 153600),
  minBytes: Math.min(...rows.map(({ image }) => image.file_size_bytes)),
  maxBytes: Math.max(...rows.map(({ image }) => image.file_size_bytes)),
  publicUrlsOk: urlChecks.filter((item) => item.ok).length,
  publicUrlsFailed: urlChecks.filter((item) => !item.ok),
};

console.log(JSON.stringify(report, null, 2));
if (
  report.activeVariants !== 77 ||
  report.primaryImages !== 77 ||
  report.missing.length ||
  report.duplicatePrimary.length ||
  report.sizePathMismatches.length ||
  !report.all900x1125 ||
  !report.allWebP ||
  !report.allInProductImagesBucket ||
  !report.allUnder150KiB ||
  report.publicUrlsOk !== 77
) process.exitCode = 1;
