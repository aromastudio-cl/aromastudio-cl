import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import sharp from "sharp";

const [productSlug, sizeValue, file] = process.argv.slice(2);
if (!productSlug || !sizeValue || !file) {
  throw new Error("Uso: <product-slug> <size-value> <archivo-webp>");
}

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Faltan credenciales Supabase");

const supabase = createClient(url, key, { auth: { persistSession: false } });
const { data: product, error: productError } = await supabase
  .from("products")
  .select("id,name,slug,categories(slug),product_variants(id,name,size_value,size_unit,scents(slug))")
  .eq("slug", productSlug)
  .single();
if (productError) throw productError;

const isStandardSize = ["unidad", "estandar", "standard"].includes(sizeValue.toLowerCase());
const variant = isStandardSize
  ? product.product_variants.find((item) => item.size_value == null)
  : product.product_variants.find((item) => String(Number(item.size_value)) === String(Number(sizeValue)));
if (!variant) throw new Error(`No existe variante ${sizeValue} para ${productSlug}`);

const bytes = await readFile(file);
const metadata = await sharp(bytes).metadata();
const digest = createHash("sha256").update(bytes).digest("hex").slice(0, 12);
const sizeSegment = variant.size_value == null ? "estandar" : `${Number(variant.size_value)}-${variant.size_unit}`;
const storagePath = `${product.categories.slug}/${variant.scents.slug}/${product.slug}-${sizeSegment}-${digest}.webp`;

const { error: uploadError } = await supabase.storage.from("product-images").upload(storagePath, bytes, {
  contentType: "image/webp",
  cacheControl: "31536000",
  upsert: false,
});
if (uploadError && !/already exists/i.test(uploadError.message)) throw uploadError;

const { data: publicFile } = supabase.storage.from("product-images").getPublicUrl(storagePath);
const row = {
  product_id: product.id,
  variant_id: variant.id,
  image_url: publicFile.publicUrl,
  storage_path: storagePath,
  alt_text: `${product.name} ${variant.name} de Aroma Studio`,
  width: metadata.width,
  height: metadata.height,
  file_size_bytes: bytes.length,
  mime_type: "image/webp",
  sort_order: 0,
  is_primary: true,
  active: true,
};

const { data: current, error: currentError } = await supabase
  .from("product_images")
  .select("id")
  .eq("variant_id", variant.id)
  .eq("is_primary", true)
  .maybeSingle();
if (currentError) throw currentError;

const result = current
  ? await supabase.from("product_images").update(row).eq("id", current.id)
  : await supabase.from("product_images").insert(row);
if (result.error) throw result.error;

console.log(JSON.stringify({ variant: variant.name, storagePath, publicUrl: publicFile.publicUrl, bytes: bytes.length, width: metadata.width, height: metadata.height }, null, 2));
