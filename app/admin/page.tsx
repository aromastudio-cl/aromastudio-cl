"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";

type Product = { id: number; name: string; family: string; price: number; stock: number; active: boolean };
const seed: Product[] = [
  { id: 1, name: "Mango", family: "Frutal", price: 6990, stock: 28, active: true },
  { id: 2, name: "Bubble Gum", family: "Dulce", price: 6990, stock: 19, active: true },
  { id: 3, name: "Verbena", family: "Floral", price: 6990, stock: 6, active: true },
  { id: 4, name: "Cedrón, limón y menta", family: "Fresco", price: 6990, stock: 3, active: true },
  { id: 5, name: "Red Velvet", family: "Dulce", price: 6990, stock: 0, active: false },
];
const orders = [["#AS-1048", "Camila Soto", "$20.970", "Pagado"], ["#AS-1047", "Martín Vera", "$13.980", "Preparando"], ["#AS-1046", "Daniela Rojas", "$27.960", "Enviado"], ["#AS-1045", "Javiera Díaz", "$34.950", "Entregado"]];

export default function Admin() {
  const [tab, setTab] = useState("Resumen");
  const [products, setProducts] = useState(seed);
  const [modal, setModal] = useState(false);
  const create = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); setProducts(items => [{ id: Date.now(), name: String(data.get("name")), family: String(data.get("family")), price: Number(data.get("price")), stock: Number(data.get("stock")), active: true }, ...items]); setModal(false); };
  return <main className="admin-shell">
    <aside className="admin-sidebar"><Link href="/" className="admin-brand">AS<small>AROMA STUDIO</small></Link><p>ADMINISTRACIÓN</p><nav>{["Resumen","Productos","Pedidos","Clientes","Descuentos"].map((item, i) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}><i>{["⌂","◇","▱","♙","%"][i]}</i><span>{item}</span></button>)}</nav><Link href="/">← Ver tienda</Link></aside>
    <section className="admin-content"><header><div><p>7 DE AGOSTO DE 2026</p><h1>{tab}</h1></div><div className="admin-user"><b>JS</b><span><strong>Jorge Silva</strong><small>Administrador</small></span></div></header>
      {tab === "Resumen" && <><section className="admin-intro"><div><p>BUENOS DÍAS</p><h2>Así va Aroma Studio hoy.</h2></div><button onClick={() => setModal(true)}>+ NUEVO PRODUCTO</button></section><section className="stats"><article><p>VENTAS DEL MES <b>↗</b></p><strong>$2.486.740</strong><span>+18,4% vs. mes anterior</span></article><article><p>PEDIDOS <b>↗</b></p><strong>48</strong><span>+9 esta semana</span></article><article><p>TICKET PROMEDIO</p><strong>$18.807</strong><span>+4,2% vs. mes anterior</span></article><article><p>STOCK BAJO <b>!</b></p><strong>3</strong><span>Requieren atención</span></article></section><section className="admin-grid"><article className="chart-card"><div><p>RENDIMIENTO</p><h2>Ventas</h2></div><div className="bars">{[42,58,36,72,61,88,78].map((height, i) => <i key={i} style={{height: `${height}%`}}><span>{["L","M","M","J","V","S","D"][i]}</span></i>)}</div></article><article className="recent"><p>ACTIVIDAD</p><h2>Últimos pedidos</h2>{orders.map(order => <div key={order[0]}><b>{order[1].split(" ").map(x => x[0]).join("")}</b><span><strong>{order[1]}</strong><small>{order[0]} · Hace 2 h</small></span><em>{order[2]}</em></div>)}</article></section></>}
      {tab === "Productos" && <section className="admin-table"><header><div><p>GESTIÓN</p><h2>Catálogo de productos</h2></div><button onClick={() => setModal(true)}>+ NUEVO PRODUCTO</button></header><div><table><thead><tr><th>Producto</th><th>Familia</th><th>Precio</th><th>Stock</th><th>Estado</th></tr></thead><tbody>{products.map(product => <tr key={product.id}><td><i>AS</i><strong>{product.name}</strong></td><td>{product.family}</td><td>${product.price.toLocaleString("es-CL")}</td><td>{product.stock}</td><td><span className={product.stock === 0 ? "bad" : product.stock < 7 ? "warn" : "ok"}>{product.stock === 0 ? "Agotado" : product.stock < 7 ? "Stock bajo" : "Activo"}</span></td></tr>)}</tbody></table></div></section>}
      {tab === "Pedidos" && <section className="admin-table"><header><div><p>VENTAS</p><h2>Pedidos recientes</h2></div></header><div><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Total</th><th>Estado</th></tr></thead><tbody>{orders.map(order => <tr key={order[0]}>{order.map((value, i) => <td key={value}>{i === 3 ? <span className="ok">{value}</span> : value}</td>)}</tr>)}</tbody></table></div></section>}
      {["Clientes","Descuentos"].includes(tab) && <section className="admin-empty"><b>AS</b><h2>{tab}</h2><p>Sección preparada para administrar tus datos comerciales.</p></section>}
    </section>
    {modal && <div className="modal-backdrop"><form className="product-modal" onSubmit={create}><header><h2>Nuevo producto</h2><button type="button" onClick={() => setModal(false)}>×</button></header><label>Nombre<input name="name" required placeholder="Ej. Ámbar N° 04"/></label><label>Familia<select name="family"><option>Frutal</option><option>Floral</option><option>Fresco</option><option>Dulce</option><option>Especial</option></select></label><div><label>Precio<input name="price" type="number" required defaultValue="6990"/></label><label>Stock<input name="stock" type="number" required defaultValue="12"/></label></div><button>CREAR PRODUCTO</button></form></div>}
  </main>;
}
