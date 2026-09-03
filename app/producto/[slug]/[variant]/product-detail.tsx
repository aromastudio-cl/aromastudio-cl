"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Minus, Plus, ShoppingBag, Truck } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import SiteFooter from "../../../site-footer";
import SiteHeader from "../../../site-header";
import "../../../sale-prices.css";

export type ProductVariantOption = {
  id: string;
  name: string;
  href: string;
  price: number;
  normalPrice: number;
  stock: number;
  active: boolean;
};

export type ProductDetailData = {
  productId: string;
  name: string;
  aroma: string;
  category: string;
  description: string;
  notes: string;
  sku: string;
  image: string;
  price: number;
  normalPrice: number;
  stock: number;
  variantId: string;
  variantName: string;
  options: ProductVariantOption[];
  reviews: ProductReview[];
};

export type ProductReview = { id: string; reviewerName: string; rating: number; comment: string; createdAt: string; variantName: string | null };
type CartItem = { key: string; name: string; variant: string; image: string; price: number; quantity: number };

const money = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);

export default function ProductDetail({ product }: { product: ProductDetailData }) {
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [drawer, setDrawer] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewMessage, setReviewMessage] = useState("");
  const [sendingReview, setSendingReview] = useState(false);

  useEffect(() => {
    try { setCart(JSON.parse(localStorage.getItem("aroma-studio-cart") || "[]")); } catch { setCart([]); }
  }, []);
  useEffect(() => {
    if (!drawer) return;
    document.body.classList.add("cart-is-open");
    return () => document.body.classList.remove("cart-is-open");
  }, [drawer]);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const addToCart = () => {
    setCart(items => {
      const key = `${product.productId}:${product.variantId}`;
      const existing = items.find(item => item.key === key);
      const next = existing
        ? items.map(item => item.key === key ? { ...item, quantity: Math.min(product.stock, item.quantity + quantity) } : item)
        : [...items, { key, name: product.name, variant: product.variantName, image: product.image, price: product.price, quantity }];
      localStorage.setItem("aroma-studio-cart", JSON.stringify(next));
      return next;
    });
    setDrawer(true);
  };
  const removeCartItem = (key: string) => setCart(items => {
    const next = items.filter(item => item.key !== key);
    localStorage.setItem("aroma-studio-cart", JSON.stringify(next));
    return next;
  });

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSendingReview(true);
    setReviewMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const response = await fetch("/api/product-reviews", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId: product.productId, variantId: product.variantId, reviewerName: data.get("reviewerName"), comment: data.get("comment"), website: data.get("website"), rating: reviewRating }) });
    const result = await response.json().catch(() => ({}));
    if (response.ok) {
      form.reset();
      setReviewRating(5);
      setReviewMessage("Gracias. Tu comentario quedó pendiente de aprobación.");
    } else setReviewMessage(result.error ?? "No pudimos enviar tu comentario.");
    setSendingReview(false);
  };

  return (
    <main>
      <SiteHeader cartCount={cartCount} onCart={() => setDrawer(true)} />
      <nav className="product-breadcrumb" aria-label="Migas de pan">
        <Link href="/">Inicio</Link><span>/</span>
        <Link href="/tienda">Productos</Link><span>/</span>
        <span>{product.name} · {product.variantName}</span>
      </nav>

      <section className="product-detail">
        <div className="product-detail__photo">
          <Image
            src={product.image}
            alt={`${product.name} ${product.variantName}`}
            fill
            sizes="(max-width: 800px) 100vw, 50vw"
            priority
            unoptimized={product.image.startsWith("http")}
          />
        </div>

        <article className="product-detail__info">
          <p className="product-detail__eyebrow">{product.category}</p>
          <h1>{product.name}</h1>
          <p className="product-detail__aroma">Aroma <strong>{product.aroma}</strong></p>
          <p className={`product-detail__price${product.price < product.normalPrice ? " is-sale" : ""}`}>{product.price < product.normalPrice && <del>{money(product.normalPrice)}</del>}<strong>{money(product.price)}</strong></p>
          <p className="product-detail__description">{product.description}</p>

          <div className="product-detail__notes">
            <span>NOTAS AROMÁTICAS</span>
            <p>{product.notes}</p>
          </div>

          <div className="product-detail__formats">
            <span>FORMATO</span>
            <div>
              {product.options.map((option) => (
                <Link
                  key={option.id}
                  href={option.href}
                  className={option.id === product.variantId ? "is-active" : ""}
                >
                  {option.name}
                  <small>{option.price < option.normalPrice && <del>{money(option.normalPrice)}</del>}{money(option.price)}</small>
                </Link>
              ))}
            </div>
          </div>

          <div className="product-detail__purchase">
            <div className="product-detail__quantity" aria-label="Cantidad">
              <button onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Disminuir cantidad"><Minus /></button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))} aria-label="Aumentar cantidad"><Plus /></button>
            </div>
            <button className="product-detail__add" disabled={product.stock === 0} onClick={addToCart}>
              <ShoppingBag /> {product.stock === 0 ? "SIN STOCK" : "AGREGAR AL CARRITO"}
            </button>
          </div>

          <div className="product-detail__assurances">
            <p><Check /> {product.stock > 0 ? `Disponible · ${product.stock} unidades` : "Producto agotado"}</p>
            <p><Truck /> Envíos a todo Chile</p>
          </div>
          <p className="product-detail__sku">SKU: {product.sku}</p>
        </article>
      </section>

      <section className="product-detail__story">
        <p>AROMA STUDIO</p>
        <h2>Una fragancia para transformar tus espacios</h2>
        <span>{product.notes}. Una composición creada para acompañar tus ambientes con una presencia elegante y duradera.</span>
        <Link href="/tienda">SEGUIR EXPLORANDO</Link>
      </section>

      <section className="product-reviews">
        <div className="product-reviews__list">
          <p className="product-reviews__eyebrow">OPINIONES</p>
          <h2>Comentarios de clientes</h2>
          {product.reviews.length ? <div className="product-reviews__items">{product.reviews.map((review) => <article key={review.id}><div><span aria-label={`${review.rating} de 5 estrellas`}>{"★".repeat(review.rating)}{"☆".repeat(5-review.rating)}</span><time>{new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }).format(new Date(review.createdAt))}</time></div><p>{review.comment}</p><strong>{review.reviewerName}</strong>{review.variantName && <small>{review.variantName}</small>}</article>)}</div> : <p className="product-reviews__empty">Aún no hay comentarios aprobados. Sé la primera persona en compartir tu experiencia.</p>}
        </div>
        <form className="product-review-form" onSubmit={submitReview}>
          <p>DEJA TU COMENTARIO</p><h2>¿Qué te pareció?</h2>
          <label>CALIFICACIÓN<div className="product-review-form__stars">{[1,2,3,4,5].map((value) => <button key={value} type="button" onClick={() => setReviewRating(value)} className={value <= reviewRating ? "is-active" : ""} aria-label={`${value} estrellas`}>★</button>)}</div></label>
          <label>NOMBRE<input name="reviewerName" required minLength={2} maxLength={80} autoComplete="name" /></label>
          <label>COMENTARIO<textarea name="comment" required minLength={1} maxLength={1200} rows={5} placeholder="Cuéntanos tu experiencia con este producto" /></label>
          <label className="product-review-form__honeypot" aria-hidden="true">Sitio web<input name="website" tabIndex={-1} autoComplete="off" /></label>
          <button disabled={sendingReview}>{sendingReview ? "ENVIANDO…" : "ENVIAR COMENTARIO"}</button>
          {reviewMessage && <output className="product-review-form__message">{reviewMessage}</output>}
          <small>Los comentarios se publican después de ser revisados por Aroma Studio.</small>
        </form>
      </section>

      <SiteFooter />

      {drawer && (
        <>
          <button className="drawer-overlay" onClick={() => setDrawer(false)} aria-label="Cerrar carrito" />
          <aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Carrito de compra">
            <header><h2>Tu carrito ({cartCount})</h2><button onClick={() => setDrawer(false)} aria-label="Cerrar carrito">×</button></header>
            <div className="cart-items">
              {cart.length ? cart.map(item => <article key={item.key}><Image src={item.image} alt={item.name} width={64} height={78} unoptimized={item.image.startsWith("http")} /><div><strong>{item.name}</strong><span>{item.variant}</span><small>{item.quantity} × {money(item.price)}</small></div><button onClick={() => removeCartItem(item.key)} aria-label={`Eliminar ${item.name}`}>×</button></article>) : <div className="cart-empty"><ShoppingBag/><strong>Tu carrito está vacío</strong><Link href="/tienda" onClick={() => setDrawer(false)}>EXPLORAR PRODUCTOS</Link></div>}
            </div>
            <footer><span>Subtotal</span><strong>{money(cartTotal)}</strong><button disabled={!cart.length} onClick={() => { window.location.href="/checkout" }}>FINALIZAR COMPRA</button></footer>
          </aside>
        </>
      )}
    </main>
  );
}
