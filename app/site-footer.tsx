import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { FacebookIcon, InstagramIcon } from "./social-icons";

export default function SiteFooter() {
  return <footer className="site-footer">
    <div className="footer-brand"><Link href="/" className="footer-logo"><Image src="/logo-hd.png" alt="Aroma Studio" width={118} height={102}/></Link><p>Aromatizantes que transforman espacios y crean experiencias memorables.</p><div className="footer-social"><a href="https://www.facebook.com/aromastudio.cl" target="_blank" rel="noopener noreferrer" aria-label="Aroma Studio en Facebook"><FacebookIcon/></a><a href="https://www.instagram.com/aromastudio.cl" target="_blank" rel="noopener noreferrer" aria-label="Aroma Studio en Instagram"><InstagramIcon/></a></div></div>
    <nav aria-label="Productos"><strong>PRODUCTOS</strong><Link href="/tienda">Todos los productos</Link><Link href="/tienda">Home Spray</Link><Link href="/tienda">Difusor de Varillas</Link><Link href="/tienda">Esencias Puras</Link><Link href="/tienda">Difusor para Vehículo</Link></nav>
    <nav aria-label="Soluciones"><strong>SOLUCIONES</strong><Link href="/mayoristas">Empresas</Link><Link href="/emprendedores">Emprendedores</Link><Link href="/nosotros">Sobre nosotros</Link><Link href="/tienda">Tienda online</Link></nav>
    <div className="footer-contact"><strong>CONTÁCTANOS</strong><a href="https://wa.me/56993158300" target="_blank" rel="noopener noreferrer"><Phone aria-hidden="true"/>+56 9 9315 8300</a><a href="mailto:hola@aromastudio.cl"><Mail aria-hidden="true"/>hola@aromastudio.cl</a><span><MapPin aria-hidden="true"/>Espacio Urbano Plaza Maipú</span><span><MapPin aria-hidden="true"/>Espacio Urbano Las Rejas</span></div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} Aroma Studio. Todos los derechos reservados.</span><span>Despachos a todo Chile · Compra segura</span></div>
  </footer>;
}
