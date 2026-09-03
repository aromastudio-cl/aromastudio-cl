"use client";

import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Headphones, MapPin, Menu, Search, ShieldCheck, ShoppingBag, Truck, UserRound, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import SiteHeader from "./site-header";
import WhatsAppIcon from "./whatsapp-icon";
import SiteFooter from "./site-footer";
import { supabase } from "../lib/supabase-browser";
import { productVariantHref } from "../lib/product-routes";
import { productCategoryLabel, productCategoryRank } from "../lib/catalog-order";

type Product = { id: string; name: string; family: string; category: string; categorySlug: string; price: number; note: string; image: string; stock: number; href: string };

const money = (value: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);

export default function Storefront() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [cart, setCart] = useState<string[]>([]);
  const [drawer, setDrawer] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [toast, setToast] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  useEffect(() => {
    supabase
      .from("products")
      .select("id,slug,name,scent_notes,price_clp,stock,categories(name,slug),product_variants(id,size_value,size_unit,is_default,sort_order,active),product_images(variant_id,image_url,is_primary,sort_order)")
      .eq("active", true)
      .eq("featured", true)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error("No se pudieron cargar los productos destacados", error);
          setLoadingProducts(false);
          return;
        }
        setProducts((data ?? []).map((item: any) => {
          const variant = (item.product_variants ?? [])
            .filter((entry: any) => entry.active !== false)
            .sort((a: any, b: any) => Number(b.is_default) - Number(a.is_default) || (a.sort_order ?? 0) - (b.sort_order ?? 0))[0];
          const image = item.product_images?.find((entry: any) => entry.variant_id === variant?.id && entry.is_primary)?.image_url
            ?? item.product_images?.find((entry: any) => entry.is_primary)?.image_url
            ?? item.product_images?.sort((a: any, b: any) => a.sort_order - b.sort_order)?.[0]?.image_url
            ?? "/logo-hd.png";
          return {
          id: item.id,
          name: item.name,
          family: productCategoryLabel(item.categories?.slug ?? "otros", item.categories?.name ?? "Aroma Studio"),
          category: productCategoryLabel(item.categories?.slug ?? "otros", item.categories?.name ?? "Otros"),
          categorySlug: item.categories?.slug ?? "otros",
          price: item.price_clp,
          note: item.scent_notes ?? "",
          stock: item.stock,
          image,
          href: variant ? productVariantHref(item.slug, variant.size_value, variant.size_unit) : "/tienda",
        };
        }));
        setLoadingProducts(false);
      });
  }, []);
  const categories = useMemo(() => ["Todos", ...Array.from(new Map(products.map(product => [product.categorySlug, product.category])).entries()).sort(([a], [b]) => productCategoryRank(a) - productCategoryRank(b)).map(([, name]) => name)], [products]);
  const visible = useMemo(() => products.filter(p => (activeCategory === "Todos" || p.category === activeCategory) && `${p.name} ${p.family} ${p.note} ${p.category}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => productCategoryRank(a.categorySlug) - productCategoryRank(b.categorySlug) || a.name.localeCompare(b.name)), [products, query, activeCategory]);
  const total = cart.reduce((sum, id) => sum + (products.find(p => p.id === id)?.price ?? 0), 0);
  const notify = (text: string) => { setToast(text); window.setTimeout(() => setToast(""), 2200); };
  const add = (id: string) => { setCart(items => [...items, id]); notify("Producto agregado al carrito"); };
  const subscribe = (event: FormEvent) => { event.preventDefault(); notify("¡Gracias por suscribirte!"); };

  return <main className="storefront">
    <section className="mobile-public-cover" aria-label="Portada de Aroma Studio">
      <div className="mobile-public-cover__announcement">ENVÍOS A TODO CHILE</div>
      <Image
        className="mobile-public-cover__background"
        src="/mobile-home-spray-background.png"
        alt="Home Spray Aroma Studio rociando una sala de estar"
        fill
        priority
        sizes="(max-width: 700px) 100vw, 1px"
      />
      <header className="mobile-public-cover__header">
        <div>
          <button onClick={() => setMobileMenu(value => !value)} aria-label={mobileMenu ? "Cerrar menú" : "Abrir menú"} aria-expanded={mobileMenu}>{mobileMenu ? <X/> : <Menu/>}</button>
          <button onClick={() => setSearch(value => !value)} aria-label="Buscar productos"><Search/></button>
        </div>
        <Link className="mobile-public-cover__logo" href="/" aria-label="Aroma Studio, inicio"><Image src="/logo-hd.png" alt="Aroma Studio" width={94} height={86}/></Link>
        <div>
          <Link href="/admin" aria-label="Mi cuenta"><UserRound/></Link>
          <Link href="/tienda" aria-label="Ir a la tienda"><ShoppingBag/></Link>
        </div>
      </header>
      {mobileMenu && <nav className="mobile-public-cover__menu" aria-label="Navegación móvil">
        <Link href="/tienda">Tienda online</Link><Link href="/productos">Productos</Link><Link href="/mayoristas">Empresas</Link><Link href="/emprendedores">Emprendedores</Link><Link href="/nosotros">Nosotros</Link>
      </nav>}
      {search && <form className="mobile-public-cover__search" action="/tienda"><Search/><input name="buscar" autoFocus placeholder="Buscar productos…" aria-label="Buscar productos"/></form>}
      <div className="mobile-public-cover__copy">
        <h1><em>Descubre el aroma perfecto</em><span>para cada espacio</span></h1>
        <p>Descubre fragancias que transforman tu hogar<br/>y tu día a día.</p>
      </div>
    </section>
    <div className="topbar">ENVÍOS A TODO CHILE · COMPRA SEGURA</div>
    <SiteHeader cartCount={cart.length} onSearch={() => setSearch(!search)} onCart={() => setDrawer(true)}/>
    {search && <div className="search-panel"><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por aroma o nota…"/><button onClick={() => setSearch(false)}>Cerrar</button></div>}

    <section className="home-hero">
      <div className="hero-content">
        <h1>Aromatizantes<br/>ambientales para ti,<br/>tu negocio o<br/><em>emprendimiento</em></h1>
        <p>Aromatizantes ambientales<br/>para cada espacio.<br/>Venta detalle y al por mayor.</p>
        <div className="hero-actions"><Link className="hero-btn hero-btn--primary" href="/tienda">Tienda Online</Link><Link className="hero-btn hero-btn--secondary" href="/mayoristas">Empresas</Link><Link className="hero-btn hero-btn--tertiary" href="/emprendedores">Emprendedores</Link></div>
      </div>
    </section>

    <section className="promises">
      <article><Truck aria-hidden="true"/><div><strong>ENVÍOS A TODO CHILE</strong><span>Rápidos, seguros y con seguimiento.</span></div></article>
      <article><ShieldCheck aria-hidden="true"/><div><strong>COMPRA 100% SEGURA</strong><span>Protegemos tus datos y tu compra.</span></div></article>
      <article><BadgeCheck aria-hidden="true"/><div><strong>CALIDAD GARANTIZADA</strong><span>Fragancias premium seleccionadas.</span></div></article>
      <article><Headphones aria-hidden="true"/><div><strong>ATENCIÓN PERSONALIZADA</strong><span>Estamos para ayudarte.</span></div></article>
    </section>

    <section className="catalog" id="productos"><div className="mobile-catalog-intro"><span>EXPLORA</span><h2>Categorías de productos</h2><p>Un mismo ritual, distintas maneras de vivirlo. Elige el formato que mejor acompaña tu espacio.</p></div><div className="section-title"><p>PRODUCTOS DESTACADOS</p><h2>Encuentra tu favorito</h2><i/></div><div className="filters" id="aromas">{categories.map(category => <button key={category} className={activeCategory === category ? "active" : ""} onClick={() => setActiveCategory(category)}>{category.toUpperCase()}</button>)}</div>
      <div className="product-list">{visible.map(product => <article className="product-card" key={product.id}><Link href={product.href} className="product-photo"><Image src={product.image} alt={`Aromatizante ${product.name} de Aroma Studio`} fill sizes="(max-width: 850px) 50vw, 20vw" unoptimized={product.image.startsWith("http")}/></Link><h3><Link href={product.href}>{product.name}</Link></h3><p>{product.family}</p><strong>{money(product.price)}</strong><button disabled={product.stock === 0} onClick={() => add(product.id)}>{product.stock === 0 ? "SIN STOCK" : "AGREGAR AL CARRITO"}</button></article>)}</div>
      {!loadingProducts && visible.length === 0 && <p className="no-results">No hay productos destacados en esta categoría.</p>}<Link className="btn btn-outline" href="/tienda">VER TODOS LOS AROMAS</Link>
    </section>

    <section className="wholesale" id="empresas"><div/><article><p>EMPRESAS</p><h2>Aromatización para<br/>tu empresa</h2><span>Abastecemos empresas, oficinas, hoteles, tiendas, centros de estética y otros negocios con aromatizantes seleccionados para cada espacio.</span><ul><li>Precios preferenciales por volumen</li><li>Asesoría según las necesidades de tu empresa</li><li>Despachos a todo Chile</li></ul><Link className="btn btn-gold" href="/mayoristas">SOLICITAR COTIZACIÓN</Link></article></section>
    <section className="entrepreneur-home" id="emprende"><article><p>EMPRENDE CON NOSOTROS</p><h2>Convierte tu idea en<br/><em>tu propia marca</em></h2><span>Te acompañamos para comenzar o hacer crecer tu negocio de aromatizantes, con asesoría cercana, productos seleccionados y opciones de presentación con identidad propia.</span><ul><li>Orientación personalizada para comenzar</li><li>Aromas y formatos para tu público</li><li>Alternativas para desarrollar tu propia marca</li></ul><Link className="btn entrepreneur-home__cta" href="/emprendedores">QUIERO EMPRENDER</Link></article><div aria-hidden="true"/></section>
    <section className="about" id="nosotros"><article><p>SOBRE NOSOTROS</p><h2>Pasión por los aromas</h2><span>En Aroma Studio seleccionamos cuidadosamente cada esencia para ofrecer productos de alta calidad que transforman tus espacios y momentos.<br/><br/>Creemos que cada aroma cuenta una historia y despierta emociones.</span><div className="store-locations" aria-label="Nuestros locales"><strong>VISÍTANOS EN NUESTROS DOS LOCALES</strong><span><MapPin aria-hidden="true"/>Espacio Urbano Plaza Maipú</span><span><MapPin aria-hidden="true"/>Espacio Urbano Las Rejas</span></div><Link className="btn btn-outline" href="/nosotros">CONÓCENOS</Link></article><div/></section>
    <section className="newsletter"><div><strong>RECIBE NUESTRAS NOVEDADES</strong><p>Suscríbete y entérate de lanzamientos, promociones y tips.</p></div><form onSubmit={subscribe}><input type="email" required placeholder="Tu correo electrónico"/><button>SUSCRIBIRME</button></form><ul><li>Envíos a todo Chile</li><li>Compra segura</li><li>Atención personalizada</li></ul></section>
    <SiteFooter/>

    {drawer && <><button className="drawer-overlay" onClick={() => setDrawer(false)} aria-label="Cerrar carrito"/><aside className="cart-drawer"><header><h2>Tu carrito ({cart.length})</h2><button onClick={() => setDrawer(false)}>×</button></header><div className="cart-items">{cart.length === 0 ? <p>Tu carrito está vacío.</p> : cart.map((id, index) => { const p = products.find(x => x.id === id)!; return <article key={`${id}-${index}`}><Image src={p.image} alt="" width={55} height={65} unoptimized={p.image.startsWith("http")}/><div><strong>{p.name}</strong><span>{money(p.price)}</span></div><button onClick={() => setCart(items => items.filter((_, i) => i !== index))}>×</button></article>})}</div><footer><span>Subtotal</span><strong>{money(total)}</strong><button onClick={() => notify("Checkout listo para conectar con tu medio de pago")}>FINALIZAR COMPRA</button></footer></aside></>}
    {toast && <div className="toast">✓ {toast}</div>}
    <a className="whatsapp-float" href="https://wa.me/56993158300?text=Hola%20Aroma%20Studio%2C%20quisiera%20m%C3%A1s%20informaci%C3%B3n." target="_blank" rel="noopener noreferrer" aria-label="Contactar a Aroma Studio por WhatsApp"><WhatsAppIcon/></a>
  </main>;
}
