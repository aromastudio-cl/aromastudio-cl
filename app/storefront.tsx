"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

type Product = { id: number; name: string; family: string; price: number; note: string; accent: string };

const products: Product[] = [
  { id: 1, name: "Mango", family: "Frutal · Dulce", price: 6990, note: "Mango, durazno y vainilla", accent: "#d79c32" },
  { id: 2, name: "Bubble Gum", family: "Dulce · Juvenil", price: 6990, note: "Chicle, frutilla y azúcar", accent: "#e7afaf" },
  { id: 3, name: "Verbena", family: "Floral · Fresco", price: 6990, note: "Verbena, lavanda y limón", accent: "#9c8bb0" },
  { id: 4, name: "Cedrón, limón y menta", family: "Fresco · Cítrico", price: 6990, note: "Cedrón, cítricos y menta", accent: "#a8a34c" },
  { id: 5, name: "Red Velvet", family: "Dulce · Gourmand", price: 6990, note: "Cacao, crema y frutos rojos", accent: "#a84135" },
];

const money = (value: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);

function ProductBottle({ accent, small = false }: { accent: string; small?: boolean }) {
  return <div className={`product-bottle${small ? " product-bottle--small" : ""}`} style={{ "--accent": accent } as React.CSSProperties} aria-hidden="true"><i/><span><Image src="/logo-hd.png" alt="" width={44} height={44}/><small>AROMA STUDIO</small></span></div>;
}

export default function Storefront() {
  const [cart, setCart] = useState<number[]>([]);
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const visible = useMemo(() => products.filter(p => `${p.name} ${p.family} ${p.note}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const total = cart.reduce((sum, id) => sum + (products.find(p => p.id === id)?.price ?? 0), 0);
  const notify = (text: string) => { setToast(text); window.setTimeout(() => setToast(""), 2200); };
  const add = (id: number) => { setCart(items => [...items, id]); notify("Producto agregado al carrito"); };
  const subscribe = (event: FormEvent) => { event.preventDefault(); notify("¡Gracias por suscribirte!"); };

  return <main>
    <div className="topbar">ENVÍOS A TODO CHILE · COMPRA SEGURA</div>
    <header className="site-header">
      <button className="mobile-menu" onClick={() => setMenu(!menu)} aria-label="Abrir menú">☰</button>
      <Link href="/" className="logo"><Image src="/logo-hd.png" alt="Aroma Studio" width={120} height={96} priority/></Link>
      <nav className={menu ? "main-nav is-open" : "main-nav"}>
        <a href="#productos">PRODUCTOS</a><a href="#aromas">AROMAS</a><a href="#mayoristas">PACKS EXCLUSIVOS</a><a href="#mayoristas">MAYORISTAS</a><a href="#nosotros">NOSOTROS</a>
      </nav>
      <div className="header-tools"><button onClick={() => setSearch(!search)} aria-label="Buscar">⌕</button><Link href="/admin" aria-label="Administración">♙</Link><button onClick={() => setDrawer(true)} aria-label="Carrito">▢<b>{cart.length}</b></button></div>
    </header>
    {search && <div className="search-panel"><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por aroma o nota…"/><button onClick={() => setSearch(false)}>Cerrar</button></div>}

    <section className="home-hero">
      <div className="hero-content"><p>AROMAS QUE</p><h1>Despiertan<br/>emociones</h1><i/><span>Aromatizantes ambientales de alta calidad<br/>para transformar cada espacio en una experiencia única.</span><div><a className="btn btn-dark" href="#productos">VER PRODUCTOS</a><a className="btn btn-light" href="#mayoristas">VENTA MAYORISTA</a></div></div>
    </section>

    <section className="promises">
      <article><b>♧</b><div><strong>FRAGANCIAS PREMIUM</strong><span>Esencias cuidadosamente seleccionadas.</span></div></article>
      <article><b>♙</b><div><strong>AMBIENTES ÚNICOS</strong><span>Aromas que transforman tu día.</span></div></article>
      <article><b>◇</b><div><strong>VENTA MAYORISTA</strong><span>Precios especiales para tu negocio.</span></div></article>
      <article><b>▱</b><div><strong>ENVÍOS A TODO CHILE</strong><span>Rápido, seguro y con seguimiento.</span></div></article>
    </section>

    <section className="catalog" id="productos"><div className="section-title"><p>NUESTROS AROMAS</p><h2>Encuentra tu favorito</h2><i/></div><div className="filters" id="aromas"><button>TODOS</button><button>FRUTALES</button><button>FLORALES</button><button>FRESCOS</button><button>DULCES</button></div>
      <div className="product-list">{visible.map(product => <article className="product-card" key={product.id}><div className="product-photo" style={{ "--card-accent": product.accent } as React.CSSProperties}><ProductBottle accent={product.accent}/><i/></div><h3>{product.name}</h3><p>{product.family}</p><strong>{money(product.price)}</strong><button onClick={() => add(product.id)}>AGREGAR AL CARRITO</button></article>)}</div>
      {visible.length === 0 && <p className="no-results">No encontramos aromas con esa búsqueda.</p>}<a className="btn btn-outline" href="#productos">VER TODOS LOS AROMAS</a>
    </section>

    <section className="wholesale" id="mayoristas"><div/><article><p>MAYORISTAS</p><h2>Haz crecer tu negocio<br/>con nuestros aromas</h2><span>Ofrecemos precios preferenciales y asesoría personalizada para emprendimientos, tiendas y empresas.</span><ul><li>Precios especiales por volumen</li><li>Asesoría personalizada</li><li>Despachos a todo Chile</li></ul><a className="btn btn-gold" href="mailto:hola@aromastudio.cl">QUIERO SER MAYORISTA</a></article></section>
    <section className="about" id="nosotros"><article><p>SOBRE NOSOTROS</p><h2>Pasión por los aromas</h2><span>En Aroma Studio seleccionamos cuidadosamente cada esencia para ofrecer productos de alta calidad que transforman tus espacios y momentos.<br/><br/>Creemos que cada aroma cuenta una historia y despierta emociones.</span><a className="btn btn-outline" href="mailto:hola@aromastudio.cl">CONÓCENOS</a></article><div/></section>
    <section className="instagram"><div className="section-title"><p>SÍGUENOS EN INSTAGRAM</p><span>@aromastudio.cl</span></div><div>{[1,2,3,4,5].map((n, i) => <figure key={n} style={{ "--ig-pos": `${20 + i * 16}%` } as React.CSSProperties}><ProductBottle accent={products[i].accent} small/></figure>)}</div></section>
    <section className="newsletter"><div><strong>RECIBE NUESTRAS NOVEDADES</strong><p>Suscríbete y entérate de lanzamientos, promociones y tips.</p></div><form onSubmit={subscribe}><input type="email" required placeholder="Tu correo electrónico"/><button>SUSCRIBIRME</button></form><ul><li>Envíos a todo Chile</li><li>Compra segura</li><li>Atención personalizada</li></ul></section>
    <footer><Link href="/" className="logo"><Image src="/logo-hd.png" alt="Aroma Studio" width={105} height={86}/></Link><div><strong>PRODUCTOS</strong><a href="#productos">Todos los productos</a><a href="#productos">Aromatizantes en spray</a><a href="#productos">Difusores</a></div><div><strong>AROMAS</strong><a href="#aromas">Frutales</a><a href="#aromas">Florales</a><a href="#aromas">Frescos</a></div><div><strong>CONTÁCTANOS</strong><a href="tel:+56912345678">+56 9 1234 5678</a><a href="mailto:hola@aromastudio.cl">hola@aromastudio.cl</a><a href="https://instagram.com/aromastudio.cl">@aromastudio.cl</a></div></footer>

    {drawer && <><button className="drawer-overlay" onClick={() => setDrawer(false)} aria-label="Cerrar carrito"/><aside className="cart-drawer"><header><h2>Tu carrito ({cart.length})</h2><button onClick={() => setDrawer(false)}>×</button></header><div className="cart-items">{cart.length === 0 ? <p>Tu carrito está vacío.</p> : cart.map((id, index) => { const p = products.find(x => x.id === id)!; return <article key={`${id}-${index}`}><ProductBottle accent={p.accent} small/><div><strong>{p.name}</strong><span>{money(p.price)}</span></div><button onClick={() => setCart(items => items.filter((_, i) => i !== index))}>×</button></article>})}</div><footer><span>Subtotal</span><strong>{money(total)}</strong><button onClick={() => notify("Checkout listo para conectar con tu medio de pago")}>FINALIZAR COMPRA</button></footer></aside></>}
    {toast && <div className="toast">✓ {toast}</div>}
  </main>;
}
