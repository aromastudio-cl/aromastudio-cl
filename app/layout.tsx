import type { Metadata } from "next";
import { headers } from "next/headers";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import "./globals.css";
import "./hero.css";
import "./promises.css";
import "./whatsapp.css";
import "./logo-labels.css";
import "./search.css";
import "./navigation-fix.css";
import "./hero-settings.css";
import WhatsAppFloat from "./whatsapp-float";
const display = Cormorant_Garamond({ variable: "--font-display", subsets: ["latin"], weight: ["400","500","600"] });
const sans = Montserrat({ variable: "--font-sans", subsets: ["latin"], weight: ["400","500","600","700"] });
export async function generateMetadata(): Promise<Metadata> { const h = await headers(); const host = h.get("host") ?? "localhost:3000"; const protocol = host.includes("localhost") ? "http" : "https"; const image = `${protocol}://${host}/og-products.png`; return { title: "Aroma Studio | Aromatizantes ambientales para ti, tu negocio y emprendimiento", description: "Aromatizantes ambientales premium y venta mayorista en Chile.", icons: { icon: "/favicon-logo.png" }, openGraph: { title: "Aroma Studio", description: "Aromas que despiertan emociones.", images: [{ url: image, width: 1536, height: 1024, alt: "Productos Aroma Studio con etiquetas originales" }] }, twitter: { card: "summary_large_image", images: [image] } }; }
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="es"><body className={`${display.variable} ${sans.variable}`}>{children}<WhatsAppFloat /></body></html>; }
