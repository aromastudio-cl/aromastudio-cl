import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { productVariantHref, variantPathSegment } from "../../../../lib/product-routes";
import { createPublicSupabaseClient } from "../../../../lib/supabase-server";
import ProductDetail, { type ProductDetailData } from "./product-detail";
import "./product-detail.css";

type RouteParams = { slug: string; variant: string };

const getProduct = cache(async ({ slug, variant: variantSegment }: RouteParams): Promise<ProductDetailData | null> => {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("id,slug,name,description,scent_notes,sku,active,categories(name,slug),product_variants(id,name,sku,price_clp,stock,size_value,size_unit,active,sort_order,scents(name,slug)),product_images(variant_id,image_url,is_primary,sort_order,active)")
    .eq("slug", slug)
    .eq("active", true)
    .single();

  if (error || !data) return null;
  const product = data as any;
  const variants = (product.product_variants ?? [])
    .filter((item: any) => item.active !== false)
    .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const selected = variants.find((item: any) => variantPathSegment(item.size_value, item.size_unit) === variantSegment);
  if (!selected) return null;

  const activeImages = (product.product_images ?? []).filter((image: any) => image.active !== false);
  const image = activeImages.find((item: any) => item.variant_id === selected.id && item.is_primary)?.image_url
    ?? activeImages.find((item: any) => item.variant_id === selected.id)?.image_url
    ?? activeImages.find((item: any) => item.is_primary)?.image_url
    ?? "/logo-hd.png";

  const { data: approvedReviews } = await supabase
    .from("product_reviews")
    .select("id,reviewer_name,rating,comment,created_at,variant_id")
    .eq("product_id", product.id)
    .order("created_at", { ascending: false });
  const variantNames = new Map<string, string>(variants.map((item: any) => [item.id, item.name]));

  return {
    productId: product.id,
    name: product.name,
    aroma: selected.scents?.name ?? product.name,
    category: product.categories?.name ?? "Aroma Studio",
    description: product.description ?? `${product.name}, fragancia premium Aroma Studio.`,
    notes: product.scent_notes ?? "Fragancia premium seleccionada",
    sku: selected.sku ?? product.sku,
    image,
    price: selected.price_clp,
    stock: selected.stock,
    variantId: selected.id,
    variantName: selected.name,
    options: variants.map((item: any) => ({
      id: item.id,
      name: item.name,
      href: productVariantHref(product.slug, item.size_value, item.size_unit),
      price: item.price_clp,
      stock: item.stock,
      active: item.active !== false,
    })),
    reviews: (approvedReviews ?? []).map((review: any) => ({
      id: review.id,
      reviewerName: review.reviewer_name,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.created_at,
      variantName: review.variant_id ? variantNames.get(review.variant_id) ?? null : null,
    })),
  };
});

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const product = await getProduct(await params);
  if (!product) return { title: "Producto no encontrado | Aroma Studio" };
  return {
    title: `${product.name} ${product.variantName} | Aroma Studio`,
    description: `${product.name} ${product.variantName}. ${product.notes}. Compra online con envíos a todo Chile.`,
    openGraph: { title: `${product.name} ${product.variantName}`, description: product.notes, images: [product.image] },
  };
}

export default async function ProductPage({ params }: { params: Promise<RouteParams> }) {
  const product = await getProduct(await params);
  if (!product) notFound();
  return <ProductDetail product={product} />;
}
