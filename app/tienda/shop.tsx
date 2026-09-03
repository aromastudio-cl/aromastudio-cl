"use client";
import Image from "next/image";
import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import SiteFooter from "../site-footer";
import SiteHeader from "../site-header";
import { supabase } from "../../lib/supabase-browser";
import { productVariantHref } from "../../lib/product-routes";
import { productCategoryLabel, productCategoryRank } from "../../lib/catalog-order";
import styles from "./tienda.module.css";

type ShopProduct = {
  id: string;
  name: string;
  aroma: string;
  notes: string;
  category: string;
  categorySlug: string;
  price: number;
  stock: number;
  image: string;
  format: string;
  variantName: string;
  promotional: boolean;
  href: string;
};
const money = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);

export default function Shop() {
  const [products, setProducts] = useState<ShopProduct[]>([]),
    [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState(false),
    [aroma, setAroma] = useState("todos"),
    [type, setType] = useState("todos"),
    [format, setFormat] = useState("todos"),
    [price, setPrice] = useState("todos"),
    [sort, setSort] = useState("destacados"),
    [cart, setCart] = useState<string[]>([]),
    [drawer, setDrawer] = useState(false),
    [mobileFilters, setMobileFilters] = useState(false);
  useEffect(() => {
    supabase
      .from("products")
      .select(
        "id,slug,name,scent_notes,price_clp,stock,categories(name,slug),product_variants(id,name,price_clp,stock,size_value,size_unit,is_default,sort_order,active,scents(name,slug)),product_images(variant_id,image_url,is_primary,sort_order)",
      )
      .eq("active", true)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error("No se pudieron cargar los productos", error);
          setLoadError(true);
          setLoading(false);
          return;
        }
        setProducts(
          (data ?? []).flatMap((item: any) => {
            const fallbackImage = item.product_images?.find((img: any) => img.is_primary)?.image_url
              ?? item.product_images?.sort((a: any, b: any) => a.sort_order - b.sort_order)?.[0]?.image_url
              ?? "/logo-hd.png";
            const variants = (item.product_variants ?? [])
              .filter((variant: any) => variant.active !== false)
              .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
            return variants.map((variant: any) => {
              const measure = variant.name.match(/(\d+)\s*ml/i)?.[1];
              return {
                id: variant.id,
                name: item.name,
                aroma: variant.scents?.name ?? variants[0]?.scents?.name ?? item.name,
                notes: item.scent_notes ?? "",
                category: productCategoryLabel(item.categories?.slug ?? "otros", item.categories?.name ?? "Otros"),
                categorySlug: item.categories?.slug ?? "otros",
                price: variant.price_clp,
                stock: variant.stock,
                variantName: variant.name,
                promotional: /promoci[oó]n/i.test(variant.name),
                format: measure ? `${measure} ml` : variant.name,
                image: item.product_images?.find((img: any) => img.variant_id === variant.id && img.is_primary)?.image_url ?? fallbackImage,
                href: productVariantHref(item.slug, variant.size_value, variant.size_unit),
              };
            });
          }),
        );
        setLoading(false);
      });
  }, []);
  const aromas = useMemo(
    () => Array.from(new Set(products.map((p) => p.aroma))).sort(),
    [products],
  );
  const types = useMemo(
    () =>
      Array.from(
        new Map(products.map((p) => [p.categorySlug, p.category])).entries(),
      ).sort(([a], [b]) => productCategoryRank(a) - productCategoryRank(b)),
    [products],
  );
  const formats = useMemo(
    () => Array.from(new Set(products.map((product) => product.format))).sort((a, b) => {
      const aSize = Number.parseFloat(a);
      const bSize = Number.parseFloat(b);
      if (Number.isNaN(aSize)) return 1;
      if (Number.isNaN(bSize)) return -1;
      return aSize - bSize;
    }),
    [products],
  );
  const visible = useMemo(
    () =>
      products
        .filter(
          (p) =>
            (aroma === "todos" || p.aroma === aroma) &&
            (type === "todos" || p.categorySlug === type) &&
            (format === "todos" || p.format === format) &&
            (price === "todos" ||
              (price === "menos-10000" && p.price < 10000) ||
              (price === "10000-20000" &&
                p.price >= 10000 &&
                p.price <= 20000) ||
              (price === "mas-20000" && p.price > 20000)),
        )
        .sort((a, b) => {
          if (sort === "destacados") {
            const categoryDifference =
              productCategoryRank(a.categorySlug) - productCategoryRank(b.categorySlug);
            if (categoryDifference !== 0) return categoryDifference;
          }

          return sort === "menor"
            ? a.price - b.price
            : sort === "mayor"
              ? b.price - a.price
              : a.name.localeCompare(b.name);
        }),
    [products, aroma, type, format, price, sort],
  );
  const clear = () => {
    setAroma("todos");
    setType("todos");
    setFormat("todos");
    setPrice("todos");
  };
  const filters = (
    <div className={styles.filterFields}>
      <label>
        AROMA
        <select value={aroma} onChange={(e) => setAroma(e.target.value)}>
          <option value="todos">Todos los aromas</option>
          {aromas.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
      <label>
        TIPO DE PRODUCTO
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="todos">Todos los tipos</option>
          {types.map(([slug, name]) => (
            <option key={slug} value={slug}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label>
        FORMATO
        <select value={format} onChange={(e) => setFormat(e.target.value)}>
          <option value="todos">Todos los formatos</option>
          {formats.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      <label>
        PRECIO
        <select value={price} onChange={(e) => setPrice(e.target.value)}>
          <option value="todos">Todos los precios</option>
          <option value="menos-10000">Menos de $10.000</option>
          <option value="10000-20000">$10.000 a $20.000</option>
          <option value="mas-20000">Más de $20.000</option>
        </select>
      </label>
      <button onClick={clear}>LIMPIAR FILTROS</button>
    </div>
  );
  return (
    <main className={styles.page}>
      <SiteHeader cartCount={cart.length} onCart={() => setDrawer(true)} />
      <header className={styles.shopHero}>
        <span>TIENDA ONLINE</span>
        <h1>
          Encuentra el aroma
          <br />
          <em>perfecto para ti</em>
        </h1>
        <p>Explora nuestra colección y filtra por aroma, formato o precio.</p>
      </header>
      <section className={styles.shop}>
        <aside className={styles.filters}>
          <div>
            <SlidersHorizontal />
            <strong>FILTRAR PRODUCTOS</strong>
          </div>
          {filters}
        </aside>
        <div className={styles.results}>
          <header>
            <div>
              <button
                className={styles.mobileFilterButton}
                onClick={() => setMobileFilters(true)}
              >
                <SlidersHorizontal /> FILTRAR
              </button>
              <span>{visible.length} PRODUCTOS</span>
            </div>
            <label>
              ORDENAR
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="destacados">Destacados</option>
                <option value="menor">Menor precio</option>
                <option value="mayor">Mayor precio</option>
              </select>
            </label>
          </header>
          {loading ? (
            <div className={styles.loading} role="status" aria-live="polite">
              <span>Cargando productos…</span>
            </div>
          ) : visible.length ? (
            <div className={styles.grid}>
              {visible.map((product) => (
                <article key={product.id}>
                  <Link href={product.href} className={styles.photo}>
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width:700px) 50vw, 25vw"
                      unoptimized={product.image.startsWith("http")}
                    />
                    {product.stock === 0 && <b>AGOTADO</b>}
                  </Link>
                  <span>{product.category}</span>
                  <h2><Link href={product.href}>{product.name}</Link></h2>
                  <p>{product.notes}</p>
                  <div className={`${styles.formats} ${product.promotional ? styles.promotion : ""}`}><div><span>{product.variantName}</span><strong>{money(product.price)}</strong></div></div>
                  <button
                    disabled={product.stock === 0}
                    onClick={() => setCart((items) => [...items, product.id])}
                  >
                    {product.stock === 0 ? "SIN STOCK" : "AGREGAR AL CARRITO"}
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <h2>{loadError ? "No pudimos cargar los productos" : "No encontramos productos"}</h2>
              <p>{loadError ? "Intenta nuevamente en unos momentos." : "Prueba modificando los filtros seleccionados."}</p>
              {!loadError && <button onClick={clear}>VER TODOS</button>}
            </div>
          )}
        </div>
      </section>
      {mobileFilters && (
        <div className={styles.mobilePanel}>
          <header>
            <strong>FILTRAR PRODUCTOS</strong>
            <button onClick={() => setMobileFilters(false)}>
              <X />
            </button>
          </header>
          {filters}
          <button
            className={styles.apply}
            onClick={() => setMobileFilters(false)}
          >
            VER {visible.length} PRODUCTOS
          </button>
        </div>
      )}
      {drawer && (
        <>
          <button
            className="drawer-overlay"
            onClick={() => setDrawer(false)}
            aria-label="Cerrar carrito"
          />
          <aside className="cart-drawer">
            <header>
              <h2>Tu carrito ({cart.length})</h2>
              <button onClick={() => setDrawer(false)}>×</button>
            </header>
            <div className="cart-items">
              {cart.length === 0 ? (
                <p>Tu carrito está vacío.</p>
              ) : (
                cart.map((id, index) => {
                  const product = products.find((p) => p.id === id)!;
                  return (
                    <article key={`${id}-${index}`}>
                      <Image
                        src={product.image}
                        alt=""
                        width={55}
                        height={65}
                        unoptimized={product.image.startsWith("http")}
                      />
                      <div>
                        <strong>{product.name}</strong>
                        <span>{money(product.price)}</span>
                      </div>
                      <button
                        onClick={() =>
                          setCart((items) =>
                            items.filter((_, i) => i !== index),
                          )
                        }
                      >
                        ×
                      </button>
                    </article>
                  );
                })
              )}
            </div>
            <footer>
              <span>Subtotal</span>
              <strong>
                {money(
                  cart.reduce(
                    (sum, id) =>
                      sum + (products.find((p) => p.id === id)?.price ?? 0),
                    0,
                  ),
                )}
              </strong>
              <button>FINALIZAR COMPRA</button>
            </footer>
          </aside>
        </>
      )}
      <SiteFooter />
    </main>
  );
}
