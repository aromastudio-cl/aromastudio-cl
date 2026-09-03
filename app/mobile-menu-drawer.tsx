"use client";

import Link from "next/link";
import { X } from "lucide-react";

type MobileMenuDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export default function MobileMenuDrawer({ open, onClose }: MobileMenuDrawerProps) {
  if (!open) return null;

  return <>
    <button className="mobile-menu-drawer__backdrop" onClick={onClose} aria-label="Cerrar menú"/>
    <nav className="mobile-menu-drawer" aria-label="Navegación móvil">
      <button className="mobile-menu-drawer__close" onClick={onClose} aria-label="Cerrar menú"><X/></button>
      <Link className="mobile-menu-drawer__home" href="/" onClick={onClose}>Inicio</Link>
      <section><h2>Aromas</h2><div className="mobile-menu-drawer__aromas"><Link href="/tienda" onClick={onClose}><i className="aroma-dot aroma-dot--frutal"/>Frutales</Link><Link href="/tienda" onClick={onClose}><i className="aroma-dot aroma-dot--citrico"/>Cítricos</Link><Link href="/tienda" onClick={onClose}><i className="aroma-dot aroma-dot--amaderado"/>Amaderados</Link><Link href="/tienda" onClick={onClose}><i className="aroma-dot aroma-dot--dulce"/>Dulces</Link></div></section>
      <section><h2>Catálogo</h2><div className="mobile-menu-drawer__links"><Link href="/tienda" onClick={onClose}>Home Sprays</Link><Link href="/tienda" onClick={onClose}>Difusores de Varillas</Link><Link href="/tienda" onClick={onClose}>Humidificadores</Link><Link href="/tienda" onClick={onClose}>Esencias Puras</Link><Link href="/tienda" onClick={onClose}>Difusores para Auto</Link></div></section>
      <section><h2>Contacto</h2><div className="mobile-menu-drawer__links"><a href="https://wa.me/56993158300" target="_blank" rel="noopener noreferrer" onClick={onClose}>WhatsApp</a><Link href="/nosotros" onClick={onClose}>Sobre Aroma Studio</Link><Link href="/mayoristas" onClick={onClose}>Empresas</Link></div></section>
    </nav>
  </>;
}
