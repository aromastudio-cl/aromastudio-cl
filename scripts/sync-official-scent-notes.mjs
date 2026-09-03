import { createClient } from "@supabase/supabase-js";

const notesBySlug = {
  mango: "Mango, piña, manzana, durazno, coco, naranja, jazmín, muguet, algodón de azúcar y almizcle",
  "bubble-gum": "Naranja, mandarina, plátano, frutos rojos, jazmín, violetas, tutti frutti y algodón de azúcar",
  verbena: "Limón, lima, verbena, jazmín, muguet y almizcle",
  "cedron-limon-menta": "Cáscara de limón, hojas de menta, verbena, notas herbales y notas maderosas de cedro",
  "manzana-canela": "Manzana fresca, canela y notas especiadas dulces",
  infinity: "Melón, pepino, tallo de bambú, muguet, jazmín, violeta, notas ozónicas, cedro y almizcle",
  "red-velvet": "Frutilla, guinda, piña, pera, frambuesa, plátano y durazno; notas especiadas de anís y algodón de azúcar",
  "green-elixir": "Bergamota y pomelo, manzana, menta, cardamomo, albahaca, jazmín, rosa, cedro, sándalo, musgo, tonka, ámbar y almizcle",
  "noir-coffee": "Café, capuchino, naranja, vainilla y cedro",
  "fig-no-7": "Bergamota, higo, cassis, leche de coco y jazmín",
  "soleil-blanc": "Coco, leche de coco, flor de vainilla y algodón de azúcar",
};

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error("Faltan las credenciales de Supabase.");

const supabase = createClient(url, key, { auth: { persistSession: false } });
const slugs = Object.keys(notesBySlug);
const { data: scents, error: scentError } = await supabase
  .from("scents")
  .select("id,slug")
  .in("slug", slugs);
if (scentError) throw scentError;

const foundSlugs = new Set((scents ?? []).map((scent) => scent.slug));
const missingSlugs = slugs.filter((slug) => !foundSlugs.has(slug));
if (missingSlugs.length) throw new Error(`No se encontraron aromas: ${missingSlugs.join(", ")}`);

for (const scent of scents) {
  const notes = notesBySlug[scent.slug];
  const { error } = await supabase.from("scents").update({ notes }).eq("id", scent.id);
  if (error) throw error;

  const { data: variants, error: variantError } = await supabase
    .from("product_variants")
    .select("product_id")
    .eq("scent_id", scent.id);
  if (variantError) throw variantError;

  const productIds = [...new Set((variants ?? []).map((variant) => variant.product_id))];
  if (productIds.length) {
    const { error: productError } = await supabase
      .from("products")
      .update({ scent_notes: notes, updated_at: new Date().toISOString() })
      .in("id", productIds);
    if (productError) throw productError;
  }
}

console.log(`Notas sincronizadas para ${slugs.length} aromas.`);
