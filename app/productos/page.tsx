import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteFooter from "../site-footer";
import SiteHeader from "../site-header";
import WhatsAppIcon from "../whatsapp-icon";
import styles from "./productos.module.css";

export const metadata: Metadata = {
  title: "Nuestros productos | Aroma Studio",
  description: "Conoce cómo desarrollamos aromas para transformar tus espacios y descubre nuestras formas de aromatización.",
};

const process = [
  {
    number: "01",
    title: "El proceso comienza con la selección del aroma",
    paragraphs: [
      "Todo comienza con una idea: la sensación que queremos transmitir. Frescura, limpieza, tranquilidad, naturaleza, elegancia, calidez o energía pueden convertirse en el punto de partida para desarrollar una nueva fragancia.",
      "A partir de ahí seleccionamos cuidadosamente las esencias que formarán parte de cada producto, buscando obtener aromas equilibrados y agradables, capaces de mantenerse en el ambiente y entregar una experiencia consistente durante su uso.",
      "No buscamos simplemente aromas intensos. Buscamos encontrar el equilibrio adecuado entre presencia, duración y personalidad. Cada fragancia debe sentirse agradable desde el primer momento y mantener su identidad a medida que se difunde en el ambiente.",
    ],
  },
  {
    number: "02",
    title: "Formulación y combinación de ingredientes",
    paragraphs: [
      "Una vez definida la esencia, comienza el proceso de formulación. Dependiendo del producto, se combinan las esencias con diferentes bases y componentes que permiten lograr la correcta difusión del aroma.",
      "Un Home Spray necesita una formulación que permita dispersar rápidamente la fragancia en el ambiente. Un Mikado necesita que la esencia pueda ascender correctamente a través de sus varillas para entregar una aromatización progresiva. Un difusor para vehículo debe adaptarse a un espacio mucho más reducido. Las esencias puras, por su parte, deben conservar toda la personalidad y concentración de la fragancia.",
      "Por esta razón, cada categoría requiere un proceso diferente. Las proporciones y combinaciones utilizadas son cuidadosamente trabajadas para conseguir un producto estable, funcional y agradable de utilizar.",
    ],
  },
  {
    number: "03",
    title: "Elaboración en pequeñas producciones",
    paragraphs: [
      "En AromaStudio privilegiamos una elaboración cuidadosa y controlada. Trabajar de esta manera nos permite prestar atención a cada etapa del proceso, desde la preparación de las mezclas hasta el envasado final.",
      "Las diferentes fórmulas son preparadas respetando las proporciones correspondientes a cada producto y buscando mantener la misma experiencia entre una producción y otra. Después de realizar la mezcla, cada producto continúa con el proceso necesario para que sus componentes puedan integrarse correctamente antes de ser envasado.",
      "Este cuidado permite conseguir aromas más equilibrados y una mejor experiencia al momento de utilizarlos.",
    ],
  },
  {
    number: "04",
    title: "Reposo e integración de las fragancias",
    paragraphs: [
      "Una fragancia no termina inmediatamente después de mezclar sus componentes. Dependiendo de la formulación, es importante permitir que los diferentes elementos se integren correctamente.",
      "Durante este proceso, las notas aromáticas se estabilizan y comienzan a desarrollar el carácter que tendrá el producto final. Es una etapa fundamental para conseguir aromas más armónicos, donde las distintas notas puedan sentirse como una composición completa y no simplemente como ingredientes separados.",
      "Este proceso también contribuye a que la fragancia mantenga una experiencia más consistente durante su utilización.",
    ],
  },
  {
    number: "05",
    title: "Control antes del envasado",
    paragraphs: [
      "Antes de llegar a su presentación final, revisamos diferentes aspectos de cada producto. Observamos la apariencia de la formulación, su aroma, comportamiento y características generales para comprobar que mantenga las condiciones que buscamos entregar en AromaStudio.",
      "La calidad no depende solamente de cómo huele un producto. También importa cómo se utiliza, cómo se conserva, cómo se difunde y cómo se comporta durante el tiempo.",
      "Por eso ponemos especial atención en cada detalle antes de continuar con el proceso de envasado.",
    ],
  },
  {
    number: "06",
    title: "Envasado y presentación",
    paragraphs: [
      "Cuando la formulación se encuentra preparada, comienza el proceso de envasado. Cada producto es presentado en un formato pensado tanto para facilitar su utilización como para integrarse visualmente a los espacios.",
      "Para nosotros, el diseño también forma parte de la experiencia. Queremos que nuestros productos no solamente entreguen un aroma agradable, sino que también puedan formar parte de la decoración de una habitación, un baño, un living, una oficina o cualquier otro espacio.",
      "Buscamos una estética limpia, sencilla y elegante que represente la esencia de AromaStudio.",
    ],
  },
];

const categories = [
  ["Home Spray", "Pensado para quienes buscan una aromatización rápida. Unas aplicaciones permiten renovar la sensación de un dormitorio, living, baño, oficina o cualquier espacio donde quieras incorporar tu aroma favorito. Es ideal para utilizar durante diferentes momentos del día y cambiar rápidamente la atmósfera de un ambiente."],
  ["Difusor de Varillas", "Una alternativa de difusión continua. Las varillas absorben progresivamente la fragancia y permiten que el aroma se libere poco a poco en el ambiente. Son ideales para espacios donde quieres mantener una sensación aromática constante, además de aportar un elemento decorativo limpio y elegante."],
  ["Esencias puras", "Para quienes buscan mayor versatilidad y concentración. Nuestras esencias permiten disfrutar diferentes perfiles aromáticos y pueden utilizarse según las indicaciones correspondientes para cada tipo de aplicación."],
  ["Difusor para Vehículo", "El aroma también puede acompañarte mientras conduces. Nuestros difusores para vehículo están pensados para espacios pequeños y permiten mantener una sensación agradable dentro del automóvil durante los trayectos diarios."],
  ["Humidificadores y difusión de aromas", "Una alternativa para quienes disfrutan crear ambientes relajantes y personalizados. Combinados con esencias compatibles y utilizadas correctamente, permiten incorporar aromas al espacio mientras forman parte de una experiencia de bienestar y ambientación."],
];

export default function ProductosPage() {
  return <main className={styles.page}>
    <SiteHeader />
    <section className={styles.hero}>
      <div><span>NUESTROS PRODUCTOS</span><h1>Aromas creados para<br/><em>transformar tus espacios</em></h1><p>Un aroma puede cambiar por completo la forma en que percibimos un lugar.</p></div>
      <Image src="/products/editorial/home-spray-ambiente.webp" alt="Home Spray en un ambiente luminoso y elegante" fill priority sizes="100vw" />
    </section>

    <section className={styles.intro}>
      <span>LA EXPERIENCIA AROMASTUDIO</span>
      <div>
        <h2>Mucho más que<br/>perfumar un ambiente</h2>
        <article>
          <p>En <strong>AromaStudio</strong> creemos que un aroma puede cambiar por completo la forma en que percibimos un espacio. Puede entregar sensación de limpieza, frescura, calma, energía, sofisticación o simplemente convertir un lugar cotidiano en un ambiente mucho más agradable.</p>
          <p>Por eso, nuestros productos no nacen solamente de la idea de perfumar. Cada aroma es desarrollado buscando crear una experiencia que pueda integrarse naturalmente a distintos momentos del día y diferentes espacios: tu hogar, dormitorio, living, oficina, vehículo, negocio o cualquier lugar donde quieras crear una atmósfera especial.</p>
          <p>Trabajamos con ingredientes cuidadosamente seleccionados y procesos de elaboración controlados, poniendo especial atención en la calidad de cada fórmula, la estabilidad del aroma y la experiencia final de quienes utilizan nuestros productos.</p>
          <p>Nuestro objetivo es ofrecer productos confiables, seguros y agradables de utilizar, con aromas equilibrados que puedan acompañarte diariamente sin perder la esencia que caracteriza a AromaStudio.</p>
        </article>
      </div>
    </section>

    <figure className={styles.wideImage}><Image src="/products/editorial/elaboracion-artesanal.webp" alt="Elaboración artesanal de fragancias en pequeñas producciones" fill sizes="100vw"/></figure>

    <section className={styles.process}>
      <header><span>NUESTRO PROCESO</span><h2>Cuidado en cada etapa</h2><p>Desde la elección de una fragancia hasta el momento en que llega a tus manos.</p></header>
      <div>{process.map(step => <article key={step.number}><b>{step.number}</b><h3>{step.title}</h3>{step.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</article>)}</div>
    </section>

    <section className={styles.ingredients}>
      <div><span>MATERIAS PRIMAS</span><h2>Ingredientes cuidadosamente seleccionados</h2><p>La selección de materias primas es una parte fundamental de nuestros productos.</p><p>Priorizamos ingredientes que nos permitan desarrollar fórmulas de calidad, buscando siempre un equilibrio entre aroma, estabilidad, rendimiento y seguridad de uso.</p><p>Cada componente cumple una función dentro de la formulación y es seleccionado considerando las características específicas del producto en el que será utilizado.</p><p>Nuestro compromiso es ofrecer alternativas que puedan incorporarse fácilmente a la vida cotidiana, siguiendo siempre las indicaciones correspondientes de utilización y conservación.</p></div>
      <Image src="/products/editorial/mikado-varillas.webp" alt="Mikado de vidrio ámbar con varillas negras como elemento decorativo" fill sizes="(max-width: 800px) 100vw, 50vw"/>
    </section>

    <section className={styles.formats}>
      <header><span>PARA CADA ESPACIO</span><h2>Distintas formas de disfrutar<br/>nuestras fragancias</h2><p>Cada lugar tiene características diferentes y por eso desarrollamos distintas formas de aromatización.</p></header>
      <div>{categories.map(([title, copy], index) => <article key={title}><b>0{index + 1}</b><h3>{title}</h3><p>{copy}</p></article>)}</div>
    </section>

    <figure className={styles.wideImage}><Image src="/products/editorial/difusion-aromas.webp" alt="Difusor para auto, esencia pura y humidificador de aromas" fill sizes="100vw"/></figure>

    <section className={styles.moments}>
      <span>AROMAS QUE FORMAN PARTE DE TUS MOMENTOS</span>
      <h2>Una sensación.<br/>Una identidad.<br/><em>Una experiencia.</em></h2>
      <div><article><p>Un aroma tiene una capacidad especial para conectarnos con sensaciones, lugares y recuerdos.</p><p>El aroma de una habitación al comenzar el día. La sensación de limpieza después de ordenar tu hogar. Una fragancia relajante mientras descansas. Un ambiente agradable mientras trabajas. El aroma que recibe a las personas cuando entran a tu casa o negocio.</p><p>Son pequeños detalles que pueden transformar nuestra percepción de los espacios.</p></article><article><p>En AromaStudio desarrollamos nuestros productos pensando precisamente en esos momentos.</p><p>Queremos ayudarte a crear lugares donde sea agradable permanecer, descansar, trabajar, compartir y volver.</p></article></div>
    </section>

    <section className={styles.closing}>
      <span>UNA EXPERIENCIA AROMASTUDIO</span>
      <h2>Todo este proceso tiene<br/>un mismo propósito</h2>
      <p>Seleccionamos los aromas, desarrollamos las formulaciones, realizamos las mezclas, permitimos su adecuada integración, revisamos el producto y finalmente realizamos su envasado y presentación.</p>
      <strong>Crear productos de calidad que permitan transformar tus espacios a través del aroma.</strong>
      <p>Porque para nosotros perfumar un ambiente significa mucho más que agregar una fragancia. Significa crear una sensación. Significa darle identidad a un espacio. Significa convertir lo cotidiano en una experiencia más agradable.</p>
      <h3>Descubre AromaStudio y encuentra el aroma que quieres hacer parte de tus espacios.</h3>
      <Link href="/tienda">DESCUBRIR PRODUCTOS</Link>
    </section>
    <SiteFooter />
    <a className="whatsapp-float" href="https://wa.me/56993158300?text=Hola%20Aroma%20Studio%2C%20quisiera%20m%C3%A1s%20informaci%C3%B3n." target="_blank" rel="noopener noreferrer" aria-label="Contactar a Aroma Studio por WhatsApp"><WhatsAppIcon/></a>
  </main>;
}
