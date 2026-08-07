"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const products = [
  { id: 1, name: "Noir Intense", family: "Amaderada · Unisex", price: 54990, note: "Ámbar, cedro y vainilla", tone: "#2c2926", liquid: "#a76b22" },
  { id: 2, name: "Rose Élixir", family: "Floral · Femenina", price: 49990, note: "Rosa, lichi y almizcle", tone: "#ccb4aa", liquid: "#d8a777" },
  { id: 3, name: "Santal 09", family: "Amaderada · Unisex", price: 57990, note: "Sándalo, iris y cuero", tone: "#7d654d", liquid: "#b77d32" },
  { id: 4, name: "Citrus Breeze", family: "Cítrica · Unisex", price: 44990, note: "Bergamota, neroli y té", tone: "#c7c1a2", liquid: "#d8bd55" },
  { id: 5, name: "Velvet Oud", family: "Oriental · Unisex", price: 59990, note: "Oud, azafrán y pachulí", tone: "#3b2721", liquid: "#7d3e1f" },
  { id: 6, name: "Blanc Musk", family: "Almizclada · Unisex", price: 48990, note: "Algodón, musk y peonía", tone: "#d8d3ca", liquid: "#e3d8b1" },
];

const money = (value: number) => `$${value.toLocaleString("es-CL")}`;

function Bottle({ tone = "#171717", liquid = "#b88642", large = false }: { tone?: string; liquid?: string; large?: boolean }) {
  return <div className={`bottle ${large ? "bottle--large" : ""}`} aria-hidden="true">
    <div className="bottle__cap" style={{ background: tone }} />
    <div className="bottle__neck" />
    <div className="bottle__glass" style={{ "--liquid": liquid } as React.CSSProperties}>
      <div className="bottle__label"><span className="monogram">AS</span><small>AROMA STUDIO</small></div>
    </div>
  </div>;
}

export default function Storefront() {
  const [cart, setCart] = useState<number[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [toast, setToast] = useState("");
  const filtered = useMemo(() => products.filter(p => `${p.name} ${p.family} ${p.note}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const total = cart.reduce((sum, id) => sum + (products.find(p => p.id === id)?.price ?? 0), 0);
  const add = (id: number) => { setCart(c => [...c, id]); setToast("Agregado a tu bolsa"); setTimeout(() => setToast(""), 1800); };
  return <main>
    <div className="shipping-bar">ENVÍO GRATIS EN COMPRAS SOBRE $49.990</div>
    <header className="header">
      <button className="icon-button menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menú">☰</button>
      <Link href="/" className="brand brand--image" aria-label="Aroma Studio inicio"><img src="/logo.png" alt="Aroma Studio" /></Link>
      <nav className={menuOpen ? "nav nav--open" : "nav"}>
        <a href="#inicio">INICIO</a><a href="#fragancias">FRAGANCIAS</a><a href="#colecciones">COLECCIONES</a><a href="#nosotros">NOSOTROS</a><a href="#contacto">CONTACTO</a>
      </nav>
      <div className="header-actions">
        <button className="icon-button" onClick={() => setSearchOpen(!searchOpen)} aria-label="Buscar">⌕</button>
        <Link href="/admin" className="icon-button" aria-label="Panel administrador">♙</Link>
        <button className="icon-button bag-button" onClick={() => setCartOpen(true)} aria-label={`Bolsa con ${cart.length} productos`}>▱<b>{cart.length}</b></button>
      </div>
    </header>
    {searchOpen && <div className="search"><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Busca por aroma, nota o nombre…" /><button onClick={() => setSearchOpen(false)}>Cerrar</button></div>}

    <section className="hero" id="inicio">
      <div className="hero__copy"><p className="eyebrow">PERFUMERÍA DE AUTOR · SANTIAGO</p><h1>Descubre la esencia que habla de ti.</h1><p>Fragancias únicas, creadas en pequeñas partidas para convertir cada momento en un recuerdo.</p><a className="button button--dark" href="#fragancias">DESCUBRIR FRAGANCIAS <span>→</span></a></div>
      <div className="hero__visual"><span className="hero__word">AROMA</span><div className="halo" /><Bottle large /><p className="vertical-note">EAU DE PARFUM · 50 ML</p></div>
    </section>

    <section className="benefits" aria-label="Beneficios"><div><b>◇</b><span><strong>ENVÍO RÁPIDO</strong><small>A todo Chile</small></span></div><div><b>✦</b><span><strong>FRAGANCIAS PREMIUM</strong><small>Alta concentración</small></span></div><div><b>▢</b><span><strong>COMPRA SEGURA</strong><small>Pago 100% protegido</small></span></div><div><b>♧</b><span><strong>REGALO ESPECIAL</strong><small>En compras seleccionadas</small></span></div></section>

    <section className="collections" id="colecciones"><div className="section-heading"><p>ENCUENTRA TU AROMA</p><h2>Nuestras colecciones</h2></div><div className="collection-grid">
      <article className="collection collection--dark"><span>01</span><h3>Intensas</h3><p>Profundas y magnéticas</p><a href="#fragancias">EXPLORAR →</a></article>
      <article className="collection collection--sand"><span>02</span><h3>Luminosas</h3><p>Frescas y radiantes</p><a href="#fragancias">EXPLORAR →</a></article>
      <article className="collection collection--rose"><span>03</span><h3>Florales</h3><p>Delicadas y envolventes</p><a href="#fragancias">EXPLORAR →</a></article>
    </div></section>

    <section className="products" id="fragancias"><div className="section-heading section-heading--row"><div><p>LOS FAVORITOS</p><h2>Más vendidos</h2></div><a href="#fragancias">VER TODO <span>→</span></a></div>
      <div className="product-grid">{filtered.map(p => <article className="product" key={p.id}><div className="product__art"><span className="product__tag">BESTSELLER</span><Bottle tone={p.tone} liquid={p.liquid}/><button onClick={() => add(p.id)} aria-label={`Agregar ${p.name}`}>+</button></div><p className="product__family">{p.family}</p><h3>{p.name}</h3><p className="product__note">{p.note}</p><strong>{money(p.price)}</strong></article>)}</div>
      {filtered.length === 0 && <p className="empty">No encontramos una fragancia con esa búsqueda.</p>}
    </section>

    <section className="manifesto" id="nosotros"><div><p className="eyebrow">NUESTRA FILOSOFÍA</p><h2>Tu aroma.<br/>Tu historia.</h2></div><div><p>Creemos que una fragancia no solo se usa: se habita. Por eso seleccionamos materias primas nobles y diseñamos composiciones que evolucionan contigo.</p><a href="#contacto">CONOCE AROMA STUDIO →</a></div></section>
    <section className="newsletter" id="contacto"><p>ÚNETE A NUESTRO UNIVERSO</p><h2>Notas nuevas, directo a tu correo.</h2><form onSubmit={e => { e.preventDefault(); setToast("¡Bienvenido a Aroma Studio!"); }}><input type="email" required placeholder="tu@email.com"/><button>QUIERO SUSCRIBIRME →</button></form></section>
    <footer><Link href="/" className="brand brand--footer"><span>AS</span><small>AROMA STUDIO</small></Link><p>Perfumería de autor creada en Chile.<br/>Aromas que permanecen.</p><div><a href="#fragancias">Fragancias</a><a href="#nosotros">Nuestra historia</a><Link href="/admin">Administración</Link></div><div><p>© 2026 AROMA STUDIO</p><p>Instagram · Pinterest · TikTok</p></div></footer>

    <aside className={cartOpen ? "drawer drawer--open" : "drawer"} aria-hidden={!cartOpen}><div className="drawer__head"><h2>Tu bolsa <small>({cart.length})</small></h2><button onClick={() => setCartOpen(false)} aria-label="Cerrar">×</button></div>{cart.length === 0 ? <div className="cart-empty"><span>AS</span><h3>Tu bolsa está vacía</h3><p>Encuentra una esencia que se sienta tuya.</p><button className="button button--dark" onClick={() => setCartOpen(false)}>DESCUBRIR</button></div> : <><div className="cart-list">{cart.map((id, i) => { const p = products.find(x => x.id === id)!; return <div className="cart-item" key={`${id}-${i}`}><Bottle tone={p.tone} liquid={p.liquid}/><div><h3>{p.name}</h3><p>50 ml · Eau de Parfum</p><strong>{money(p.price)}</strong></div><button onClick={() => setCart(c => c.filter((_, ci) => ci !== i))}>×</button></div>})}</div><div className="cart-total"><span>Subtotal</span><strong>{money(total)}</strong><p>Envío calculado al finalizar</p><button onClick={() => setToast("Checkout listo para conectar con tu medio de pago")}>FINALIZAR COMPRA →</button></div></>}</aside>{cartOpen && <button className="overlay" onClick={() => setCartOpen(false)} aria-label="Cerrar bolsa"/>}
    {toast && <div className="toast">✓ {toast}</div>}
  </main>;
}
