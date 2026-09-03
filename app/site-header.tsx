"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, ShoppingBag } from "lucide-react";
import { useState } from "react";

type SiteHeaderProps = {
  cartCount?: number;
  onSearch?: () => void;
  onCart?: () => void;
};

export default function SiteHeader({ cartCount = 0, onSearch, onCart }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return <header className="site-header">
    <button className="mobile-menu" onClick={() => setMenuOpen(value => !value)} aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} aria-expanded={menuOpen}>☰</button>
    <Link href="/" className="logo"><Image src="/logo-hd.png" alt="Aroma Studio" width={120} height={96} priority/></Link>
    <nav className={menuOpen ? "main-nav is-open" : "main-nav"} aria-label="Navegación principal">
      <Link href="/" onClick={() => setMenuOpen(false)}>INICIO</Link>
      <Link href="/tienda" onClick={() => setMenuOpen(false)}>TIENDA ONLINE</Link>
      <Link href="/productos" onClick={() => setMenuOpen(false)}>PRODUCTOS</Link>
      <Link href="/mayoristas" onClick={() => setMenuOpen(false)}>EMPRESAS</Link>
      <Link href="/emprendedores" onClick={() => setMenuOpen(false)}>EMPRENDEDORES</Link>
      <Link href="/nosotros" onClick={() => setMenuOpen(false)}>NOSOTROS</Link>
    </nav>
    <div className="header-tools">
      {onSearch ? <button className="header-tool" onClick={onSearch} aria-label="Buscar productos"><Search aria-hidden="true" strokeWidth={1.7}/><span className="tool-label">BUSCAR</span></button> : <Link className="header-tool" href="/#productos" aria-label="Buscar productos"><Search aria-hidden="true" strokeWidth={1.7}/><span className="tool-label">BUSCAR</span></Link>}
      {onCart ? <button className="header-tool" onClick={onCart} aria-label={`Abrir carrito con ${cartCount} productos`}><ShoppingBag aria-hidden="true" strokeWidth={1.7}/><span className="tool-label">CARRITO</span><b>{cartCount}</b></button> : <Link className="header-tool" href="/#productos" aria-label="Ir a la tienda"><ShoppingBag aria-hidden="true" strokeWidth={1.7}/><span className="tool-label">TIENDA</span></Link>}
    </div>
  </header>;
}
