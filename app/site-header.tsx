"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import MobileMenuDrawer from "./mobile-menu-drawer";
import { supabase } from "../lib/supabase-browser";
import { productVariantHref } from "../lib/product-routes";

type FeaturedProduct = { id: string; name: string; image: string; price: number; href: string };
type SearchProduct = FeaturedProduct & { category: string; note: string };
const money = (value: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);

type SiteHeaderProps = {
  cartCount?: number;
  onCart?: () => void;
  overlay?: boolean;
};

export default function SiteHeader({ cartCount, onCart, overlay = false }: SiteHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [desktopMenu, setDesktopMenu] = useState<string | null>(null);
  const [aromaMenuPinned, setAromaMenuPinned] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressMenuOpen = useRef(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [aromas, setAromas] = useState<Array<{ name: string; slug: string }>>([]);
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [searchProducts, setSearchProducts] = useState<SearchProduct[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [announcement, setAnnouncement] = useState({ text: "ENVÍOS A TODO CHILE", enabled: true });
  const [storedCartCount, setStoredCartCount] = useState(0);
  const visibleCartCount = cartCount ?? storedCartCount;

  const openDesktopMenu = (menu: string) => {
    if (suppressMenuOpen.current) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (menu !== "aromas") setAromaMenuPinned(false);
    setDesktopMenu(menu);
  };
  const scheduleDesktopMenuClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (aromaMenuPinned) return;
    closeTimer.current = setTimeout(() => setDesktopMenu(null), 280);
  };
  const closeDesktopMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setAromaMenuPinned(false);
    setDesktopMenu(null);
  };
  const closeDesktopMenuAfterSelection = () => {
    suppressMenuOpen.current = true;
    closeDesktopMenu();
  };
  const handleDesktopMenuLeave = () => {
    suppressMenuOpen.current = false;
    scheduleDesktopMenuClose();
  };
  const handleAromaClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (aromaMenuPinned) {
      setAromaMenuPinned(false);
      setDesktopMenu(null);
      return;
    }
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setAromaMenuPinned(true);
    setDesktopMenu("aromas");
  };
  const handleCatalogClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/tienda" && desktopMenu === "catalogo") {
      event.preventDefault();
      if (closeTimer.current) clearTimeout(closeTimer.current);
      setDesktopMenu(null);
    }
  };

  useEffect(() => {
    const readStoredCart = () => {
      try {
        const items = JSON.parse(localStorage.getItem("aroma-studio-cart") || "[]");
        setStoredCartCount(Array.isArray(items) ? items.reduce((total, item) => total + Number(item?.quantity || 0), 0) : 0);
      } catch {
        setStoredCartCount(0);
      }
    };
    readStoredCart();
    window.addEventListener("storage", readStoredCart);
    return () => window.removeEventListener("storage", readStoredCart);
  }, []);
  useEffect(() => {
    supabase.from("categories").select("id,name,slug").eq("active", true).order("sort_order").then(({ data }) => setCategories(data ?? []));
    supabase.from("site_settings").select("announcement_text,announcement_enabled").eq("id", 1).maybeSingle().then(({ data }) => {
      if (data) setAnnouncement({ text: data.announcement_text || "ENVÍOS A TODO CHILE", enabled: data.announcement_enabled !== false });
    });
    supabase.from("aroma_families").select("name,slug").eq("active", true).order("sort_order").then(({ data }) => setAromas(data ?? []));
    supabase.from("products").select("id,slug,name,price_clp,product_variants(id,size_value,size_unit,price_clp,sale_price_clp,is_default,active,sort_order),product_images(image_url,is_primary,sort_order)").eq("active", true).eq("featured", true).order("created_at", { ascending: false }).limit(3).then(({ data }) => {
      setFeaturedProducts((data ?? []).map((item: any) => {
        const variant = (item.product_variants ?? []).filter((entry: any) => entry.active !== false).sort((a: any, b: any) => Number(b.is_default) - Number(a.is_default) || (a.sort_order ?? 0) - (b.sort_order ?? 0))[0];
        const image = item.product_images?.find((entry: any) => entry.is_primary)?.image_url ?? item.product_images?.sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))?.[0]?.image_url ?? "/logo-hd.png";
        return { id: item.id, name: item.name, image, price: variant?.sale_price_clp ?? variant?.price_clp ?? item.price_clp, href: variant ? productVariantHref(item.slug, variant.size_value, variant.size_unit) : "/tienda" };
      }));
    });
    supabase.from("products").select("id,slug,name,scent_notes,price_clp,categories(name),product_variants(id,size_value,size_unit,price_clp,sale_price_clp,is_default,active,sort_order),product_images(image_url,is_primary,sort_order)").eq("active", true).order("created_at", { ascending: false }).then(({ data }) => {
      setSearchProducts((data ?? []).map((item: any) => {
        const variant = (item.product_variants ?? []).filter((entry: any) => entry.active !== false).sort((a: any, b: any) => Number(b.is_default) - Number(a.is_default) || (a.sort_order ?? 0) - (b.sort_order ?? 0))[0];
        const image = item.product_images?.find((entry: any) => entry.is_primary)?.image_url ?? item.product_images?.sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))?.[0]?.image_url ?? "/logo-hd.png";
        return { id: item.id, name: item.name, note: item.scent_notes ?? "", category: item.categories?.name ?? "Aroma Studio", image, price: variant?.sale_price_clp ?? variant?.price_clp ?? item.price_clp, href: variant ? productVariantHref(item.slug, variant.size_value, variant.size_unit) : "/tienda" };
      }));
    });
  }, []);
  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);
  useEffect(() => {
    if (!searchOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setSearchOpen(false); };
    document.addEventListener("keydown", close);
    document.body.classList.add("search-is-open");
    return () => { document.removeEventListener("keydown", close); document.body.classList.remove("search-is-open"); };
  }, [searchOpen]);
  const normalizedQuery = query.trim().toLocaleLowerCase("es");
  const searchResults = normalizedQuery.length < 2 ? [] : searchProducts.filter(product => `${product.name} ${product.note} ${product.category}`.toLocaleLowerCase("es").includes(normalizedQuery)).slice(0, 6);

  return <>{announcement.enabled && announcement.text && <div className="desktop-announcement">{announcement.text}</div>}<header className={`site-header${overlay ? " site-header--overlay" : ""}`}>
    <div className="mobile-header-left">
      <button className="mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Abrir menú" aria-expanded={menuOpen}><Menu aria-hidden="true" /></button>
      <button className="mobile-header-search" onClick={() => setSearchOpen(true)} aria-label="Buscar productos"><Search aria-hidden="true" /></button>
    </div>
    <Link href="/" className="logo"><Image src={overlay ? "/logo-white-transparent.png" : "/logo-hd.png"} alt="Aroma Studio" width={120} height={96} priority/></Link>
    <nav className="main-nav" aria-label="Navegación principal">
      <Link href="/">INICIO</Link>
      <div className={`nav-menu${desktopMenu==="aromas"?" is-open":""}`} onMouseLeave={handleDesktopMenuLeave}>
        <Link href="/tienda" aria-haspopup="true" aria-expanded={desktopMenu === "aromas"} onMouseEnter={()=>openDesktopMenu("aromas")} onClick={handleAromaClick}>AROMAS</Link>
        <div className="mega-menu mega-menu--aromas" onMouseEnter={()=>openDesktopMenu("aromas")}>
          {aromas.map((item,index) => <Link href={`/tienda?aroma=${item.slug}`} key={item.slug} onClick={closeDesktopMenuAfterSelection}><i className="aroma-dot" style={{backgroundColor:["#b45b73","#c47d16","#738451","#9c5b2b"][index%4]}}/>{item.name}</Link>)}
        </div>
      </div>
      <div className={`nav-menu${desktopMenu==="catalogo"?" is-open":""}`} onMouseLeave={handleDesktopMenuLeave}>
        <Link href="/tienda" aria-haspopup="true" aria-expanded={desktopMenu === "catalogo"} onMouseEnter={()=>openDesktopMenu("catalogo")} onClick={handleCatalogClick}>CATÁLOGO</Link>
        {categories.length > 0 && <div className="mega-menu mega-menu--catalog" onMouseEnter={()=>openDesktopMenu("catalogo")}>
          <div className="mega-menu__categories">
            {categories.map((category) => <Link href={`/tienda?categoria=${category.slug}`} key={category.id} onClick={closeDesktopMenuAfterSelection}>{category.name}</Link>)}
          </div>
          <div className="mega-menu__products" aria-label="Productos destacados">
            {featuredProducts.map(product => <Link className="mega-product" href={product.href} key={product.id} onClick={closeDesktopMenuAfterSelection}>
              <span><Image src={product.image} alt={product.name} fill sizes="260px" unoptimized/></span>
              <strong>{product.name}</strong>
              <small>{money(product.price)}</small>
            </Link>)}
            {!featuredProducts.length && <p className="mega-menu__empty">Aún no hay productos destacados.</p>}
          </div>
        </div>}
      </div>
      <Link href="/contacto">CONTACTO</Link>
    </nav>
    <div className="header-tools">
      <button className="header-tool desktop-search" onClick={() => setSearchOpen(true)} aria-label="Buscar productos"><Search aria-hidden="true" strokeWidth={1.7}/><span className="tool-label">BUSCAR</span></button>
      <Link className="header-tool header-account" href="/cuenta" aria-label="Mi cuenta"><UserRound aria-hidden="true" /><span className="tool-label">CUENTA</span></Link>
      {onCart ? <button className="header-tool header-cart" onClick={onCart} aria-label={`Abrir carrito con ${visibleCartCount} productos`}><ShoppingBag aria-hidden="true" strokeWidth={1.7}/><span className="tool-label">CARRITO</span><b>{visibleCartCount}</b></button> : <Link className="header-tool header-cart" href="/checkout" aria-label={`Ir al carrito con ${visibleCartCount} productos`}><ShoppingBag aria-hidden="true" strokeWidth={1.7}/><span className="tool-label">CARRITO</span><b>{visibleCartCount}</b></Link>}
    </div>
  </header>{searchOpen && <div className="search-overlay" role="dialog" aria-modal="true" aria-labelledby="site-search-title">
    <button className="search-overlay__backdrop" onClick={() => setSearchOpen(false)} aria-label="Cerrar búsqueda" />
    <section className="search-panel">
      <header><div><span>EXPLORA AROMA STUDIO</span><h2 id="site-search-title">¿Qué aroma buscas?</h2></div><button className="search-panel__close" onClick={() => setSearchOpen(false)} aria-label="Cerrar búsqueda"><X /></button></header>
      <div className="search-panel__field"><Search aria-hidden="true"/><input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Busca por nombre, aroma o categoría…" aria-label="Buscar productos"/>{query && <button onClick={() => setQuery("")} aria-label="Limpiar búsqueda"><X /></button>}</div>
      <div className="search-panel__content">
        {query.trim().length < 2 ? <p className="search-panel__hint">Escribe al menos dos caracteres para comenzar.</p> : searchResults.length ? <div className="search-panel__results">{searchResults.map(product => <Link href={product.href} key={product.id} onClick={() => setSearchOpen(false)}><span><Image src={product.image} alt="" fill sizes="72px" unoptimized/></span><div><small>{product.category}</small><strong>{product.name}</strong><p>{product.note || "Fragancia Aroma Studio"}</p></div><b>{money(product.price)}</b></Link>)}</div> : <div className="search-panel__empty"><strong>Sin resultados</strong><p>No encontramos productos para “{query.trim()}”. Prueba con otro aroma o categoría.</p><Link href="/tienda" onClick={() => setSearchOpen(false)}>VER TODO EL CATÁLOGO</Link></div>}
      </div>
    </section>
  </div>}<MobileMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} categories={categories} aromas={aromas}/></>;
}
