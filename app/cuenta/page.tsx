"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { ArrowRight, Check, LogOut, UserRound } from "lucide-react";
import { supabase } from "../../lib/supabase-browser";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";
import "./cuenta.css";

type View = "login" | "register" | "forgot" | "recovery";

export default function AccountPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>("login");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === "PASSWORD_RECOVERY") setView("recovery");
    });
    return () => data.subscription.unsubscribe();
  }, []);

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
      setError(text.includes("Invalid login") ? "Correo o contraseña incorrectos." : text);
    } finally { setBusy(false); }
  };

  const changeView = (next: View) => { setView(next); setMessage(""); setError(""); };
  const name = session?.user.user_metadata?.full_name || session?.user.email?.split("@")[0] || "Cliente";

  return <main className="account-page">
    <SiteHeader />
    <section className="account-shell">
      <div className="account-copy"><span>AROMA STUDIO</span><h1>{session ? `Hola, ${name}` : "Tu cuenta"}</h1><p>{session ? "Desde aquí podrás consultar y mantener tus datos de cliente." : "Crea tu cuenta para disfrutar una experiencia de compra más simple."}</p></div>
      {!ready ? <div className="account-card account-loading">Cargando…</div> : session ? (
        <div className="account-card account-profile">
          <div className="account-avatar"><UserRound /></div><span>SESIÓN ACTIVA</span><h2>{name}</h2><p>{session.user.email}</p>
          {session.user.user_metadata?.phone && <p>{session.user.user_metadata.phone}</p>}
          <Link href="/productos">IR AL CATÁLOGO <ArrowRight /></Link>
          <button onClick={() => supabase.auth.signOut()}><LogOut /> CERRAR SESIÓN</button>
        </div>
      ) : (
        <div className="account-card">
          <div className="account-tabs"><button className={view === "login" ? "active" : ""} onClick={() => changeView("login")}>Ingresar</button><button className={view === "register" ? "active" : ""} onClick={() => changeView("register")}>Crear cuenta</button></div>
          <h2>{view === "register" ? "Crear cuenta" : view === "forgot" ? "Recuperar contraseña" : view === "recovery" ? "Nueva contraseña" : "Bienvenido"}</h2>
          <form onSubmit={submit}>
            {view === "register" && <><label>Nombre completo<input name="full_name" autoComplete="name" required /></label><label>Teléfono<input name="phone" type="tel" autoComplete="tel" /></label></>}
            {view !== "recovery" && <label>Correo electrónico<input name="email" type="email" autoComplete="email" required /></label>}
            {view !== "forgot" && <label>Contraseña<input name="password" type="password" minLength={8} autoComplete={view === "login" ? "current-password" : "new-password"} required /></label>}
            {(view === "register" || view === "recovery") && <label>Confirmar contraseña<input name="confirm_password" type="password" minLength={8} autoComplete="new-password" required /></label>}
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
