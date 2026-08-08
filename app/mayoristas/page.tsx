import type { Metadata } from "next";
import Image from "next/image";
import { Building2, CarFront, Check, Headphones, Hotel, PackageCheck, Sparkles, Truck } from "lucide-react";
import SiteFooter from "../site-footer";
import SiteHeader from "../site-header";
import WhatsAppIcon from "../whatsapp-icon";
import styles from "./mayoristas.module.css";

export const metadata: Metadata = {
  title: "Aromatización para empresas | Aroma Studio",
  description: "Aromatizantes ambientales para hoteles, lavados de autos, oficinas, comercios y empresas. Solicita una propuesta personalizada por WhatsApp.",
};

const whatsapp = "https://wa.me/56993158300?text=Hola%20Aroma%20Studio%2C%20quiero%20una%20propuesta%20de%20aromatizaci%C3%B3n%20para%20mi%20empresa.";

const sectors = [
  {
    icon: Hotel,
    eyebrow: "HOTELERÍA Y HOSPITALIDAD",
    title: "Un aroma que también recibe a tus huéspedes",
    copy: "Recepciones, habitaciones, pasillos y áreas comunes pueden transmitir limpieza, calma y una identidad memorable desde el primer momento.",
    image: "/empresas/hotel-aromatizacion.webp",
    alt: "Recepción de hotel ambientada con productos AromaStudio",
  },
  {
    icon: CarFront,
    eyebrow: "LAVADOS Y DETAILING AUTOMOTRIZ",
    title: "La experiencia de entrega termina con un gran aroma",
    copy: "Complementa cada lavado o detailing con una fragancia agradable. Contamos con alternativas para uso durante el servicio y productos que puedes ofrecer a tus clientes.",
    image: "/empresas/detailing-autos.webp",
    alt: "Servicio profesional de detailing con aromatizantes AromaStudio",
  },
  {
    icon: Building2,
    eyebrow: "OFICINAS, COMERCIOS Y SERVICIOS",
    title: "Espacios agradables para trabajar, atender y volver",
    copy: "Tiendas, clínicas, centros de estética, gimnasios, oficinas y salas de atención pueden incorporar una propuesta aromática adaptada a su flujo y tamaño.",
    image: "/empresas/oficinas-comercios.webp",
    alt: "Espacio comercial aromatizado con productos AromaStudio",
  },
];

export default function MayoristasPage() {
  return <main className={styles.page}>
    <SiteHeader />

    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <span>AROMATIZACIÓN PARA EMPRESAS</span>
        <h1>Tu espacio también puede tener una <em>identidad aromática</em></h1>
        <p>Soluciones para hoteles, lavados de autos, oficinas, comercios y negocios que quieren entregar una experiencia más agradable a sus clientes.</p>
        <a className={styles.primaryCta} href={whatsapp} target="_blank" rel="noopener noreferrer"><WhatsAppIcon /> Solicitar propuesta por WhatsApp</a>
        <small>Atención directa · Propuesta según tu tipo de empresa</small>
      </div>
      <div className={styles.heroImage}><Image src="/empresas/hotel-aromatizacion.webp" alt="Aromatización profesional en la recepción de un hotel" fill priority sizes="(max-width: 760px) 100vw, 58vw" /></div>
    </section>

    <section className={styles.trustBar} aria-label="Beneficios del servicio para empresas">
      <article><Sparkles /><span><b>Aromas seleccionados</b>Para cada tipo de espacio</span></article>
      <article><Headphones /><span><b>Asesoría personalizada</b>Te ayudamos a elegir</span></article>
      <article><PackageCheck /><span><b>Formatos para empresas</b>Según consumo y necesidad</span></article>
      <article><Truck /><span><b>Despachos en Chile</b>Coordinación de tu pedido</span></article>
    </section>

    <section className={styles.sectors}>
      <header>
        <span>SOLUCIONES SEGÚN TU NEGOCIO</span>
        <h2>El aroma correcto cambia<br/>la experiencia del lugar</h2>
        <p>No todas las empresas necesitan lo mismo. Diseñamos una propuesta considerando el espacio, el uso y la experiencia que quieres transmitir.</p>
      </header>
      <div className={styles.sectorList}>
        {sectors.map(({ icon: Icon, eyebrow, title, copy, image, alt }) => <article key={eyebrow}>
          <figure><Image src={image} alt={alt} fill sizes="(max-width: 760px) 100vw, 50vw" /></figure>
          <div><Icon aria-hidden="true" /><span>{eyebrow}</span><h3>{title}</h3><p>{copy}</p><a href={whatsapp} target="_blank" rel="noopener noreferrer"><WhatsAppIcon /> Cotizar para mi empresa</a></div>
        </article>)}
      </div>
    </section>

    <section className={styles.solution}>
      <div>
        <span>UNA PROPUESTA A TU MEDIDA</span>
        <h2>Productos para distintas formas de aromatizar</h2>
        <p>Podemos orientarte con Home Spray, mikados con varillas, difusores para auto, esencias y alternativas de difusión según el uso de tu empresa.</p>
      </div>
      <ul>
        <li><Check /> Selección de aromas según el ambiente</li>
        <li><Check /> Cantidades y formatos acordes a tu consumo</li>
        <li><Check /> Precios preferenciales por volumen</li>
        <li><Check /> Reposición simple y atención directa</li>
      </ul>
    </section>

    <section className={styles.process}>
      <header><span>COMENCEMOS</span><h2>Tu propuesta en tres pasos</h2></header>
      <ol>
        <li><b>01</b><h3>Cuéntanos sobre tu empresa</h3><p>Indica el tipo de negocio, los espacios y lo que necesitas aromatizar.</p></li>
        <li><b>02</b><h3>Recibe nuestra recomendación</h3><p>Te proponemos productos, aromas, cantidades y valores.</p></li>
        <li><b>03</b><h3>Coordinamos tu pedido</h3><p>Confirmamos preparación, pago y entrega de forma directa.</p></li>
      </ol>
    </section>

    <section className={styles.finalCta}>
      <span>HABLEMOS DE TU ESPACIO</span>
      <h2>Haz que tus clientes también recuerden tu empresa por su aroma</h2>
      <p>Escríbenos por WhatsApp y recibe una propuesta pensada para tu negocio.</p>
      <a href={whatsapp} target="_blank" rel="noopener noreferrer"><WhatsAppIcon /> Pedir propuesta por WhatsApp</a>
    </section>

    <SiteFooter />
    <a className="whatsapp-float" href={whatsapp} target="_blank" rel="noopener noreferrer" aria-label="Solicitar propuesta empresarial por WhatsApp"><WhatsAppIcon /></a>
  </main>;
}
