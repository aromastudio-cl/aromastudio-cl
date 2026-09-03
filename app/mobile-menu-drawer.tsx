"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { contactLinks } from "./navigation-data";

type MobileMenuDrawerProps = {
  open: boolean;
  onClose: () => void;
  categories?: Array<{ id: string; name: string; slug: string }>;
  aromas?: Array<{ name: string; slug: string }>;
};

export default function MobileMenuDrawer({ open, onClose, categories = [], aromas = [] }: MobileMenuDrawerProps) {
  if (!open) return null;

  return <>
    <button className="mobile-menu-drawer__backdrop" onClick={onClose} aria-label="Cerrar menú"/>
    <nav className="mobile-menu-drawer" aria-label="Navegación móvil">
      <button className="mobile-menu-drawer__close" onClick={onClose} aria-label="Cerrar menú"><X/></button>
      <Link className="mobile-menu-drawer__home" href="/" onClick={onClose}>Inicio</Link>
      <section><h2>Aromas</h2><div className="mobile-menu-drawer__aromas">{aromas.map((item,index) => <Link href={`/tienda?aroma=${item.slug}`} onClick={onClose} key={item.slug}><i className="aroma-dot" style={{backgroundColor:["#b45b73","#c47d16","#738451","#9c5b2b"][index%4]}}/>{item.name}</Link>)}</div></section>
      <section><Link href="/tienda" onClick={onClose}><h2>Catálogo</h2></Link>{categories.length > 0 && <div className="mobile-menu-drawer__links">{categories.map((category) => <Link href={`/tienda?categoria=${category.slug}`} onClick={onClose} key={category.id}>{category.name}</Link>)}</div>}</section>
      <section><Link href="/contacto" onClick={onClose}><h2>Contacto</h2></Link><div className="mobile-menu-drawer__links">{contactLinks.map((item) => item.external ? <a href={item.href} target="_blank" rel="noopener noreferrer" onClick={onClose} key={item.name}>{item.name}</a> : <Link href={item.href} onClick={onClose} key={item.name}>{item.name}</Link>)}</div></section>
      <Link className="mobile-menu-drawer__account" href="/cuenta" onClick={onClose}>Mi cuenta</Link>
    </nav>
  </>;
}
