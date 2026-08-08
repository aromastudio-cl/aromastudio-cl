import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const catalog = {
  "esencias-puras": [
    { name: "Gotario 10 ml", size_value: 10, size_unit: "ml", price_clp: 5900 },
  ],
  humidificadores: [
    { name: "Humidificador", size_value: null, size_unit: "unidad", price_clp: 15000 },
  ],
  "difusor-auto": [
    { name: "Difusor auto 10 ml", size_value: 10, size_unit: "ml", price_clp: 5900 },
  ],
  "mikados-varilla": [
    { name: "50 ml", size_value: 50, size_unit: "ml", price_clp: 9900 },
    { name: "150 ml", size_value: 150, size_unit: "ml", price_clp: 14900 },
  ],
  "home-spray": [
    { name: "120 ml", size_value: 120, size_unit: "ml", price_clp: 6900 },
    { name: "250 ml", size_value: 250, size_unit: "ml", price_clp: 12900 },
  ],
};

const { data: products, error } = await supabase
  .from("products")
  .select("id,name,categories(slug),product_variants(id,sort_order,stock),product_images(id,is_primary)")
  .eq("active", true);

if (error) throw error;

const updates = [];
let updatedProducts = 0;
let updatedVariants = 0;

for (const product of products) {
  const category = product.categories?.slug;
  const expected = catalog[category];
  if (!expected) continue;

  const variants = [...(product.product_variants ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
  if (variants.length !== expected.length) {
    throw new Error(`${product.name}: se esperaban ${expected.length} variantes y existen ${variants.length}`);
  }
  if (!(product.product_images ?? []).length) {
    throw new Error(`${product.name}: no tiene fotografía asociada`);
  }

  const totalStock = variants.reduce((sum, item) => sum + Number(item.stock || 0), 0);
  updates.push(supabase.from("products").update({ price_clp: expected[0].price_clp, stock: totalStock, updated_at: new Date().toISOString() }).eq("id", product.id));
  updatedProducts += 1;

  for (let index = 0; index < expected.length; index += 1) {
    updates.push(supabase.from("product_variants").update({
        ...expected[index],
        is_default: index === 0,
        sort_order: index + 1,
        active: true,
      }).eq("id", variants[index].id));
    updatedVariants += 1;
  }
}

const results = await Promise.all(updates);
const failed = results.find((result) => result.error);
if (failed?.error) throw failed.error;

console.log(JSON.stringify({ updatedProducts, updatedVariants }));
