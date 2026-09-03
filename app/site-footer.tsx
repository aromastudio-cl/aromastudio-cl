"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { FacebookIcon, InstagramIcon } from "./social-icons";
import { supabase } from "../lib/supabase-browser";

export default function SiteFooter() {
  const [contact,setContact]=useState({phone:"+56 9 9315 8300",whatsapp:"56993158300",instagram:"",facebook:"",tiktok:"",youtube:""});
  const [categories,setCategories]=useState<Array<{id:string;name:string;slug:string}>>([]);
  useEffect(()=>{
    supabase.from("site_settings").select("phone,whatsapp_number,instagram_url,facebook_url,tiktok_url,youtube_url").eq("id",1).maybeSingle().then(({data})=>{if(data)setContact({phone:data.phone||"",whatsapp:data.whatsapp_number||"",instagram:data.instagram_url||"",facebook:data.facebook_url||"",tiktok:data.tiktok_url||"",youtube:data.youtube_url||""})});
    supabase.from("categories").select("id,name,slug").eq("active",true).order("sort_order").then(({data})=>setCategories(data??[]));
  },[]);
  return <footer className="site-footer" id="contacto">
    <div className="footer-brand"><Link href="/" className="footer-logo"><Image src="/logo-hd.png" alt="Aroma Studio" width={118} height={102}/></Link><p>Aromatizantes que transforman espacios y crean experiencias memorables.</p><div className="footer-social">{contact.facebook&&<a href={contact.facebook} target="_blank" rel="noopener noreferrer" aria-label="Aroma Studio en Facebook"><FacebookIcon/></a>}{contact.instagram&&<a href={contact.instagram} target="_blank" rel="noopener noreferrer" aria-label="Aroma Studio en Instagram"><InstagramIcon/></a>}{contact.tiktok&&<a href={contact.tiktok} target="_blank" rel="noopener noreferrer" aria-label="Aroma Studio en TikTok"><b>TT</b></a>}{contact.youtube&&<a href={contact.youtube} target="_blank" rel="noopener noreferrer" aria-label="Aroma Studio en YouTube"><b>YT</b></a>}</div></div>
    <nav aria-label="Productos"><strong>PRODUCTOS</strong>{categories.map(category=><Link href={`/tienda?categoria=${encodeURIComponent(category.slug)}`} key={category.id}>{category.name}</Link>)}</nav>
    <nav aria-label="Información"><strong>INFORMACIÓN</strong><Link href="/contacto">Contacto</Link><Link href="/politicas/privacidad">Política de privacidad</Link><Link href="/politicas/terminos">Términos y condiciones</Link><Link href="/politicas/envios-devoluciones">Envíos y devoluciones</Link></nav>
    <div className="footer-contact"><strong>CONTÁCTANOS</strong>{contact.phone&&<a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer"><Phone aria-hidden="true"/>{contact.phone}</a>}<a href="mailto:hola@aromastudio.cl"><Mail aria-hidden="true"/>hola@aromastudio.cl</a><span><MapPin aria-hidden="true"/>Espacio Urbano Plaza Maipú</span><span><MapPin aria-hidden="true"/>Espacio Urbano Las Rejas</span></div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} Aroma Studio. Todos los derechos reservados.</span><span>Despachos a todo Chile · Compra segura</span></div>
  </footer>;
}
