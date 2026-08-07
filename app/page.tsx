import type { Metadata } from "next";
import Storefront from "./storefront";
export const metadata: Metadata = { title: "Aroma Studio | Aromas que despiertan emociones", description: "Aromatizantes ambientales premium, venta minorista y mayorista con envíos a todo Chile." };
export default function Home() { return <Storefront/>; }
