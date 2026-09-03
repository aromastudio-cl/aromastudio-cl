"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Search, ShoppingBag, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import MobileMenuDrawer from "./mobile-menu-drawer";
import { supabase } from "../lib/supabase-browser";
import { aromaLinks, contactLinks } from "./navigation-data";

type SiteHeaderProps = {
  cartCount?: number;
  onSearch?: () => void;
  onCart?: () => void;
  overlay?: boolean;
};

export default function SiteHeader({ cartCount = 0, onSearch, onCart, overlay = false }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);

  useEffect(() => {
    supabase.from("categories").select("id,name,slug").eq("active", true).order("sort_order").then(({ data }) => setCategories(data ?? []));
  }, []);

  return <><div className="desktop-announcement">ENVÍOS A TODO CHILE</div><header className={`site-header${overlay ? " site-header--overlay" : ""}`}>
    <div className="mobile-header-left">
      <button className="mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Abrir menú" aria-expanded={menuOpen}><Menu aria-hidden="true" /></button>
      {onSearch ? <button className="mobile-header-search" onClick={onSearch} aria-label="Buscar productos"><Search aria-hidden="true" /></button> : <Link className="mobile-header-search" href="/productos" aria-label="Buscar productos"><Search aria-hidden="true" /></Link>}
    </div>
    <Link href="/" className="logo"><Image src={overlay ? "/logo-white-transparent.png" : "/logo-hd.png"} alt="Aroma Studio" width={120} height={96} priority/></Link>
    <nav className="main-nav" aria-label="Navegación principal">
      <Link href="/">INICIO</Link>
      <div className="nav-menu">
        <Link href="/productos" aria-haspopup="true">AROMAS</Link>
        <div className="mega-menu mega-menu--aromas">
          {aromaLinks.map((item) => <Link href={item.href} key={item.name}><i className={`aroma-dot ${item.dotClass}`}/>{item.name}</Link>)}
        </div>
      </div>
      <div className="nav-menu">
        <Link href="/productos" aria-haspopup="true">CATÁLOGO</Link>
        {categories.length > 0 && <div className="mega-menu mega-menu--catalog">
          <div className="mega-menu__categories">
            {categories.map((category) => <Link href={`/productos?categoria=${category.slug}`} key={category.id}>{category.name}</Link>)}
          </div>
        </div>}
      </div>
      <div className="nav-menu">
        <Link href="/nosotros" aria-haspopup="true">CONTACTO</Link>
        <div className="mega-menu mega-menu--aromas">
          {contactLinks.map((item) => item.external
            ? <a href={item.href} target="_blank" rel="noopener noreferrer" key={item.name}>{item.name}</a>
            : <Link href={item.href} key={item.name}>{item.name}</Link>)}
        </div>
      </div>
    </nav>
    <div className="header-tools">
      {onSearch ? <button className="header-tool desktop-search" onClick={onSearch} aria-label="Buscar productos"><Search aria-hidden="true" strokeWidth={1.7}/><span className="tool-label">BUSCAR</span></button> : <Link className="header-tool desktop-search" href="/productos" aria-label="Buscar productos"><Search aria-hidden="true" strokeWidth={1.7}/><span className="tool-label">BUSCAR</span></Link>}
      <Link className="header-tool header-account" href="/admin" aria-label="Mi cuenta"><UserRound aria-hidden="true" /><span className="tool-label">CUENTA</span></Link>
      {onCart ? <button className="header-tool header-cart" onClick={onCart} aria-label={`Abrir carrito con ${cartCount} productos`}><ShoppingBag aria-hidden="true" strokeWidth={1.7}/><span className="tool-label">CARRITO</span><b>{cartCount}</b></button> : <Link className="header-tool header-cart" href="/productos" aria-label="Ver productos"><ShoppingBag aria-hidden="true" strokeWidth={1.7}/><span className="tool-label">PRODUCTOS</span></Link>}
    </div>
  </header><MobileMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} categories={categories}/></>;
}
