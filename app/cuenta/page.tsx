"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { ArrowRight, Check, Eye, EyeOff, Home, LogOut, Package, ShieldCheck, UserRound } from "lucide-react";
import { supabase } from "../../lib/supabase-browser";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";
import "./cuenta.css";

type View = "login" | "register" | "forgot" | "recovery";
type CustomerOrder = { id:string; order_number:string; status:string; total_clp:number; created_at:string; payment_method:string };

export default function AccountPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>("login");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profile, setProfile] = useState({ full_name: "", phone: "" });
  const [accountSection, setAccountSection] = useState<"welcome" | "profile" | "orders">("welcome");
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === "PASSWORD_RECOVERY") setView("recovery");
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    supabase.from("customer_profiles").select("full_name,phone").eq("id", session.user.id).maybeSingle().then(({ data }) => setProfile({ full_name: data?.full_name || session.user.user_metadata?.full_name || "", phone: data?.phone || session.user.user_metadata?.phone || "" }));
    supabase.from("orders").select("id,order_number,status,total_clp,created_at,payment_method").eq("customer_id",session.user.id).order("created_at",{ascending:false}).then(({data})=>setCustomerOrders(data??[]));
  }, [session]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");
    try {
      if (view === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
      } else if (view === "register") {
        if (password.length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres.");
        if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) throw new Error("Usa una mayúscula, una minúscula y un número en tu contraseña.");
        if (password !== String(form.get("confirm_password") || "")) throw new Error("Las contraseñas no coinciden.");
        const fullName = String(form.get("full_name") || "").trim();
        const phone = String(form.get("phone") || "").trim();
        const { data, error: authError } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName, phone }, emailRedirectTo: `${window.location.origin}/cuenta` },
        });
        if (authError) throw authError;
        if (!data.session) setMessage("Cuenta creada. Revisa tu correo para confirmar el registro.");
      } else if (view === "forgot") {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/cuenta` });
        if (authError) throw authError;
        setMessage("Te enviamos un enlace para recuperar tu contraseña.");
      } else {
        if (password.length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres.");
        if (password !== String(form.get("confirm_password") || "")) throw new Error("Las contraseñas no coinciden.");
        const { error: authError } = await supabase.auth.updateUser({ password });
        if (authError) throw authError;
        setMessage("Contraseña actualizada correctamente."); setView("login");
      }
    } catch (caught) {
      const text = caught instanceof Error ? caught.message : "No fue posible completar la solicitud.";
      setError(text.includes("Invalid login") ? "Correo o contraseña incorrectos." : text.includes("already registered") ? "Ya existe una cuenta con este correo." : text);
    } finally { setBusy(false); }
  };

  const changeView = (next: View) => { setView(next); setMessage(""); setError(""); };
  const name = session?.user.user_metadata?.full_name || session?.user.email?.split("@")[0] || "Cliente";
  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!session) return; setBusy(true); setError(""); setMessage("");
    const fullName = profile.full_name.trim();
    if (fullName.length < 3) { setError("Ingresa tu nombre completo."); setBusy(false); return; }
    const { error: profileError } = await supabase.from("customer_profiles").update({ full_name: fullName, phone: profile.phone.trim(), updated_at: new Date().toISOString() }).eq("id", session.user.id);
    if (!profileError) await supabase.auth.updateUser({ data: { full_name: fullName, phone: profile.phone.trim() } });
    if (profileError) setError(profileError.message); else setMessage("Tus datos fueron actualizados correctamente.");
    setBusy(false);
  };

  return <main className="account-page">
    <SiteHeader />
    <section className="account-shell">
      {session ? <aside className="account-side-menu"><span>MI CUENTA</span><h1>Hola, {profile.full_name?.split(" ")[0] || name}</h1><nav aria-label="Menú de mi cuenta"><button className={accountSection==="welcome"?"active":""} onClick={()=>setAccountSection("welcome")}><Home/>Bienvenida</button><button className={accountSection==="orders"?"active":""} onClick={()=>setAccountSection("orders")}><Package/>Mis compras</button><button className={accountSection==="profile"?"active":""} onClick={()=>setAccountSection("profile")}><UserRound/>Mis datos</button></nav></aside> : <div className="account-copy"><span>AROMA STUDIO</span><h1>Tu cuenta</h1><p>Crea tu cuenta para disfrutar una experiencia de compra más simple.</p></div>}
      {!ready ? <div className="account-card account-loading">Cargando…</div> : session ? (
        <div className="customer-dashboard">
          <header className="customer-dashboard__header">
            <div className="account-avatar"><UserRound /></div>
            <div><span>MI CUENTA</span><h2>{profile.full_name || name}</h2><p>{session.user.email}</p></div>
            <button className="account-logout" onClick={() => supabase.auth.signOut()}><LogOut /> CERRAR SESIÓN</button>
          </header>
          {accountSection === "welcome" ? <section className="customer-dashboard__content customer-welcome"><div className="dashboard-section-heading"><span>BIENVENIDA</span><h3>Tu espacio Aroma Studio</h3><p>Administra tus datos personales, revisa el estado de tus compras y continúa descubriendo aromas para tus espacios.</p></div><div className="welcome-actions"><button onClick={()=>setAccountSection("orders")}><Package/><span><strong>Revisar mis compras</strong><small>Consulta tus pedidos y su estado</small></span><ArrowRight/></button><button onClick={()=>setAccountSection("profile")}><UserRound/><span><strong>Editar mis datos</strong><small>Actualiza tu información de contacto</small></span><ArrowRight/></button><Link href="/tienda"><Home/><span><strong>Ir a la tienda</strong><small>Explora todos nuestros productos</small></span><ArrowRight/></Link></div></section> : accountSection === "profile" ? <section className="customer-dashboard__content">
            <div className="dashboard-section-heading"><span>INFORMACIÓN PERSONAL</span><h3>Edita tus datos</h3><p>Mantén actualizados tus datos de contacto para facilitar tus próximas compras.</p></div>
            <form className="account-profile-form" onSubmit={saveProfile}><label>Nombre completo<input value={profile.full_name} onChange={event => setProfile({ ...profile, full_name: event.target.value })} autoComplete="name" required/></label><label>Correo electrónico<input value={session.user.email || ""} disabled aria-label="Correo electrónico"/></label><label>Teléfono<input type="tel" value={profile.phone} onChange={event => setProfile({ ...profile, phone: event.target.value })} autoComplete="tel" placeholder="+56 9 1234 5678"/></label>{error && <p className="account-error" role="alert">{error}</p>}{message && <p className="account-success"><Check />{message}</p>}<button className="account-submit" disabled={busy}>{busy ? "GUARDANDO…" : "GUARDAR CAMBIOS"}</button></form>
          </section> : <section className="customer-dashboard__content customer-orders">
            <div className="dashboard-section-heading"><span>HISTORIAL</span><h3>Mis compras</h3><p>Aquí podrás consultar el estado y el detalle de tus pedidos.</p></div>
            {customerOrders.length?<div className="customer-order-list">{customerOrders.map(item=><article key={item.id}><div><small>PEDIDO</small><strong>{item.order_number}</strong></div><div><small>FECHA</small><span>{new Intl.DateTimeFormat("es-CL",{dateStyle:"medium"}).format(new Date(item.created_at))}</span></div><div><small>TOTAL</small><span>{new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(item.total_clp)}</span></div><b>{item.status==="new"?"Recibido":item.status}</b></article>)}</div>:<div className="orders-empty"><Package/><h4>Aún no tienes compras registradas</h4><p>Cuando realices una compra, podrás revisar aquí su estado y sus productos.</p><Link href="/tienda">IR A LA TIENDA <ArrowRight/></Link></div>}
          </section>}
        </div>
      ) : (
        <div className="account-card">
          <div className="account-tabs"><button className={view === "login" ? "active" : ""} onClick={() => changeView("login")}>Ingresar</button><button className={view === "register" ? "active" : ""} onClick={() => changeView("register")}>Crear cuenta</button></div>
          <h2>{view === "register" ? "Crear cuenta" : view === "forgot" ? "Recuperar contraseña" : view === "recovery" ? "Nueva contraseña" : "Bienvenido"}</h2>
          <form onSubmit={submit}>
            {view === "register" && <><label>Nombre completo<input name="full_name" autoComplete="name" required /></label><label>Teléfono<input name="phone" type="tel" autoComplete="tel" /></label></>}
            {view !== "recovery" && <label>Correo electrónico<input name="email" type="email" autoComplete="email" required /></label>}
            {view !== "forgot" && <label>Contraseña<span className="account-password"><input name="password" type={showPassword ? "text" : "password"} minLength={8} autoComplete={view === "login" ? "current-password" : "new-password"} required /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>{showPassword ? <EyeOff/> : <Eye/>}</button></span></label>}
            {(view === "register" || view === "recovery") && <label>Confirmar contraseña<input name="confirm_password" type={showPassword ? "text" : "password"} minLength={8} autoComplete="new-password" required /></label>}
            {view === "register" && <><div className="account-password-rules"><ShieldCheck/><span>Mínimo 8 caracteres, con mayúscula, minúscula y número.</span></div><label className="account-terms"><input name="terms" type="checkbox" required/><span>Acepto los términos, condiciones y política de privacidad.</span></label></>}
            {error && <p className="account-error" role="alert">{error}</p>}{message && <p className="account-success"><Check />{message}</p>}
            <button className="account-submit" disabled={busy}>{busy ? "PROCESANDO…" : view === "register" ? "CREAR MI CUENTA" : view === "forgot" ? "ENVIAR ENLACE" : view === "recovery" ? "GUARDAR CONTRASEÑA" : "INGRESAR"}</button>
          </form>
          {view === "login" && <button className="account-text-button" onClick={() => changeView("forgot")}>Olvidé mi contraseña</button>}
          {(view === "forgot" || view === "recovery") && <button className="account-text-button" onClick={() => changeView("login")}>Volver al ingreso</button>}
        </div>
      )}
    </section>
    <SiteFooter />
  </main>;
}
