import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Faltan credenciales Supabase");
const supabase = createClient(url, key, { auth: { persistSession: false } });
const root = path.resolve("tmp/catalog-images");

const { data: products, error } = await supabase
  .from("products")
  .select("id,name,slug,categories(slug),product_variants(id,name,size_value,size_unit,active,is_default,sort_order,scents(slug))")
  .eq("active", true)
  .order("slug");
if (error) throw error;

let uploaded = 0;
let cursor = 0;
const startAt = Number.parseInt(process.argv[2] ?? "0", 10) || 0;
for (const product of products ?? []) {
  const categorySlug = product.categories?.slug;
  const variants = [...(product.product_variants ?? [])].sort((a, b) => Number(Boolean(b.is_default)) - Number(Boolean(a.is_default)) || (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const scentSlug = variants[0]?.scents?.slug;
  if (!categorySlug || !scentSlug) throw new Error(`Relaciones incompletas: ${product.slug}`);
  for (const variant of variants.filter((item) => item.active !== false)) {
    if (cursor++ < startAt) continue;
    const bytes = await readFile(path.join(root, `${product.slug}--${variant.id}.webp`));
    const metadata = await sharp(bytes).metadata();
    const digest = createHash("sha256").update(bytes).digest("hex").slice(0, 12);
    const sizeSlug = variant.size_value && variant.size_unit ? `${Number(variant.size_value)}-${variant.size_unit}` : "estandar";
    const storagePath = `${categorySlug}/${scentSlug}/${product.slug}-${sizeSlug}-${digest}.webp`;
    const { error: uploadError } = await supabase.storage.from("product-images").upload(storagePath, bytes, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
    if (uploadError && !/already exists/i.test(uploadError.message)) throw uploadError;
    const { data: publicFile } = supabase.storage.from("product-images").getPublicUrl(storagePath);
    const row = { product_id: product.id, variant_id: variant.id, image_url: publicFile.publicUrl, storage_path: storagePath, alt_text: `${product.name} ${variant.name} de Aroma Studio`, width: metadata.width, height: metadata.height, file_size_bytes: bytes.length, mime_type: "image/webp", sort_order: variant.sort_order ?? 0, is_primary: true, active: true };
    const { data: current } = await supabase.from("product_images").select("id").eq("variant_id", variant.id).eq("is_primary", true).maybeSingle();
    const result = current ? await supabase.from("product_images").update(row).eq("id", current.id) : await supabase.from("product_images").insert(row);
    if (result.error) throw result.error;
    uploaded++;
    console.log(`OK ${product.slug} ${variant.name} (${Math.round(bytes.length / 1024)} KB)`);
  }
}

const { error: staleReferenceError } = await supabase
  .from("product_images")
  .delete()
  .is("variant_id", null);
if (staleReferenceError) throw staleReferenceError;

console.log(`Sincronizadas ${uploaded} imágenes en product-images.`);
