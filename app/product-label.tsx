import Image from "next/image";
import styles from "./product-label.module.css";

type ProductLabelProps = {
  fragrance: string;
  notes?: string | null;
  productName: string;
  volumeMl?: number | null;
};

export default function ProductLabel({ fragrance, notes, productName, volumeMl }: ProductLabelProps) {
  return <div className={styles.label} aria-label={`Etiqueta ${productName} ${fragrance}`}>
    <Image className={styles.logo} src="/logo.png" alt="Aroma Studio" width={379} height={351} />
    <strong>{fragrance}</strong>
    <p>{notes?.trim() ? `NOTAS DE ${notes.trim().replace(/[.]$/, "")}.` : "NOTAS AROMÁTICAS PENDIENTES"}</p>
    <span>{productName}</span>
    {volumeMl ? <b>{volumeMl} ml</b> : null}
    <small>www.aromastudio.cl</small>
  </div>;
}
