import type { Metadata } from "next";
import { headers } from "next/headers";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({ variable: "--font-display", subsets: ["latin"], weight: ["400", "500", "600"] });
const sans = Montserrat({ variable: "--font-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const image = `${protocol}://${host}/og.png`;
  return { title: "Aroma Studio | Perfumería de autor", description: "Descubre la esencia que habla de ti.", icons: { icon: "/favicon.svg" }, openGraph: { title: "Aroma Studio", description: "Descubre la esencia que habla de ti.", images: [{ url: image, width: 1792, height: 933 }] }, twitter: { card: "summary_large_image", images: [image] } };
}
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="es"><body className={`${display.variable} ${sans.variable}`}>{children}</body></html>; }
