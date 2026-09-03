"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Search, ShoppingBag, UserRound } from "lucide-react";
import { useState } from "react";
import MobileMenuDrawer from "./mobile-menu-drawer";

type SiteHeaderProps = {
  cartCount?: number;
  onSearch?: () => void;
  onCart?: () => void;
};

export default function SiteHeader({ cartCount = 0, onSearch, onCart }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return <><header className="site-header">
    <div className="mobile-header-left">
      <button className="mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Abrir menú" aria-expanded={menuOpen}><Menu aria-hidden="true" /></button>
      {onSearch ? <button className="mobile-header-search" onClick={onSearch} aria-label="Buscar productos"><Search aria-hidden="true" /></button> : <Link className="mobile-header-search" href="/tienda" aria-label="Buscar productos"><Search aria-hidden="true" /></Link>}
    </div>
    <Link href="/" className="logo"><Image src="/logo-hd.png" alt="Aroma Studio" width={120} height={96} priority/></Link>
    <nav className="main-nav" aria-label="Navegación principal">
      <Link href="/" onClick={() => setMenuOpen(false)}>INICIO</Link>
      <Link href="/tienda" onClick={() => setMenuOpen(false)}>TIENDA ONLINE</Link>
      <Link href="/productos" onClick={() => setMenuOpen(false)}>PRODUCTOS</Link>
      <Link href="/mayoristas" onClick={() => setMenuOpen(false)}>EMPRESAS</Link>
      <Link href="/emprendedores" onClick={() => setMenuOpen(false)}>EMPRENDEDORES</Link>
      <Link href="/nosotros" onClick={() => setMenuOpen(false)}>NOSOTROS</Link>
    </nav>
    <div className="header-tools">
      {onSearch ? <button className="header-tool desktop-search" onClick={onSearch} aria-label="Buscar productos"><Search aria-hidden="true" strokeWidth={1.7}/><span className="tool-label">BUSCAR</span></button> : <Link className="header-tool desktop-search" href="/tienda" aria-label="Buscar productos"><Search aria-hidden="true" strokeWidth={1.7}/><span className="tool-label">BUSCAR</span></Link>}
      <Link className="header-tool mobile-user" href="/admin" aria-label="Mi cuenta"><UserRound aria-hidden="true" /></Link>
      {onCart ? <button className="header-tool header-cart" onClick={onCart} aria-label={`Abrir carrito con ${cartCount} productos`}><ShoppingBag aria-hidden="true" strokeWidth={1.7}/><span className="tool-label">CARRITO</span><b>{cartCount}</b></button> : <Link className="header-tool header-cart" href="/tienda" aria-label="Ir a la tienda"><ShoppingBag aria-hidden="true" strokeWidth={1.7}/><span className="tool-label">TIENDA</span></Link>}
    </div>
  </header><MobileMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)}/></>;
}
