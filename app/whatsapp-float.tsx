"use client";

import { useEffect, useState } from "react";
import WhatsAppIcon from "./whatsapp-icon";
import { supabase } from "../lib/supabase-browser";

export default function WhatsAppFloat() {
  const [settings, setSettings] = useState({ number: "56993158300", enabled: true });
  useEffect(() => {
    supabase.from("site_settings").select("whatsapp_number,whatsapp_enabled").eq("id", 1).maybeSingle().then(({ data }) => {
      if (data) setSettings({ number: String(data.whatsapp_number || "").replace(/\D/g, ""), enabled: data.whatsapp_enabled !== false });
    });
  }, []);
  if (!settings.enabled || !settings.number) return null;
  const dynamicUrl = `https://wa.me/${settings.number}?text=Hola%20Aroma%20Studio%2C%20quisiera%20m%C3%A1s%20informaci%C3%B3n.`;
  return (
    <a
      className="whatsapp-float"
      href={dynamicUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar a Aroma Studio por WhatsApp"
      title="Escríbenos por WhatsApp"
    >
      <WhatsAppIcon />
    </a>
  );
}
