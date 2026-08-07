import type { Metadata } from "next";
import Storefront from "./storefront";

export const metadata: Metadata = {
  title: "Aroma Studio | Perfumería de autor",
  description: "Fragancias inspiradas, creadas para contar tu historia.",
};

export default function Home() {
  return <Storefront />;
}
