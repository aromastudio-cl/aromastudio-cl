import type { Metadata } from "next";
import { BadgeCheck, Lightbulb, PackageCheck, Palette, Rocket, Sparkles } from "lucide-react";
import SiteHeader from "../site-header";
import styles from "./emprendedores.module.css";
import WhatsAppIcon from "../whatsapp-icon";
import SiteFooter from "../site-footer";

export const metadata: Metadata = {
  title: "Emprende con tu marca | Aroma Studio",
  description: "Asesoría personalizada para crear y hacer crecer tu negocio de aromatizantes, con opción de desarrollar productos con tu propia marca.",
};

const whatsapp = "https://wa.me/56993158300?text=Hola%20Aroma%20Studio%2C%20quiero%20recibir%20asesor%C3%ADa%20para%20crear%20o%20hacer%20crecer%20mi%20negocio%20de%20aromatizantes%20y%20conocer%20la%20opci%C3%B3n%20de%20tener%20mi%20propia%20marca.";

export default function EmprendedoresPage() {
  return <main className={styles.page}>
    <SiteHeader/>

    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <span className={styles.eyebrow}>EMPRENDEDORES</span>
        <h1>Tu idea, tu negocio,<br/><em>tu propia marca</em></h1>
        <p>Te acompañamos para convertir tu visión en un negocio de aromatizantes con identidad propia, productos atractivos y una propuesta preparada para crecer.</p>
        <a className={styles.primaryCta} href={whatsapp} target="_blank" rel="noopener noreferrer"><WhatsAppIcon/> Quiero recibir asesoría</a>
        <small>Atención personalizada por WhatsApp · +56 9 9315 8300</small>
      </div>
    </section>

    <section className={styles.intro}>
      <div><span>EMPRENDE CON RESPALDO</span><h2>Construye un negocio con propósito</h2></div>
      <p>No necesitas tener todo resuelto para comenzar. Te orientamos en la selección de productos, presentación y pasos comerciales. Si lo deseas, también puedes desarrollar una línea con tu propia marca.</p>
    </section>

    <section className={styles.benefits} aria-labelledby="beneficios-emprendedores">
      <div className={styles.sectionHeading}><span>UNA RUTA PENSADA PARA TI</span><h2 id="beneficios-emprendedores">Te ayudamos a avanzar</h2></div>
      <div className={styles.benefitGrid}>
        <article><Lightbulb/><h3>Orientación inicial</h3><p>Ordenamos tu idea y definimos una propuesta adecuada para comenzar.</p></article>
        <article><Palette/><h3>Tu propia identidad</h3><p>Conoce opciones para presentar productos con tu marca, si así lo deseas.</p></article>
        <article><PackageCheck/><h3>Productos seleccionados</h3><p>Elige un mix coherente con tus clientes, objetivos y presupuesto.</p></article>
        <article><Rocket/><h3>Preparado para crecer</h3><p>Recibe recomendaciones prácticas para dar tus próximos pasos comerciales.</p></article>
      </div>
    </section>

    <section className={styles.brandSection}>
      <div className={styles.brandVisual}><Sparkles aria-hidden="true"/><span>TU MARCA</span><b>Tu esencia.<br/>Tu historia.</b></div>
      <article><span>MARCA PROPIA</span><h2>Haz que cada producto hable de tu negocio</h2><p>Si buscas diferenciarte, conversemos sobre la posibilidad de crear una presentación alineada con tu identidad. Te explicaremos las alternativas disponibles, cantidades y proceso de desarrollo.</p><ul><li>Orientación para definir tu línea</li><li>Selección de aromas y formatos</li><li>Alternativas de presentación personalizada</li><li>Cotización según tu proyecto</li></ul><a href={whatsapp} target="_blank" rel="noopener noreferrer"><WhatsAppIcon/> Consultar por mi propia marca</a></article>
    </section>

    <section className={styles.process}>
      <div className={styles.processIntro}><span>COMENCEMOS</span><h2>De la idea a la acción</h2></div>
      <ol>
        <li><b>01</b><div><strong>Conversemos</strong><p>Cuéntanos tu idea, experiencia y objetivos.</p></div></li>
        <li><b>02</b><div><strong>Diseñamos tu propuesta</strong><p>Definimos productos, cantidades y alternativas de marca.</p></div></li>
        <li><b>03</b><div><strong>Impulsa tu negocio</strong><p>Recibe tu pedido y comienza a construir tu camino comercial.</p></div></li>
      </ol>
    </section>

    <section className={styles.finalCta}>
      <BadgeCheck aria-hidden="true"/><span>ASESORÍA PERSONALIZADA</span><h2>Tu próximo paso puede comenzar hoy</h2><p>Escríbenos y recibe orientación para crear o fortalecer tu negocio de aromatizantes.</p><a href={whatsapp} target="_blank" rel="noopener noreferrer"><WhatsAppIcon/> Hablar con un asesor por WhatsApp</a>
    </section>

    <SiteFooter/>
  </main>;
}
