"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import SiteHeader from "./site-header";
import SiteFooter from "./site-footer";
import { supabase } from "../lib/supabase-browser";
import { productVariantHref } from "../lib/product-routes";
import { productCategoryLabel } from "../lib/catalog-order";

type Product = { id: string; name: string; family: string; category: string; categorySlug: string; price: number; note: string; image: string; stock: number; href: string };

const money = (value: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);

export default function Storefront() {
  const [products, setProducts] = useState<Product[]>([]);
  const [homeCategories, setHomeCategories] = useState<Array<{ id: string; name: string; slug: string; image_url: string | null }>>([]);
  const [locations, setLocations] = useState<Array<{id:string;name:string;address:string;image_url:string;show_in_hero:boolean}>>([]);
  const [faqs,setFaqs]=useState<Array<{id:string;question:string;answer:string}>>([]);
  const [cart, setCart] = useState<string[]>([]);
  const [drawer, setDrawer] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  useEffect(() => {
    supabase.from("categories").select("id,name,slug,image_url").eq("active", true).order("sort_order").then(({ data }) => setHomeCategories(data ?? []));
    supabase.from("store_locations").select("id,name,address,image_url,show_in_hero").eq("active",true).order("sort_order").then(({data})=>setLocations(data??[]));
    supabase.from("faqs").select("id,question,answer").eq("active",true).order("sort_order").then(({data})=>setFaqs(data??[]));
    supabase
      .from("products")
      .select("id,slug,name,scent_notes,price_clp,stock,categories(name,slug),product_variants(id,size_value,size_unit,is_default,sort_order,active),product_images(variant_id,image_url,is_primary,sort_order)")
      .eq("active", true)
      .eq("featured", true)
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
          family: productCategoryLabel(item.categories?.slug ?? "otros", item.categories?.name ?? "Aroma Studio"),
          category: productCategoryLabel(item.categories?.slug ?? "otros", item.categories?.name ?? "Otros"),
          categorySlug: item.categories?.slug ?? "otros",
          price: item.price_clp,
          note: item.scent_notes ?? "",
          stock: item.stock,
          image,
          href: variant ? productVariantHref(item.slug, variant.size_value, variant.size_unit) : "/productos",
        };
        }));
      });
  }, []);
  const total = cart.reduce((sum, id) => sum + (products.find(p => p.id === id)?.price ?? 0), 0);
  const notify = (text: string) => { setToast(text); window.setTimeout(() => setToast(""), 2200); };

  return <main className="storefront">
    <div className="topbar">ENVÍOS A TODO CHILE · COMPRA SEGURA</div>
    <div className="home-hero-shell" style={locations.find(location=>location.show_in_hero)?.image_url?{backgroundImage:`url("${locations.find(location=>location.show_in_hero)?.image_url}")`}:undefined}>
      <SiteHeader overlay cartCount={cart.length} onSearch={() => setSearch(!search)} onCart={() => setDrawer(true)}/>
      {search && <div className="search-panel"><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por aroma o nota…"/><button onClick={() => setSearch(false)}>Cerrar</button></div>}
      <section className="home-hero">
        <div className="hero-content">
          <h1><em>Descubre el aroma perfecto</em><br/>para cada espacio</h1>
          <p>Descubre fragancias que transforman tu hogar<br/>y tu día a día.</p>
        </div>
      </section>
    </div>

    <section className="home-faq" aria-labelledby="home-faq-title"><header><span>¿TIENES DUDAS?</span><h2 id="home-faq-title">Preguntas frecuentes</h2></header><div>{faqs.map((faq,index)=><details key={faq.id} open={index===0}><summary>{faq.question}<b aria-hidden="true">+</b></summary><p>{faq.answer}</p></details>)}</div></section>

    <section className="category-showcase" aria-labelledby="category-showcase-title">
      <header>
        <span>EXPLORA</span>
        <h2 id="category-showcase-title">Categorías de productos</h2>
        <p>Descubre nuestras categorías y elige el formato que mejor acompaña tu espacio.</p>
      </header>
      <div className="category-showcase__grid">
        {homeCategories.map((category) => (
          <Link className="category-showcase__card" href={`/productos?categoria=${category.slug}`} key={category.id}>
            <span className="category-showcase__image">
              {category.image_url && <Image src={category.image_url} alt={category.name} fill sizes="(max-width: 700px) 90vw, 25vw" unoptimized/>}
            </span>
            <h3>{category.name} <b aria-hidden="true">→</b></h3>
          </Link>
        ))}
      </div>
    </section>

    <section className="official-stores" aria-labelledby="official-stores-title">
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
    </section>

    <SiteFooter/>

    {drawer && <><button className="drawer-overlay" onClick={() => setDrawer(false)} aria-label="Cerrar carrito"/><aside className="cart-drawer"><header><h2>Tu carrito ({cart.length})</h2><button onClick={() => setDrawer(false)}>×</button></header><div className="cart-items">{cart.length === 0 ? <p>Tu carrito está vacío.</p> : cart.map((id, index) => { const p = products.find(x => x.id === id)!; return <article key={`${id}-${index}`}><Image src={p.image} alt="" width={55} height={65} unoptimized={p.image.startsWith("http")}/><div><strong>{p.name}</strong><span>{money(p.price)}</span></div><button onClick={() => setCart(items => items.filter((_, i) => i !== index))}>×</button></article>})}</div><footer><span>Subtotal</span><strong>{money(total)}</strong><button onClick={() => notify("Checkout listo para conectar con tu medio de pago")}>FINALIZAR COMPRA</button></footer></aside></>}
    {toast && <div className="toast">✓ {toast}</div>}
  </main>;
}
