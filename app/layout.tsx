import type { Metadata } from "next";
import { headers } from "next/headers";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import "./globals.css";
import "./logo-labels.css";
const display = Cormorant_Garamond({ variable: "--font-display", subsets: ["latin"], weight: ["400","500","600"] });
const sans = Montserrat({ variable: "--font-sans", subsets: ["latin"], weight: ["400","500","600","700"] });
export async function generateMetadata(): Promise<Metadata> { const h = await headers(); const host = h.get("host") ?? "localhost:3000"; const protocol = host.includes("localhost") ? "http" : "https"; const image = `${protocol}://${host}/og.png`; return { title: "Aroma Studio | Aromas que despiertan emociones", description: "Aromatizantes ambientales premium y venta mayorista en Chile.", icons: { icon: "/favicon-logo.png" }, openGraph: { title: "Aroma Studio", description: "Aromas que despiertan emociones.", images: [{ url: image, width: 1792, height: 933 }] }, twitter: { card: "summary_large_image", images: [image] } }; }
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="es"><body className={`${display.variable} ${sans.variable}`}>{children}</body></html>; }
