import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, Sparkles } from "lucide-react";
import SiteFooter from "../site-footer";
import SiteHeader from "../site-header";
import styles from "./nosotros.module.css";

export const metadata: Metadata = {
  title: "Nosotros | Aroma Studio",
  description: "Conoce la historia, la filosofía y la pasión por los aromas que dan vida a Aroma Studio.",
};

const values = [
  {
    number: "01",
    title: "Aromas con identidad",
    copy: "Seleccionamos cada fragancia buscando equilibrio, personalidad y una presencia agradable que pueda integrarse naturalmente a distintos espacios.",
  },
  {
    number: "02",
    title: "Calidad en cada detalle",
    copy: "Cuidamos la formulación, la presentación y la experiencia de uso para ofrecer productos confiables, consistentes y fáciles de incorporar al día a día.",
  },
  {
    number: "03",
    title: "Cercanía real",
    copy: "Atendemos a personas, empresas y emprendedores con una orientación directa, entendiendo que cada espacio, proyecto y cliente necesita algo diferente.",
  },
];

export default function NosotrosPage() {
  return <main className={styles.page}>
    <SiteHeader />

    <section className={styles.hero}>
      <Image src="/sobre-nosotros-aromastudio.png" alt="Aroma Studio, pasión por crear experiencias a través de los aromas" fill priority sizes="100vw" />
      <div>
        <span>NUESTRA HISTORIA</span>
        <h1>Aromas que nacen<br/>para <em>transformar espacios</em></h1>
        <p>Creemos que un aroma puede cambiar la forma en que vivimos, recordamos y sentimos un lugar.</p>
      </div>
    </section>

    <section className={styles.intro}>
      <div className={styles.introTitle}>
        <span>QUIÉNES SOMOS</span>
        <h2>Pasión por los aromas,<br/><em>cuidado en cada detalle</em></h2>
      </div>
      <article>
        <p>Aroma Studio nace del deseo de crear ambientes con identidad. Seleccionamos cuidadosamente cada esencia para desarrollar productos capaces de acompañar momentos cotidianos y transformar la sensación de un espacio.</p>
        <p>No buscamos simplemente aromas intensos. Buscamos composiciones equilibradas, agradables y con personalidad; fragancias que se sientan bien desde el primer instante y mantengan su carácter a medida que se difunden.</p>
        <p>Hoy trabajamos para hogares, vehículos, empresas y emprendimientos, ofreciendo distintas formas de incorporar el aroma a cada experiencia.</p>
      </article>
    </section>

    <section className={styles.manifesto}>
      <div className={styles.manifestoImage}>
        <Image src="/products/editorial/elaboracion-artesanal.webp" alt="Proceso de elaboración y selección de fragancias de Aroma Studio" fill sizes="(max-width: 800px) 100vw, 50vw" />
      </div>
      <article>
        <Sparkles aria-hidden="true" />
        <span>NUESTRA FORMA DE CREAR</span>
        <h2>Cada fragancia comienza con una emoción</h2>
        <p>Observamos los ingredientes, las notas y la personalidad de cada aroma. A partir de esa inspiración trabajamos cada producto para lograr una difusión agradable, una presentación limpia y una experiencia coherente con la esencia de Aroma Studio.</p>
        <p>Desde un Home Spray que renueva un ambiente en segundos hasta un difusor que acompaña de forma continua, cada formato responde a una manera distinta de vivir el aroma.</p>
        <Link href="/productos">CONOCE NUESTROS PRODUCTOS</Link>
      </article>
    </section>

    <section className={styles.values}>
      <header>
        <span>LO QUE NOS MUEVE</span>
        <h2>Una marca construida<br/>desde los sentidos</h2>
      </header>
      <div>{values.map(value => <article key={value.number}>
        <b>{value.number}</b>
        <h3>{value.title}</h3>
        <p>{value.copy}</p>
      </article>)}</div>
    </section>

    <section className={styles.experience}>
      <article>
        <Heart aria-hidden="true" />
        <span>UNA EXPERIENCIA CERCANA</span>
        <h2>Queremos ayudarte a encontrar ese aroma que se sienta tuyo</h2>
        <p>Cada persona conecta de manera distinta con una fragancia. Por eso nos gusta escuchar, orientar y compartir nuestra experiencia para que puedas elegir el producto y el aroma adecuados para ti, tu negocio o tu emprendimiento.</p>
      </article>
      <div className={styles.experienceImage}>
        <Image src="/products/editorial/home-spray-ambiente.webp" alt="Un ambiente luminoso transformado por los aromas de Aroma Studio" fill sizes="(max-width: 800px) 100vw, 50vw" />
      </div>
    </section>

    <section className={styles.locations}>
      <div>
        <span>VEN A CONOCERNOS</span>
        <h2>Encuéntranos en<br/>nuestros dos locales</h2>
        <p>Visítanos para descubrir nuestras fragancias, conocer los distintos formatos y recibir una orientación personalizada.</p>
      </div>
      <div className={styles.locationCards}>
        <article><MapPin aria-hidden="true"/><div><strong>Espacio Urbano Plaza Maipú</strong><span>Maipú, Santiago</span></div></article>
        <article><MapPin aria-hidden="true"/><div><strong>Espacio Urbano Las Rejas</strong><span>Estación Central, Santiago</span></div></article>
      </div>
    </section>

    <section className={styles.closing}>
      <span>AROMA STUDIO</span>
      <h2>Tu espacio también puede<br/><em>contar una historia</em></h2>
      <p>Descubre aromas creados para acompañar tus momentos y transformar cada ambiente.</p>
      <Link href="/productos">VER PRODUCTOS</Link>
    </section>

    <SiteFooter />
  </main>;
}
