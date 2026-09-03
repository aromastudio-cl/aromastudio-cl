import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Falta configurar Supabase en el servidor.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function authorize(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const client = adminClient();
  const { data, error } = await client.auth.getUser(token);
  if (error || data.user?.app_metadata?.role !== "admin") return null;
  return client;
}

export async function GET(request: NextRequest) {
  try {
    const client = await authorize(request);
    if (!client) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    const { data, error } = await client.from("customer_profiles").select("id,email,full_name,phone,created_at").order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ customers: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No fue posible cargar los clientes." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = await authorize(request);
    if (!client) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const fullName = String(body.full_name ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    if (!fullName || !email) return NextResponse.json({ error: "Nombre y correo son obligatorios." }, { status: 400 });
    if (fullName.length < 3) return NextResponse.json({ error: "Ingresa el nombre completo del cliente." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Ingresa un correo electrónico válido." }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres." }, { status: 400 });

    const { data, error } = await client.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone },
    });
    if (error) {
      if (/already|registered|exists/i.test(error.message)) return NextResponse.json({ error: "Ya existe un cliente con este correo electrónico." }, { status: 409 });
      throw error;
    }
    if (!data.user) throw new Error("Supabase no devolvió el usuario creado.");

    const { error: profileError } = await client.from("customer_profiles").upsert({
      id: data.user.id,
      email,
      full_name: fullName,
      phone,
      updated_at: new Date().toISOString(),
    });
    if (profileError) {
      await client.auth.admin.deleteUser(data.user.id);
      throw profileError;
    }
    return NextResponse.json({ customer: { id: data.user.id, email, full_name: fullName, phone, created_at: data.user.created_at } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No fue posible crear el cliente." }, { status: 500 });
  }
}
