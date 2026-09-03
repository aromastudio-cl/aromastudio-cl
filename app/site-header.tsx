"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Search, ShoppingBag, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import MobileMenuDrawer from "./mobile-menu-drawer";
import { supabase } from "../lib/supabase-browser";
import { contactLinks } from "./navigation-data";
import { productVariantHref } from "../lib/product-routes";

type FeaturedProduct = { id: string; name: string; image: string; price: number; href: string };
const money = (value: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);

type SiteHeaderProps = {
  cartCount?: number;
  onSearch?: () => void;
  onCart?: () => void;
  overlay?: boolean;
};

export default function SiteHeader({ cartCount = 0, onSearch, onCart, overlay = false }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [desktopMenu, setDesktopMenu] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [aromas, setAromas] = useState<Array<{ name: string; slug: string }>>([]);
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);

  const openDesktopMenu = (menu: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setDesktopMenu(menu);
  };
  const scheduleDesktopMenuClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setDesktopMenu(null), 280);
  };

  useEffect(() => {
    supabase.from("categories").select("id,name,slug").eq("active", true).order("sort_order").then(({ data }) => setCategories(data ?? []));
    supabase.from("aroma_families").select("name,slug").eq("active", true).order("sort_order").then(({ data }) => setAromas(data ?? []));
    supabase.from("products").select("id,slug,name,price_clp,product_variants(id,size_value,size_unit,price_clp,is_default,active,sort_order),product_images(image_url,is_primary,sort_order)").eq("active", true).eq("featured", true).order("created_at", { ascending: false }).limit(3).then(({ data }) => {
      setFeaturedProducts((data ?? []).map((item: any) => {
        const variant = (item.product_variants ?? []).filter((entry: any) => entry.active !== false).sort((a: any, b: any) => Number(b.is_default) - Number(a.is_default) || (a.sort_order ?? 0) - (b.sort_order ?? 0))[0];
        const image = item.product_images?.find((entry: any) => entry.is_primary)?.image_url ?? item.product_images?.sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))?.[0]?.image_url ?? "/logo-hd.png";
        return { id: item.id, name: item.name, image, price: variant?.price_clp ?? item.price_clp, href: variant ? productVariantHref(item.slug, variant.size_value, variant.size_unit) : "/tienda" };
      }));
    });
  }, []);
  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  return <><div className="desktop-announcement">ENVÍOS A TODO CHILE</div><header className={`site-header${overlay ? " site-header--overlay" : ""}`}>
    <div className="mobile-header-left">
      <button className="mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Abrir menú" aria-expanded={menuOpen}><Menu aria-hidden="true" /></button>
      {onSearch ? <button className="mobile-header-search" onClick={onSearch} aria-label="Buscar productos"><Search aria-hidden="true" /></button> : <Link className="mobile-header-search" href="/tienda" aria-label="Buscar productos"><Search aria-hidden="true" /></Link>}
    </div>
    <Link href="/" className="logo"><Image src={overlay ? "/logo-white-transparent.png" : "/logo-hd.png"} alt="Aroma Studio" width={120} height={96} priority/></Link>
    <nav className="main-nav" aria-label="Navegación principal">
      <Link href="/">INICIO</Link>
      <div className={`nav-menu${desktopMenu==="aromas"?" is-open":""}`} onMouseLeave={scheduleDesktopMenuClose}>
        <Link href="/tienda" aria-haspopup="true" onMouseEnter={()=>openDesktopMenu("aromas")}>AROMAS</Link>
        <div className="mega-menu mega-menu--aromas" onMouseEnter={()=>openDesktopMenu("aromas")}>
          {aromas.map((item,index) => <Link href={`/tienda?aroma=${item.slug}`} key={item.slug}><i className="aroma-dot" style={{backgroundColor:["#b45b73","#c47d16","#738451","#9c5b2b"][index%4]}}/>{item.name}</Link>)}
        </div>
      </div>
      <div className={`nav-menu${desktopMenu==="catalogo"?" is-open":""}`} onMouseLeave={scheduleDesktopMenuClose}>
        <Link href="/tienda" aria-haspopup="true" onMouseEnter={()=>openDesktopMenu("catalogo")}>CATÁLOGO</Link>
        {categories.length > 0 && <div className="mega-menu mega-menu--catalog" onMouseEnter={()=>openDesktopMenu("catalogo")}>
          <div className="mega-menu__categories">
            {categories.map((category) => <Link href={`/tienda?categoria=${category.slug}`} key={category.id}>{category.name}</Link>)}
          </div>
          <div className="mega-menu__products" aria-label="Productos destacados">
            {featuredProducts.map(product => <Link className="mega-product" href={product.href} key={product.id}>
              <span><Image src={product.image} alt={product.name} fill sizes="260px" unoptimized/></span>
              <strong>{product.name}</strong>
              <small>{money(product.price)}</small>
            </Link>)}
            {!featuredProducts.length && <p className="mega-menu__empty">Aún no hay productos destacados.</p>}
          </div>
        </div>}
      </div>
      <div className={`nav-menu${desktopMenu==="contacto"?" is-open":""}`} onMouseLeave={scheduleDesktopMenuClose}>
        <Link href="/contacto" aria-haspopup="true" onMouseEnter={()=>openDesktopMenu("contacto")}>CONTACTO</Link>
        <div className="mega-menu mega-menu--aromas" onMouseEnter={()=>openDesktopMenu("contacto")}>
          {contactLinks.map((item) => item.external
            ? <a href={item.href} target="_blank" rel="noopener noreferrer" key={item.name}>{item.name}</a>
            : <Link href={item.href} key={item.name}>{item.name}</Link>)}
        </div>
      </div>
    </nav>
    <div className="header-tools">
      {onSearch ? <button className="header-tool desktop-search" onClick={onSearch} aria-label="Buscar productos"><Search aria-hidden="true" strokeWidth={1.7}/><span className="tool-label">BUSCAR</span></button> : <Link className="header-tool desktop-search" href="/tienda" aria-label="Buscar productos"><Search aria-hidden="true" strokeWidth={1.7}/><span className="tool-label">BUSCAR</span></Link>}
      <Link className="header-tool header-account" href="/cuenta" aria-label="Mi cuenta"><UserRound aria-hidden="true" /><span className="tool-label">CUENTA</span></Link>
      {onCart ? <button className="header-tool header-cart" onClick={onCart} aria-label={`Abrir carrito con ${cartCount} productos`}><ShoppingBag aria-hidden="true" strokeWidth={1.7}/><span className="tool-label">CARRITO</span><b>{cartCount}</b></button> : <Link className="header-tool header-cart" href="/tienda" aria-label="Ver productos"><ShoppingBag aria-hidden="true" strokeWidth={1.7}/><span className="tool-label">PRODUCTOS</span></Link>}
    </div>
  </header><MobileMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} categories={categories} aromas={aromas}/></>;
}
