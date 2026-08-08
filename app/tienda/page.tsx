import type { Metadata } from "next";
import Shop from "./shop";

export const metadata: Metadata = { title: "Tienda online | Aroma Studio", description: "Compra aromatizantes Aroma Studio y filtra por aroma, tipo de producto y precio." };
export default function TiendaPage() { return <Shop/>; }
