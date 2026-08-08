import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: categories, error: categoryError } = await supabase.from("categories").select("id,name,slug").eq("active", true);
const { data: scents, error: scentError } = await supabase.from("scents").select("id,name,slug,notes").eq("active", true).order("sort_order");
if (categoryError || scentError) throw categoryError || scentError;

const formats = {
  "home-spray": { prefix: "HS", variants: [{ name: "120 ml", size: 120, unit: "ml", price: 6900, stock: 24 }, { name: "250 ml", size: 250, unit: "ml", price: 12900, stock: 18 }] },
  "mikados-varilla": { prefix: "MK", variants: [{ name: "50 ml", size: 50, unit: "ml", price: 9900, stock: 20 }, { name: "150 ml", size: 150, unit: "ml", price: 14900, stock: 14 }] },
  "esencias-puras": { prefix: "EP", variants: [{ name: "Gotario 10 ml", size: 10, unit: "ml", price: 5900, stock: 30 }, { name: "Pack 2 x 10 ml", size: 20, unit: "ml", price: 10000, stock: 16 }] },
  "difusor-auto": { prefix: "DA", variants: [{ name: "Unidad", size: 1, unit: "unidad", price: 5900, stock: 26 }, { name: "Pack 2 unidades", size: 2, unit: "unidad", price: 10000, stock: 14 }] },
  humidificadores: { prefix: "HU", variants: [{ name: "Humidificador con esencia 10 ml", size: 1, unit: "unidad", price: 19900, stock: 10 }] },
};
const scentCodes = { mango:"MANGO", "bubble-gum":"BUBBLE", verbena:"VERB", "cedron-limon-menta":"CEDRON", "red-velvet":"REDVEL", infinity:"INFINITY", "green-elixir":"GREEN", "manzana-canela":"MANZCAN", "noir-coffee":"NOIR", "fig-no-7":"FIG7", "soleil-blanc":"SOLEIL" };

const products = [];
for (const category of categories) {
  const format = formats[category.slug];
  if (!format) continue;
  for (const scent of scents) {
    const stock = format.variants.reduce((sum, variant) => sum + variant.stock, 0);
    products.push({
      category_id: category.id,
      name: `${category.name} ${scent.name}`,
      slug: `${category.slug}-${scent.slug}`,
      description: `${category.name} con fragancia ${scent.name}.`,
      scent_notes: scent.notes,
      sku: `AS-${format.prefix}-${scentCodes[scent.slug]}`,
      price_clp: Math.min(...format.variants.map(variant => variant.price)),
      stock,
      active: true,
      featured: scent.slug === "mango" || scent.slug === "verbena" || scent.slug === "green-elixir",
    });
  }
}

const { error: productError } = await supabase.from("products").upsert(products, { onConflict: "slug" });
if (productError) throw productError;
const slugs = products.map(product => product.slug);
const { data: savedProducts, error: savedError } = await supabase.from("products").select("id,slug,category_id").in("slug", slugs);
if (savedError) throw savedError;
const productMap = new Map(savedProducts.map(product => [product.slug, product]));
const categoryMap = new Map(categories.map(category => [category.id, category]));
const generatedIds = savedProducts.map(product => product.id);

const { error: deleteError } = await supabase.from("product_variants").delete().in("product_id", generatedIds);
if (deleteError) throw deleteError;

const variants = [];
for (const product of products) {
  const saved = productMap.get(product.slug);
  const category = categoryMap.get(saved.category_id);
  const format = formats[category.slug];
  const scentSlug = product.slug.slice(category.slug.length + 1);
  const scent = scents.find(item => item.slug === scentSlug);
  format.variants.forEach((variant, index) => variants.push({
    product_id: saved.id,
    scent_id: scent.id,
    name: variant.name,
    sku: `${product.sku}-${variant.size}${variant.unit === "unidad" ? "U" : variant.unit.toUpperCase()}`,
    size_value: variant.size,
    size_unit: variant.unit,
    price_clp: variant.price,
    stock: variant.stock,
    low_stock_threshold: 5,
    active: true,
    is_default: index === 0,
    sort_order: index + 1,
  }));
}
const { error: variantError } = await supabase.from("product_variants").insert(variants);
if (variantError) throw variantError;
console.log(JSON.stringify({ products: products.length, variants: variants.length, humidifierPrice: 19900 }));
