import { notFound } from "next/navigation";
import SiteHeader from "../../site-header";
import SiteFooter from "../../site-footer";
import { createPublicSupabaseClient } from "../../../lib/supabase-server";
import "../policies.css";

const policies = {
  privacidad: { title: "privacy_title", content: "privacy_content", fallback: "Política de privacidad" },
  terminos: { title: "terms_title", content: "terms_content", fallback: "Términos y condiciones" },
  "envios-devoluciones": { title: "shipping_title", content: "shipping_content", fallback: "Envíos y devoluciones" },
} as const;

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = policies[slug as keyof typeof policies];
  if (!policy) notFound();
  const supabase = createPublicSupabaseClient();
  const { data } = await supabase.from("site_settings").select(`${policy.title},${policy.content},updated_at`).eq("id", 1).maybeSingle();
  const record = data as Record<string, string | null> | null;
  const title = record?.[policy.title] || policy.fallback;
  const content = record?.[policy.content] || "Contenido pendiente de publicación.";
  return <main><SiteHeader/><article className="policy-page"><span>INFORMACIÓN LEGAL</span><h1>{title}</h1>{record?.updated_at&&<small>Última actualización: {new Intl.DateTimeFormat("es-CL",{dateStyle:"long"}).format(new Date(record.updated_at))}</small>}<div>{content.split(/\n{2,}/).map((paragraph,index)=><p key={index}>{paragraph}</p>)}</div></article><SiteFooter/></main>;
}
