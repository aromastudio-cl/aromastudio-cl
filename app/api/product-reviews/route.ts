import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function serverClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Falta la configuración privada de Supabase");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") ?? 0) > 8_000) {
    return NextResponse.json({ error: "El comentario es demasiado extenso." }, { status: 413 });
  }
  let input: Record<string, unknown>;
  try { input = await request.json(); }
  catch { return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 }); }

  if (String(input.website ?? "").trim()) return NextResponse.json({ ok: true, pending: true }, { status: 202 });
  const productId = String(input.productId ?? "");
  const variantId = String(input.variantId ?? "");
  const reviewerName = String(input.reviewerName ?? "").trim().replace(/\s+/g, " ");
  const comment = String(input.comment ?? "").trim().replace(/\s+/g, " ");
  const rating = Number(input.rating);
  if (!/^[0-9a-f-]{36}$/i.test(productId) || !/^[0-9a-f-]{36}$/i.test(variantId)) return NextResponse.json({ error: "Producto inválido." }, { status: 400 });
  if (reviewerName.length < 2 || reviewerName.length > 80) return NextResponse.json({ error: "Escribe un nombre válido." }, { status: 400 });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: "Selecciona una calificación." }, { status: 400 });
  if (comment.length < 1 || comment.length > 1200) return NextResponse.json({ error: "El comentario debe tener entre 1 y 1.200 caracteres." }, { status: 400 });

  const supabase = serverClient();
  const { data: variant } = await supabase.from("product_variants").select("id").eq("id", variantId).eq("product_id", productId).eq("active", true).maybeSingle();
  if (!variant) return NextResponse.json({ error: "El producto ya no está disponible." }, { status: 404 });
  const { error } = await supabase.from("product_reviews").insert({ product_id: productId, variant_id: variantId, reviewer_name: reviewerName, rating, comment, status: "pending" });
  if (error) {
    console.error("No se pudo guardar el comentario", error.code);
    return NextResponse.json({ error: "No pudimos guardar tu comentario. Intenta nuevamente." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, pending: true }, { status: 201 });
}
