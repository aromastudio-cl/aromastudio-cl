"use client";

import Image from "next/image";
import { MapPin, MessageCircle, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";
import { supabase } from "../../lib/supabase-browser";
import "./contacto.css";

type ContactSettings = { phone:string; whatsapp_number:string; whatsapp_enabled:boolean; instagram_url:string; facebook_url:string; tiktok_url:string; youtube_url:string };
type Location = { id:string; name:string; address:string; image_url:string; active:boolean };

export default function ContactPage() {
  const [settings,setSettings]=useState<ContactSettings>({phone:"",whatsapp_number:"",whatsapp_enabled:false,instagram_url:"",facebook_url:"",tiktok_url:"",youtube_url:""});
  const [locations,setLocations]=useState<Location[]>([]);
  useEffect(()=>{
    supabase.from("site_settings").select("phone,whatsapp_number,whatsapp_enabled,instagram_url,facebook_url,tiktok_url,youtube_url").eq("id",1).maybeSingle().then(({data})=>{if(data)setSettings(data)});
    supabase.from("store_locations").select("id,name,address,image_url,active").eq("active",true).order("sort_order").then(({data})=>setLocations(data??[]));
  },[]);
  const whatsapp=settings.whatsapp_number.replace(/\D/g,"");
  const socials=[
    {name:"Instagram",href:settings.instagram_url,mark:"IG"},
    {name:"Facebook",href:settings.facebook_url,mark:"FB"},
    {name:"TikTok",href:settings.tiktok_url,mark:"TT"},
    {name:"YouTube",href:settings.youtube_url,mark:"YT"},
  ].filter(item=>item.href);

  return <main className="contact-page">
    <SiteHeader/>
    <section className="contact-hero"><span>ESTAMOS PARA AYUDARTE</span><h1>Hablemos</h1><p>Encuentra atención directa, nuestras redes y todos los puntos de venta de Aroma Studio.</p></section>
    <section className="contact-content">
      <div className="contact-direct">
        <header><span>CONTACTO DIRECTO</span><h2>¿Cómo podemos ayudarte?</h2></header>
        <div className="contact-methods">
          {settings.phone&&<a href={`tel:${settings.phone.replace(/\s/g,"")}`}><Phone/><small>TELÉFONO</small><strong>{settings.phone}</strong><span>Llamar ahora →</span></a>}
          {settings.whatsapp_enabled&&whatsapp&&<a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer"><MessageCircle/><small>WHATSAPP</small><strong>{settings.phone||`+${whatsapp}`}</strong><span>Iniciar conversación →</span></a>}
        </div>
        {socials.length>0&&<div className="contact-social"><p>SÍGUENOS</p>{socials.map(({name,href,mark})=><a href={href} target="_blank" rel="noopener noreferrer" key={name}><b>{mark}</b><span>{name}</span></a>)}</div>}
      </div>
      <div className="contact-note"><span>AROMA STUDIO</span><blockquote>“Queremos ayudarte a encontrar el aroma perfecto para cada espacio.”</blockquote><p>Escríbenos por nuestros canales oficiales o visítanos en una de nuestras sucursales.</p></div>
    </section>
    {locations.length>0&&<section className="contact-locations"><header><span>TIENDAS</span><h2>Visítanos</h2><p>Conoce nuestros puntos de venta y encuentra tus aromas favoritos.</p></header><div>{locations.map(location=><article key={location.id}>{location.image_url&&<figure><Image src={location.image_url} alt={location.name} fill sizes="(max-width: 700px) 100vw, 50vw" unoptimized/></figure>}<div><MapPin/><small>SUCURSAL</small><h3>{location.name}</h3><p>{location.address}</p><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`} target="_blank" rel="noopener noreferrer">CÓMO LLEGAR →</a></div></article>)}</div></section>}
    <SiteFooter/>
  </main>;
}
