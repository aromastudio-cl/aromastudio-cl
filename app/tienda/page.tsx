import type { Metadata } from "next";
import { Suspense } from "react";
import Storefront from "../storefront";

export const metadata: Metadata = {
  title: "Tienda online | Aroma Studio",
  description: "Explora todos los productos, categorías y aromas de Aroma Studio.",
};

export default function StorePage() {
  return <Suspense><Storefront catalogOnly /></Suspense>;
}
