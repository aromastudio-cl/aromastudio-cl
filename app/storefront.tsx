"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ShoppingBag, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import SiteHeader from "./site-header";
import SiteFooter from "./site-footer";
import { supabase } from "../lib/supabase-browser";
import { productVariantHref } from "../lib/product-routes";
import { productCategoryLabel } from "../lib/catalog-order";
import "./sale-prices.css";

type Product = { id: string; name: string; family: string; aromaSlug: string; category: string; categorySlug: string; price: number; normalPrice: number; note: string; image: string; stock: number; href: string };
type CartItem = { key: string; name: string; variant: string; image: string; price: number; quantity: number };

const money = (value: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);

export default function Storefront({ catalogOnly = false }: { catalogOnly?: boolean }) {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [homeCategories, setHomeCategories] = useState<Array<{ id: string; name: string; slug: string; image_url: string | null }>>([]);
  const [heroImages,setHeroImages]=useState({desktop:"",mobile:""});
  const [heroCopy,setHeroCopy]=useState({accent:"Descubre el aroma perfecto",title:"para cada espacio",description:"Descubre fragancias que transforman tu hogar y tu día a día."});
  const [storesSection,setStoresSection]=useState({eyebrow:"TIENDAS OFICIALES",title:"Visítanos en nuestras tiendas",contentEyebrow:"AROMA STUDIO",contentTitle:"Encuentra tu aroma favorito",contentText:"Visita nuestros puntos de venta y descubre una selección de productos y aromas pensados para transformar tus espacios. Nuestro equipo estará disponible para orientarte.",image:"/sobre-nosotros-aromastudio.png"});
  const [faqs,setFaqs]=useState<Array<{id:string;question:string;answer:string}>>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [drawer, setDrawer] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [selectedAroma, setSelectedAroma] = useState("");
  const categoryCarouselRef = useRef<HTMLDivElement>(null);
  const moveCategories = (direction: number) => categoryCarouselRef.current?.scrollBy({ left: direction * categoryCarouselRef.current.clientWidth * .82, behavior: "smooth" });
  useEffect(() => {
    try { setCart(JSON.parse(localStorage.getItem("aroma-studio-cart") || "[]")); } catch { setCart([]); }
    supabase.from("categories").select("id,name,slug,image_url").eq("active", true).order("sort_order").then(({ data }) => setHomeCategories(data ?? []));
    supabase.from("site_settings").select("hero_desktop_url,hero_mobile_url,hero_title_accent,hero_title,hero_description,stores_eyebrow,stores_title,stores_content_eyebrow,stores_content_title,stores_content_text,stores_image_url").eq("id",1).maybeSingle().then(({data})=>{if(data){setHeroImages({desktop:data.hero_desktop_url||"",mobile:data.hero_mobile_url||""});setHeroCopy({accent:data.hero_title_accent||"Descubre el aroma perfecto",title:data.hero_title||"para cada espacio",description:data.hero_description||"Descubre fragancias que transforman tu hogar y tu día a día."});setStoresSection({eyebrow:data.stores_eyebrow||"TIENDAS OFICIALES",title:data.stores_title||"Visítanos en nuestras tiendas",contentEyebrow:data.stores_content_eyebrow||"AROMA STUDIO",contentTitle:data.stores_content_title||"Encuentra tu aroma favorito",contentText:data.stores_content_text||"",image:data.stores_image_url||"/sobre-nosotros-aromastudio.png"})}});
    supabase.from("faqs").select("id,question,answer").eq("active",true).order("sort_order").then(({data})=>setFaqs(data??[]));
    supabase
      .from("products")
      .select("id,slug,name,scent_notes,aroma_family,price_clp,stock,categories(name,slug),aroma_families(name,slug),product_variants(id,size_value,size_unit,price_clp,sale_price_clp,is_default,sort_order,active),product_images(variant_id,image_url,is_primary,sort_order)")
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
          price: variant?.sale_price_clp ?? variant?.price_clp ?? item.price_clp,
          normalPrice: variant?.price_clp ?? item.price_clp,
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
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const removeCartItem = (key: string) => setCart(items => {
    const next = items.filter(item => item.key !== key);
    localStorage.setItem("aroma-studio-cart", JSON.stringify(next));
    return next;
  });
  const filteredProducts = selectedAroma ? products.filter(product => product.aromaSlug === selectedAroma) : selectedCategory === "todos" ? products : products.filter(product => product.categorySlug === selectedCategory);
  const selectCategory = (slug: string) => {
    setSelectedCategory(slug);
    setSelectedAroma("");
    const url = slug === "todos" ? "/tienda" : `/tienda?categoria=${encodeURIComponent(slug)}`;
    window.history.replaceState(null, "", url);
  };

  useEffect(() => {
    if (!drawer) return;
    document.body.classList.add("cart-is-open");
    return () => document.body.classList.remove("cart-is-open");
  }, [drawer]);

  return <main className="storefront">
    <div className="topbar">ENVÍOS A TODO CHILE · COMPRA SEGURA</div>
    {catalogOnly && <SiteHeader cartCount={cartCount} onCart={() => setDrawer(true)}/>}
    {!catalogOnly && <div className="home-hero-shell" style={{"--hero-desktop-image":heroImages.desktop?`url("${heroImages.desktop}")`:undefined,"--hero-mobile-image":heroImages.mobile?`url("${heroImages.mobile}")`:undefined} as CSSProperties}>
      <SiteHeader overlay cartCount={cartCount} onCart={() => setDrawer(true)}/>
      <section className="home-hero">
        <div className="hero-content">
          <h1><em>{heroCopy.accent}</em><br/>{heroCopy.title}</h1>
          <p>{heroCopy.description}</p>
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

    {catalogOnly && <section className="online-store" id="catalogo" aria-label="Productos de la tienda">
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
          <strong className={product.price < product.normalPrice ? "is-sale" : ""}>{product.price < product.normalPrice && <del>{money(product.normalPrice)}</del>}{money(product.price)}</strong>
          <b>VER PRODUCTO →</b>
        </Link>)}
      </div> : <div className="online-store__empty"><strong>No hay productos disponibles en esta categoría.</strong><button type="button" onClick={() => selectCategory("todos")}>VER TODOS LOS PRODUCTOS</button></div>}
    </section>}

    {!catalogOnly && <section className="official-stores" aria-labelledby="official-stores-title">
      <header>
        <span>{storesSection.eyebrow}</span>
        <h2 id="official-stores-title">{storesSection.title}</h2>
      </header>
      <div className="official-stores__layout">
        <div className="official-stores__photo">
          <Image src={storesSection.image} alt={storesSection.title} fill sizes="(max-width: 800px) 100vw, 50vw" unoptimized />
        </div>
        <div className="official-stores__content">
          <span>{storesSection.contentEyebrow}</span>
          <h3>{storesSection.contentTitle}</h3>
          <p>{storesSection.contentText}</p>
        </div>
      </div>
    </section>}

    {!catalogOnly && <section className="home-faq" aria-labelledby="home-faq-title"><header><span>¿TIENES DUDAS?</span><h2 id="home-faq-title">Preguntas frecuentes</h2></header><div>{faqs.map((faq)=><details key={faq.id}><summary>{faq.question}<b aria-hidden="true">+</b></summary><p>{faq.answer}</p></details>)}</div></section>}

    <SiteFooter/>

    {drawer && <><button className="drawer-overlay" onClick={() => setDrawer(false)} aria-label="Cerrar carrito"/><aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Carrito de compra"><header><h2>Tu carrito ({cartCount})</h2><button onClick={() => setDrawer(false)} aria-label="Cerrar carrito">×</button></header><div className="cart-items">{cart.length === 0 ? <div className="cart-empty"><ShoppingBag/><strong>Tu carrito está vacío</strong><Link href="/tienda" onClick={() => setDrawer(false)}>EXPLORAR PRODUCTOS</Link></div> : cart.map(item => <article key={item.key}><Image src={item.image} alt={item.name} width={64} height={78} unoptimized={item.image.startsWith("http")}/><div><strong>{item.name}</strong><span>{item.variant}</span><small>{item.quantity} × {money(item.price)}</small></div><button onClick={() => removeCartItem(item.key)} aria-label={`Eliminar ${item.name}`}>×</button></article>)}</div><footer><span>Subtotal</span><strong>{money(total)}</strong><button disabled={!cart.length} onClick={() => { window.location.href="/checkout" }}>FINALIZAR COMPRA</button></footer></aside></>}
  </main>;
}
