import type { Metadata } from "next";
import { BadgeCheck, Boxes, Headphones, PackageCheck, Truck } from "lucide-react";
import SiteHeader from "../site-header";
import styles from "./mayoristas.module.css";
import WhatsAppIcon from "../whatsapp-icon";
import heroStyles from "./mayoristas-hero.module.css";
import SiteFooter from "../site-footer";

export const metadata: Metadata = {
  title: "Venta mayorista | Aroma Studio",
  description: "Cotizaciones personalizadas de aromatizantes ambientales para tiendas, empresas y emprendimientos en Chile.",
};

const whatsapp = "https://wa.me/56993158300?text=Hola%20Aroma%20Studio%2C%20quiero%20solicitar%20una%20cotizaci%C3%B3n%20mayorista%20personalizada.";

export default function MayoristasPage() {
  return <main className={styles.page}>
    <SiteHeader/>

    <section className={`${styles.hero} ${heroStyles.businessHero}`}>
      <div className={styles.heroContent}>
        <span className={styles.eyebrow}>VENTA MAYORISTA</span>
        <h1>Aromas para hacer<br/>crecer tu <em>negocio</em></h1>
        <p>Accede a precios preferenciales, asesoría cercana y una propuesta creada según las necesidades de tu tienda, empresa o emprendimiento.</p>
        <a className={styles.primaryCta} href={whatsapp} target="_blank" rel="noopener noreferrer"><WhatsAppIcon/> Pedir cotización personalizada</a>
        <small>Respuesta directa por WhatsApp · +56 9 9315 8300</small>
      </div>
    </section>

    <section className={styles.benefits} aria-labelledby="beneficios-mayoristas">
      <div className={styles.sectionHeading}><span>UNA ALIANZA PARA CRECER</span><h2 id="beneficios-mayoristas">Beneficios mayoristas</h2><p>Condiciones pensadas para ayudarte a vender más y construir una oferta aromática atractiva.</p></div>
      <div className={styles.benefitGrid}>
        <article><Boxes/><h3>Precios por volumen</h3><p>Valores preferenciales según cantidades y mix de productos.</p></article>
        <article><PackageCheck/><h3>Catálogo versátil</h3><p>Alternativas para distintos espacios, clientes y presupuestos.</p></article>
        <article><Headphones/><h3>Asesoría personalizada</h3><p>Te ayudamos a elegir productos y aromas adecuados para tu negocio.</p></article>
        <article><Truck/><h3>Despachos a todo Chile</h3><p>Coordinación segura y seguimiento de tu pedido mayorista.</p></article>
      </div>
    </section>

    <section className={styles.process}>
      <div className={styles.processIntro}><span>COTIZAR ES SIMPLE</span><h2>Tu pedido en tres pasos</h2></div>
      <ol>
        <li><b>01</b><div><strong>Cuéntanos sobre tu negocio</strong><p>Indica qué productos buscas y la cantidad aproximada.</p></div></li>
        <li><b>02</b><div><strong>Recibe una propuesta</strong><p>Preparamos precios y alternativas según tus necesidades.</p></div></li>
        <li><b>03</b><div><strong>Confirma tu pedido</strong><p>Coordinamos pago, preparación y despacho.</p></div></li>
      </ol>
    </section>

    <section className={styles.finalCta}>
      <BadgeCheck aria-hidden="true"/>
      <span>COTIZACIÓN A TU MEDIDA</span>
      <h2>Conversemos sobre tu próximo pedido</h2>
      <p>Escríbenos directamente y recibe atención personalizada para tu negocio.</p>
      <a href={whatsapp} target="_blank" rel="noopener noreferrer"><WhatsAppIcon/> Solicitar cotización por WhatsApp</a>
    </section>

    <SiteFooter/>
  </main>;
}
