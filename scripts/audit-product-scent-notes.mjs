import { createClient } from "@supabase/supabase-js";

const officialNotes = {
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

const expectedCategories = [
  "home-spray",
  "mikados-varilla",
  "esencias-puras",
  "difusor-auto",
  "humidificadores",
];

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error("Faltan credenciales de Supabase.");

const supabase = createClient(url, key, { auth: { persistSession: false } });
const { data: products, error } = await supabase
  .from("products")
  .select("id,name,slug,scent_notes,active,categories(name,slug),product_variants(id,name,active,scents(name,slug,notes))")
  .eq("active", true)
  .order("slug");
if (error) throw error;

const issues = [];
const combinations = new Set();

for (const product of products ?? []) {
  const categorySlug = product.categories?.slug;
  const variantScents = [...new Map(
    (product.product_variants ?? [])
      .filter((variant) => variant.active !== false && variant.scents)
      .map((variant) => [variant.scents.slug, variant.scents]),
  ).values()];

  if (!expectedCategories.includes(categorySlug)) {
    issues.push(`${product.slug}: categoría inesperada ${categorySlug ?? "vacía"}`);
    continue;
  }
  if (variantScents.length !== 1) {
    issues.push(`${product.slug}: debe tener exactamente un aroma activo; tiene ${variantScents.length}`);
    continue;
  }

  const scent = variantScents[0];
  const official = officialNotes[scent.slug];
  const expectedProductSlug = `${categorySlug}-${scent.slug}`;
  combinations.add(`${categorySlug}/${scent.slug}`);

  if (!official) issues.push(`${product.slug}: aroma no reconocido ${scent.slug}`);
  if (product.slug !== expectedProductSlug) issues.push(`${product.slug}: debería ser ${expectedProductSlug}`);
  if (scent.notes !== official) issues.push(`${product.slug}: las notas maestras no coinciden con la tabla oficial`);
  if (product.scent_notes !== official) issues.push(`${product.slug}: las notas del producto no coinciden con la tabla oficial`);
  if (!product.name.toLocaleLowerCase("es").includes(scent.name.toLocaleLowerCase("es"))) {
    issues.push(`${product.slug}: el nombre no incluye el aroma ${scent.name}`);
  }
}

for (const categorySlug of expectedCategories) {
  for (const scentSlug of Object.keys(officialNotes)) {
    if (!combinations.has(`${categorySlug}/${scentSlug}`)) {
      issues.push(`Falta la combinación ${categorySlug}/${scentSlug}`);
    }
  }
}

const summary = {
  productsChecked: products?.length ?? 0,
  scentsChecked: Object.keys(officialNotes).length,
  categoriesChecked: expectedCategories.length,
  expectedCombinations: expectedCategories.length * Object.keys(officialNotes).length,
  issues,
};

console.log(JSON.stringify(summary, null, 2));
if (issues.length) process.exitCode = 1;
