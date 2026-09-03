"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Search as SearchIcon, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import SiteHeader from "./site-header";
import SiteFooter from "./site-footer";
import { supabase } from "../lib/supabase-browser";
import { productVariantHref } from "../lib/product-routes";
import { productCategoryLabel } from "../lib/catalog-order";

type Product = { id: string; name: string; family: string; aromaSlug: string; category: string; categorySlug: string; price: number; note: string; image: string; stock: number; href: string };

const money = (value: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);

export default function Storefront({ catalogOnly = false }: { catalogOnly?: boolean }) {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [homeCategories, setHomeCategories] = useState<Array<{ id: string; name: string; slug: string; image_url: string | null }>>([]);
  const [locations, setLocations] = useState<Array<{id:string;name:string;address:string;image_url:string;show_in_hero:boolean}>>([]);
  const [heroImages,setHeroImages]=useState({desktop:"",mobile:""});
  const [faqs,setFaqs]=useState<Array<{id:string;question:string;answer:string}>>([]);
  const [cart, setCart] = useState<string[]>([]);
  const [drawer, setDrawer] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [selectedAroma, setSelectedAroma] = useState("");
  const [toast, setToast] = useState("");
  const categoryCarouselRef = useRef<HTMLDivElement>(null);
  const moveCategories = (direction: number) => categoryCarouselRef.current?.scrollBy({ left: direction * categoryCarouselRef.current.clientWidth * .82, behavior: "smooth" });
  useEffect(() => {
    supabase.from("categories").select("id,name,slug,image_url").eq("active", true).order("sort_order").then(({ data }) => setHomeCategories(data ?? []));
    supabase.from("store_locations").select("id,name,address,image_url,show_in_hero").eq("active",true).order("sort_order").then(({data})=>setLocations(data??[]));
    supabase.from("site_settings").select("hero_desktop_url,hero_mobile_url").eq("id",1).maybeSingle().then(({data})=>{if(data)setHeroImages({desktop:data.hero_desktop_url||"",mobile:data.hero_mobile_url||""})});
    supabase.from("faqs").select("id,question,answer").eq("active",true).order("sort_order").then(({data})=>setFaqs(data??[]));
    supabase
      .from("products")
      .select("id,slug,name,scent_notes,aroma_family,price_clp,stock,categories(name,slug),aroma_families(name,slug),product_variants(id,size_value,size_unit,is_default,sort_order,active),product_images(variant_id,image_url,is_primary,sort_order)")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error("No se pudieron cargar los productos destacados", error);
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
          family: item.aroma_families?.name ?? "Aroma Studio",
          aromaSlug: item.aroma_families?.slug ?? item.aroma_family ?? "",
          category: productCategoryLabel(item.categories?.slug ?? "otros", item.categories?.name ?? "Otros"),
          categorySlug: item.categories?.slug ?? "otros",
          price: item.price_clp,
          note: item.scent_notes ?? "",
          stock: item.stock,
          image,
          href: variant ? productVariantHref(item.slug, variant.size_value, variant.size_unit) : "/tienda",
        };
        }));
      });
  }, []);
  useEffect(() => {
    setSelectedCategory(searchParams.get("categoria") || "todos");
    setSelectedAroma(searchParams.get("aroma") || "");
  }, [searchParams]);
  const total = cart.reduce((sum, id) => sum + (products.find(p => p.id === id)?.price ?? 0), 0);
  const notify = (text: string) => { setToast(text); window.setTimeout(() => setToast(""), 2200); };
  const normalizedQuery = query.trim().toLocaleLowerCase("es");
  const searchResults = normalizedQuery.length < 2 ? [] : products.filter(product => `${product.name} ${product.note} ${product.category}`.toLocaleLowerCase("es").includes(normalizedQuery)).slice(0, 6);
  const filteredProducts = selectedAroma ? products.filter(product => product.aromaSlug === selectedAroma) : selectedCategory === "todos" ? products : products.filter(product => product.categorySlug === selectedCategory);
  const selectedCategoryName = homeCategories.find(category => category.slug === selectedCategory)?.name;
  const selectCategory = (slug: string) => {
    setSelectedCategory(slug);
    setSelectedAroma("");
    const url = slug === "todos" ? "/tienda" : `/tienda?categoria=${encodeURIComponent(slug)}`;
    window.history.replaceState(null, "", url);
  };

  useEffect(() => {
    if (!search) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setSearch(false); };
    document.addEventListener("keydown", close);
    document.body.classList.add("search-is-open");
    return () => { document.removeEventListener("keydown", close); document.body.classList.remove("search-is-open"); };
  }, [search]);

  return <main className="storefront">
    <div className="topbar">ENVÍOS A TODO CHILE · COMPRA SEGURA</div>
    {catalogOnly && <SiteHeader cartCount={cart.length} onCart={() => setDrawer(true)}/>} 
    {!catalogOnly && <div className="home-hero-shell" style={{"--hero-desktop-image":heroImages.desktop?`url("${heroImages.desktop}")`:undefined,"--hero-mobile-image":heroImages.mobile?`url("${heroImages.mobile}")`:undefined} as CSSProperties}>
      <SiteHeader overlay cartCount={cart.length} onSearch={() => setSearch(!search)} onCart={() => setDrawer(true)}/>
      {search && <div className="search-overlay" role="dialog" aria-modal="true" aria-labelledby="search-title">
        <button className="search-overlay__backdrop" onClick={() => setSearch(false)} aria-label="Cerrar búsqueda" />
        <section className="search-panel">
          <header><div><span>EXPLORA AROMA STUDIO</span><h2 id="search-title">¿Qué aroma buscas?</h2></div><button className="search-panel__close" onClick={() => setSearch(false)} aria-label="Cerrar búsqueda"><X /></button></header>
          <div className="search-panel__field"><SearchIcon aria-hidden="true"/><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Busca por nombre, aroma o nota…" aria-label="Buscar productos"/>{query && <button onClick={() => setQuery("")} aria-label="Limpiar búsqueda"><X /></button>}</div>
          <div className="search-panel__content">
            {query.trim().length < 2 ? <p className="search-panel__hint">Escribe al menos dos caracteres para comenzar.</p> : searchResults.length ? <div className="search-panel__results">{searchResults.map(product => <Link href={product.href} key={product.id} onClick={() => setSearch(false)}><span><Image src={product.image} alt="" fill sizes="72px" unoptimized/></span><div><small>{product.category}</small><strong>{product.name}</strong><p>{product.note || "Fragancia Aroma Studio"}</p></div><b>{money(product.price)}</b></Link>)}</div> : <div className="search-panel__empty"><strong>Sin resultados</strong><p>No encontramos productos para “{query.trim()}”. Prueba con otro aroma o categoría.</p><Link href="/tienda" onClick={() => setSearch(false)}>VER TODO EL CATÁLOGO</Link></div>}
          </div>
        </section>
      </div>}
      <section className="home-hero">
        <div className="hero-content">
          <h1><em>Descubre el aroma perfecto</em><br/>para cada espacio</h1>
          <p>Descubre fragancias que transforman tu hogar<br/>y tu día a día.</p>
        </div>
      </section>
    </div>}

    {!catalogOnly && <section className="category-showcase" aria-labelledby="category-showcase-title">
      <header>
        <span>EXPLORA</span>
        <h2 id="category-showcase-title">Categorías de productos</h2>
        <p>Descubre nuestras categorías y elige el formato que mejor acompaña tu espacio.</p>
      </header>
      <div className="category-carousel">
        <button className="category-carousel__arrow category-carousel__arrow--previous" type="button" onClick={()=>moveCategories(-1)} aria-label="Categorías anteriores"><ChevronLeft aria-hidden="true"/></button>
        <div className="category-showcase__grid" ref={categoryCarouselRef}>
          {homeCategories.map((category) => (
            <Link className="category-showcase__card" href={`/tienda?categoria=${category.slug}`} key={category.id}>
              <span className="category-showcase__image">
                {category.image_url && <Image src={category.image_url} alt={category.name} fill sizes="(max-width: 700px) 90vw, 25vw" unoptimized/>}
              </span>
              <h3>{category.name} <b aria-hidden="true">→</b></h3>
            </Link>
          ))}
        </div>
        <button className="category-carousel__arrow category-carousel__arrow--next" type="button" onClick={()=>moveCategories(1)} aria-label="Categorías siguientes"><ChevronRight aria-hidden="true"/></button>
      </div>
    </section>}

    {catalogOnly && <section className="online-store" id="catalogo" aria-labelledby="online-store-title">
      <header className="online-store__header">
        <span>TIENDA ONLINE</span>
        <h2 id="online-store-title">{selectedCategoryName ?? "Todos los productos"}</h2>
        <p>{selectedCategoryName ? `Explora todos los productos de ${selectedCategoryName}.` : "Encuentra el aroma y formato perfecto para tus espacios."}</p>
      </header>
      <nav className="online-store__filters" aria-label="Filtrar productos por categoría">
        <button type="button" className={selectedCategory === "todos" ? "is-active" : ""} onClick={() => selectCategory("todos")}>TODOS</button>
        {homeCategories.map(category => <button type="button" className={selectedCategory === category.slug ? "is-active" : ""} onClick={() => selectCategory(category.slug)} key={category.id}>{category.name}</button>)}
      </nav>
      {filteredProducts.length > 0 ? <div className="online-store__grid">
        {filteredProducts.map(product => <Link className="online-product" href={product.href} key={product.id}>
          <span className="online-product__image"><Image src={product.image} alt={product.name} fill sizes="(max-width: 700px) 50vw, 25vw" unoptimized/></span>
          <small>{product.category}</small>
          <h3>{product.name}</h3>
          {product.note && <p>{product.note}</p>}
          <strong>{money(product.price)}</strong>
          <b>VER PRODUCTO →</b>
        </Link>)}
      </div> : <div className="online-store__empty"><strong>No hay productos disponibles en esta categoría.</strong><button type="button" onClick={() => selectCategory("todos")}>VER TODOS LOS PRODUCTOS</button></div>}
    </section>}

    {!catalogOnly && <section className="official-stores" aria-labelledby="official-stores-title">
      <header>
        <span>TIENDAS OFICIALES</span>
        <h2 id="official-stores-title">Visítanos en nuestras tiendas</h2>
      </header>
      <div className="official-stores__layout">
        <div className="official-stores__photo">
          <Image src={locations.find(location=>location.show_in_hero)?.image_url??locations[0]?.image_url??"/sobre-nosotros-aromastudio.png"} alt="Sucursal Aroma Studio" fill sizes="(max-width: 800px) 100vw, 50vw" unoptimized />
        </div>
        <div className="official-stores__content">
          <span>AROMA STUDIO</span>
          <h3>Encuentra tu aroma favorito</h3>
          <p>Visita nuestros puntos de venta y descubre una selección de productos y aromas pensados para transformar tus espacios. Nuestro equipo estará disponible para orientarte.</p>
          {locations.map(location=><article key={location.id}>
            <div><small>TIENDA</small><strong>{location.name}</strong><p>{location.address}</p></div>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`} target="_blank" rel="noopener noreferrer">CÓMO LLEGAR →</a>
          </article>)}
        </div>
      </div>
    </section>}

    {!catalogOnly && <section className="home-faq" aria-labelledby="home-faq-title"><header><span>¿TIENES DUDAS?</span><h2 id="home-faq-title">Preguntas frecuentes</h2></header><div>{faqs.map((faq)=><details key={faq.id}><summary>{faq.question}<b aria-hidden="true">+</b></summary><p>{faq.answer}</p></details>)}</div></section>}

    <SiteFooter/>

    {drawer && <><button className="drawer-overlay" onClick={() => setDrawer(false)} aria-label="Cerrar carrito"/><aside className="cart-drawer"><header><h2>Tu carrito ({cart.length})</h2><button onClick={() => setDrawer(false)}>×</button></header><div className="cart-items">{cart.length === 0 ? <p>Tu carrito está vacío.</p> : cart.map((id, index) => { const p = products.find(x => x.id === id)!; return <article key={`${id}-${index}`}><Image src={p.image} alt="" width={55} height={65} unoptimized={p.image.startsWith("http")}/><div><strong>{p.name}</strong><span>{money(p.price)}</span></div><button onClick={() => setCart(items => items.filter((_, i) => i !== index))}>×</button></article>})}</div><footer><span>Subtotal</span><strong>{money(total)}</strong><button onClick={() => notify("Checkout listo para conectar con tu medio de pago")}>FINALIZAR COMPRA</button></footer></aside></>}
    {toast && <div className="toast">✓ {toast}</div>}
  </main>;
}
