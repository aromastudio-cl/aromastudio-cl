"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { aromaLinks, contactLinks } from "./navigation-data";

type MobileMenuDrawerProps = {
  open: boolean;
  onClose: () => void;
  categories?: Array<{ id: string; name: string; slug: string }>;
};

export default function MobileMenuDrawer({ open, onClose, categories = [] }: MobileMenuDrawerProps) {
  if (!open) return null;

  return <>
    <button className="mobile-menu-drawer__backdrop" onClick={onClose} aria-label="Cerrar menú"/>
    <nav className="mobile-menu-drawer" aria-label="Navegación móvil">
      <button className="mobile-menu-drawer__close" onClick={onClose} aria-label="Cerrar menú"><X/></button>
      <Link className="mobile-menu-drawer__home" href="/" onClick={onClose}>Inicio</Link>
      <section><h2>Aromas</h2><div className="mobile-menu-drawer__aromas">{aromaLinks.map((item) => <Link href={item.href} onClick={onClose} key={item.name}><i className={`aroma-dot ${item.dotClass}`}/>{item.name}</Link>)}</div></section>
      <section><Link href="/productos" onClick={onClose}><h2>Catálogo</h2></Link>{categories.length > 0 && <div className="mobile-menu-drawer__links">{categories.map((category) => <Link href={`/productos?categoria=${category.slug}`} onClick={onClose} key={category.id}>{category.name}</Link>)}</div>}</section>
      <section><h2>Contacto</h2><div className="mobile-menu-drawer__links">{contactLinks.map((item) => item.external ? <a href={item.href} target="_blank" rel="noopener noreferrer" onClick={onClose} key={item.name}>{item.name}</a> : <Link href={item.href} onClick={onClose} key={item.name}>{item.name}</Link>)}</div></section>
    </nav>
  </>;
}
