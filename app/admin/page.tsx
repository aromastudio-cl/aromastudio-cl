"use client";
import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Check,
  ChevronDown,
  Download,
  LayoutDashboard,
  Package,
  MessageSquare,
  Pencil,
  ShoppingBag,
  Settings,
  Star,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { supabase } from "../../lib/supabase-browser";
import { compressProductImage } from "../../lib/compress-product-image";
import "../sale-prices.css";

type Product = {
  id: string | number;
  name: string;
  family: string;
  price: number;
  stock: number;
  active: boolean;
  featured?: boolean;
  image?: string;
};
type Category = { id: string; name: string; slug: string; active: boolean; sort_order: number; image_url: string | null; image_storage_path: string | null };
type Scent = {
  id: string;
  name: string;
  slug: string;
  notes: string | null;
  description: string | null;
  active: boolean;
  sort_order: number;
};
type AromaFamily = { slug: string; name: string; active: boolean; sort_order: number };
type EditableVariant = {
  id: string;
  name: string;
  sku: string;
  price_clp: number;
  sale_price_clp: number | null;
  stock: number;
  size_value: number | null;
  size_unit: string;
  scent_id: string;
  active: boolean;
};
type EditableImage = {
  id: string;
  variant_id: string | null;
  image_url: string;
  storage_path: string | null;
  is_primary: boolean;
};
type EditableProduct = {
  id: string;
  name: string;
  category_id: string | null;
  category_slug: string;
  description: string;
  scent_notes: string;
  aroma_family: string;
  sku: string;
  price_clp: number;
  stock: number;
  active: boolean;
  featured: boolean;
  variants: EditableVariant[];
  currentImages: EditableImage[];
};
type NewFormat = { size:number;price:number;salePrice:number|null;stock:number;images:File[];previews:string[];primaryIndex:number };
type ProductReview = {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  products: { name: string } | null;
  product_variants: { name: string } | null;
};
type CustomerProfile = { id:string; email:string; full_name:string; phone:string; created_at:string };
type Faq={id:string;question:string;answer:string;active:boolean;sort_order:number};
type SiteSettings={phone:string;whatsapp_number:string;whatsapp_enabled:boolean;instagram_url:string;facebook_url:string;tiktok_url:string;youtube_url:string;hero_desktop_url:string;hero_desktop_path:string;hero_mobile_url:string;hero_mobile_path:string;announcement_text:string;announcement_enabled:boolean;stores_eyebrow:string;stores_title:string;stores_content_eyebrow:string;stores_content_title:string;stores_content_text:string;stores_image_url:string;stores_image_path:string};
const DEFAULT_HERO_DESKTOP = "/hero-home-spray-aromastudio-v4.png";
const DEFAULT_HERO_MOBILE = "/hero-mobile-aromastudio-v2.png";
const DEFAULT_LOCATION_IMAGE = "/sobre-nosotros-aromastudio.png";
const skuDatePrefix = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `AR${year}${month}${day}`;
};

const getNextProductSku = async () => {
  const prefix = skuDatePrefix();
  const { data, error } = await supabase.from("products").select("sku").like("sku", `${prefix}%`);
  if (error) throw error;
  const lastSequence = (data ?? []).reduce((highest, item) => {
    const match = String(item.sku ?? "").match(new RegExp(`^${prefix}(\\d{3})$`));
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  if (lastSequence >= 999) throw new Error("Se alcanzó el máximo diario de SKUs.");
  return `${prefix}${String(lastSequence + 1).padStart(3, "0")}`;
};
const seed: Product[] = [
  {
    id: 1,
    name: "Mango",
    family: "Frutal",
    price: 6990,
    stock: 28,
    active: true,
  },
  {
    id: 2,
    name: "Bubble Gum",
    family: "Dulce",
    price: 6990,
    stock: 19,
    active: true,
  },
  {
    id: 3,
    name: "Verbena",
    family: "Floral",
    price: 6990,
    stock: 6,
    active: true,
  },
  {
    id: 4,
    name: "Cedrón, limón y menta",
    family: "Fresco",
    price: 6990,
    stock: 3,
    active: true,
  },
  {
    id: 5,
    name: "Red Velvet",
    family: "Dulce",
    price: 6990,
    stock: 0,
    active: false,
  },
];
const orders = [
  ["#AS-1048", "Camila Soto", "$20.970", "Pagado"],
  ["#AS-1047", "Martín Vera", "$13.980", "Preparando"],
  ["#AS-1046", "Daniela Rojas", "$27.960", "Enviado"],
  ["#AS-1045", "Javiera Díaz", "$34.950", "Entregado"],
];

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [tab, setTab] = useState("Bienvenida");
  const [products, setProducts] = useState(seed);
  const [scents, setScents] = useState<Scent[]>([]);
  const [aromaFamilies, setAromaFamilies] = useState<AromaFamily[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false);
  const [scentManagerOpen, setScentManagerOpen] = useState(false);
  const [aromaManagerOpen, setAromaManagerOpen] = useState(false);
  const [editingScentId, setEditingScentId] = useState<string | null>(null);
  const [editingAromaSlug, setEditingAromaSlug] = useState<string | null>(null);
  const scentFormRef = useRef<HTMLFormElement>(null);
  const [categoryImage, setCategoryImage] = useState<File | null>(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState("");
  const [modal, setModal] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState<number | null>(0);
  const [imageVariantId, setImageVariantId] = useState("");
  const [saving, setSaving] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<EditableProduct | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [customerEditorOpen, setCustomerEditorOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerProfile | null>(null);
  const [reviewFilter, setReviewFilter] = useState("pending");
  const [configSection, setConfigSection] = useState<"encabezado" | "portada" | "contacto" | "redes" | "preguntas" | "sucursales">("encabezado");
  const [newProductName, setNewProductName] = useState("");
  const [generatedSku, setGeneratedSku] = useState("");
  const [newFormats, setNewFormats] = useState<NewFormat[]>([{ size: 250, price: 6990, salePrice: null, stock: 12, images:[], previews:[], primaryIndex:0 }]);
  const [expandedVariantId, setExpandedVariantId] = useState<string | null>(null);
  const [locationImage, setLocationImage] = useState<File | null>(null);
  const [locationPreview, setLocationPreview] = useState(DEFAULT_LOCATION_IMAGE);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({ phone: "", whatsapp_number: "", whatsapp_enabled: true, instagram_url: "", facebook_url: "", tiktok_url: "", youtube_url: "", hero_desktop_url:"", hero_desktop_path:"", hero_mobile_url:"", hero_mobile_path:"", announcement_text:"ENVÍOS A TODO CHILE", announcement_enabled:true, stores_eyebrow:"TIENDAS OFICIALES", stores_title:"Visítanos en nuestras tiendas", stores_content_eyebrow:"AROMA STUDIO", stores_content_title:"Encuentra tu aroma favorito", stores_content_text:"Visita nuestros puntos de venta y descubre una selección de productos y aromas pensados para transformar tus espacios. Nuestro equipo estará disponible para orientarte.", stores_image_url:"", stores_image_path:"" });
  const [heroDesktopImage,setHeroDesktopImage]=useState<File|null>(null); const [heroDesktopPreview,setHeroDesktopPreview]=useState(DEFAULT_HERO_DESKTOP);
  const [heroMobileImage,setHeroMobileImage]=useState<File|null>(null); const [heroMobilePreview,setHeroMobilePreview]=useState(DEFAULT_HERO_MOBILE);
  const [faqs,setFaqs]=useState<Faq[]>([]); const [editingFaqId,setEditingFaqId]=useState<string|null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return setSession(null);
      const { data: refreshed } = await supabase.auth.refreshSession();
      setSession(refreshed.session ?? data.session);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) =>
      setSession(nextSession),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    fetch("/api/admin/customers",{headers:{Authorization:`Bearer ${session.access_token}`}}).then(async response=>{const body=await response.json();if(!response.ok)throw new Error(body.error);setCustomers(body.customers??[])}).catch(error=>setMessage(error instanceof Error?error.message:"No se pudieron cargar los clientes."));
    supabase
      .from("scents")
      .select("id,name,slug,notes,description,active,sort_order")
      .order("sort_order")
      .then(({ data }) => setScents(data ?? []));
    supabase.from("aroma_families").select("slug,name,active,sort_order").order("sort_order").then(({ data }) => setAromaFamilies(data ?? []));
    supabase
      .from("categories")
      .select("id,name,slug,active,sort_order,image_url,image_storage_path")
      .order("sort_order")
      .then(({ data }) => {
        setCategories(data ?? []);
      });
    supabase
      .from("products")
      .select(
        "id,name,price_clp,stock,active,featured,aroma_family,aroma_families(name),product_images(image_url,is_primary)",
      )
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!data) return;
        setProducts(
          data.map((product: any) => ({
            id: product.id,
            name: product.name,
            family: product.aroma_families?.name ?? "Sin aroma",
            price: product.price_clp,
            stock: product.stock,
            active: product.active,
            featured: product.featured ?? false,
            image:
              product.product_images?.find((item: any) => item.is_primary)
                ?.image_url ?? product.product_images?.[0]?.image_url,
          })),
        );
      });
    supabase
      .from("product_reviews")
      .select("id,reviewer_name,rating,comment,status,created_at,products(name),product_variants(name)")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setMessage("No se pudieron cargar los comentarios.");
        else setReviews((data ?? []) as unknown as ProductReview[]);
      });
    supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["new", "pending", "unmanaged", "nuevo", "pendiente"]).then(({ count, error }) => {
      if (!error) setPendingOrdersCount(count ?? 0);
    });
    supabase.from("site_settings").select("phone,whatsapp_number,whatsapp_enabled,instagram_url,facebook_url,tiktok_url,youtube_url,hero_desktop_url,hero_desktop_path,hero_mobile_url,hero_mobile_path,announcement_text,announcement_enabled,stores_eyebrow,stores_title,stores_content_eyebrow,stores_content_title,stores_content_text,stores_image_url,stores_image_path").eq("id",1).maybeSingle().then(({data})=>{if(data){setSiteSettings(data);setHeroDesktopPreview(data.hero_desktop_url||DEFAULT_HERO_DESKTOP);setHeroMobilePreview(data.hero_mobile_url||DEFAULT_HERO_MOBILE);setLocationPreview(data.stores_image_url||DEFAULT_LOCATION_IMAGE);}});
    supabase.from("faqs").select("*").order("sort_order").then(({data})=>setFaqs(data??[]));
  }, [session]);

  const saveCustomer=async(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();if(!session)return;setSaving(true);setMessage("");const form=event.currentTarget;const data=new FormData(form);try{const response=await fetch("/api/admin/customers",{method:editingCustomer?"PATCH":"POST",headers:{Authorization:`Bearer ${session.access_token}`,"Content-Type":"application/json"},body:JSON.stringify({id:editingCustomer?.id,full_name:data.get("full_name"),email:data.get("email"),phone:data.get("phone"),password:data.get("password")})});const body=await response.json();if(!response.ok)throw new Error(body.error||"No fue posible guardar el cliente.");setCustomers(items=>editingCustomer?items.map(item=>item.id===editingCustomer.id?body.customer:item):[body.customer,...items]);setCustomerEditorOpen(false);setEditingCustomer(null);form.reset();setMessage(editingCustomer?"Cliente actualizado correctamente.":"Cliente creado correctamente. Ya puede iniciar sesión.");}catch(error:unknown){setMessage(error instanceof Error?error.message:"No fue posible guardar el cliente.");}finally{setSaving(false)}};
  const deleteCustomer=async(customer:CustomerProfile)=>{if(!session||!window.confirm(`¿Eliminar definitivamente a “${customer.full_name||customer.email}”? Esta acción eliminará su acceso.`))return;setSaving(true);setMessage("");try{const response=await fetch(`/api/admin/customers?id=${encodeURIComponent(customer.id)}`,{method:"DELETE",headers:{Authorization:`Bearer ${session.access_token}`}});const body=await response.json();if(!response.ok)throw new Error(body.error||"No fue posible eliminar el cliente.");setCustomers(items=>items.filter(item=>item.id!==customer.id));setMessage("Cliente eliminado correctamente.");}catch(error:unknown){setMessage(error instanceof Error?error.message:"No fue posible eliminar el cliente.");}finally{setSaving(false)}};

  const selectHeroImage=async(event:ChangeEvent<HTMLInputElement>,device:"desktop"|"mobile")=>{const file=event.target.files?.[0];if(!file)return;setCompressing(true);try{const compressed=await compressProductImage(file);const preview=URL.createObjectURL(compressed);if(device==="desktop"){if(heroDesktopPreview.startsWith("blob:"))URL.revokeObjectURL(heroDesktopPreview);setHeroDesktopImage(compressed);setHeroDesktopPreview(preview)}else{if(heroMobilePreview.startsWith("blob:"))URL.revokeObjectURL(heroMobilePreview);setHeroMobileImage(compressed);setHeroMobilePreview(preview)}}catch(error:unknown){setMessage(error instanceof Error?error.message:"No fue posible procesar la imagen.")}finally{setCompressing(false)}};
  const downloadImage=async(event:React.MouseEvent<HTMLButtonElement>,url:string,name:string)=>{event.preventDefault();event.stopPropagation();try{const response=await fetch(url);if(!response.ok)throw new Error("No se pudo descargar la imagen.");const blob=await response.blob();const extension=blob.type.includes("png")?"png":blob.type.includes("jpeg")?"jpg":"webp";const objectUrl=URL.createObjectURL(blob);const anchor=document.createElement("a");anchor.href=objectUrl;anchor.download=`${name}.${extension}`;document.body.appendChild(anchor);anchor.click();anchor.remove();URL.revokeObjectURL(objectUrl)}catch(error:unknown){setMessage(error instanceof Error?error.message:"No fue posible descargar la imagen.")}};
  const saveSiteSettings = async (event:FormEvent<HTMLFormElement>) => {
    event.preventDefault();setSaving(true);setMessage("");const data=new FormData(event.currentTarget);const uploaded:string[]=[];
    try{let hero_desktop_url=siteSettings.hero_desktop_url,hero_desktop_path=siteSettings.hero_desktop_path,hero_mobile_url=siteSettings.hero_mobile_url,hero_mobile_path=siteSettings.hero_mobile_path;
      if(heroDesktopImage){const path=`site/hero-desktop-${Date.now()}.webp`;const up=await supabase.storage.from("product-images").upload(path,heroDesktopImage,{cacheControl:"3600",contentType:"image/webp",upsert:false});if(up.error)throw up.error;uploaded.push(path);hero_desktop_path=path;hero_desktop_url=supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl}
      if(heroMobileImage){const path=`site/hero-mobile-${Date.now()}.webp`;const up=await supabase.storage.from("product-images").upload(path,heroMobileImage,{cacheControl:"3600",contentType:"image/webp",upsert:false});if(up.error)throw up.error;uploaded.push(path);hero_mobile_path=path;hero_mobile_url=supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl}
      const values={...siteSettings,phone:siteSettings.phone.trim(),whatsapp_number:siteSettings.whatsapp_number.replace(/\D/g,""),instagram_url:siteSettings.instagram_url.trim(),facebook_url:siteSettings.facebook_url.trim(),tiktok_url:siteSettings.tiktok_url.trim(),youtube_url:siteSettings.youtube_url.trim(),hero_desktop_url,hero_desktop_path,hero_mobile_url,hero_mobile_path,announcement_text:siteSettings.announcement_text.trim()};
      const {error}=await supabase.from("site_settings").upsert({id:1,...values,updated_at:new Date().toISOString()});if(error)throw error;
      const oldPaths=[heroDesktopImage?siteSettings.hero_desktop_path:"",heroMobileImage?siteSettings.hero_mobile_path:""].filter(Boolean);if(oldPaths.length)await supabase.storage.from("product-images").remove(oldPaths);
      setSiteSettings(values);setHeroDesktopImage(null);setHeroMobileImage(null);setHeroDesktopPreview(hero_desktop_url||DEFAULT_HERO_DESKTOP);setHeroMobilePreview(hero_mobile_url||DEFAULT_HERO_MOBILE);setMessage("Configuración y fotografías del hero guardadas.");
    }catch(error:unknown){if(uploaded.length)await supabase.storage.from("product-images").remove(uploaded);setMessage(error instanceof Error?error.message:"No fue posible guardar la configuración.")}finally{setSaving(false)};
  };
  const saveFaq=async(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();setSaving(true);const data=new FormData(event.currentTarget);const payload={question:String(data.get("question")).trim(),answer:String(data.get("answer")).trim(),sort_order:Number(data.get("sort_order")||0),active:data.get("active")==="on",updated_at:new Date().toISOString()};const result=editingFaqId?await supabase.from("faqs").update(payload).eq("id",editingFaqId):await supabase.from("faqs").insert(payload);if(result.error)setMessage(result.error.message);else{const refreshed=await supabase.from("faqs").select("*").order("sort_order");setFaqs(refreshed.data??[]);setEditingFaqId(null);(event.currentTarget as HTMLFormElement).reset();setMessage("Pregunta guardada correctamente.");}setSaving(false)};
  const deleteFaq=async(id:string)=>{if(!window.confirm("¿Eliminar esta pregunta frecuente?"))return;setSaving(true);const {error}=await supabase.from("faqs").delete().eq("id",id);if(error)setMessage(error.message);else{setFaqs(items=>items.filter(x=>x.id!==id));setMessage("Pregunta eliminada.");}setSaving(false)};

  const selectLocationImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file=event.target.files?.[0]; if(!file)return;
    setCompressing(true);
    try { const compressed=await compressProductImage(file); if(locationPreview.startsWith("blob:"))URL.revokeObjectURL(locationPreview); setLocationImage(compressed); setLocationPreview(URL.createObjectURL(compressed)); }
    catch(error:unknown){setMessage(error instanceof Error?error.message:"No fue posible procesar la foto.");}
    finally{setCompressing(false);}
  };

  const saveStoreSection = async (event:FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setMessage(""); let uploadedPath="";
    try {
      let stores_image_url=siteSettings.stores_image_url;
      let stores_image_path=siteSettings.stores_image_path;
      if(locationImage){uploadedPath=`site/stores-${Date.now()}.webp`;const up=await supabase.storage.from("product-images").upload(uploadedPath,locationImage,{cacheControl:"3600",contentType:"image/webp",upsert:false});if(up.error)throw up.error;stores_image_url=supabase.storage.from("product-images").getPublicUrl(uploadedPath).data.publicUrl;stores_image_path=uploadedPath;}
      const values={...siteSettings,stores_eyebrow:siteSettings.stores_eyebrow.trim(),stores_title:siteSettings.stores_title.trim(),stores_content_eyebrow:siteSettings.stores_content_eyebrow.trim(),stores_content_title:siteSettings.stores_content_title.trim(),stores_content_text:siteSettings.stores_content_text.trim(),stores_image_url,stores_image_path};
      const {error}=await supabase.from("site_settings").upsert({id:1,...values,updated_at:new Date().toISOString()});if(error)throw error;
      if(locationImage&&siteSettings.stores_image_path)await supabase.storage.from("product-images").remove([siteSettings.stores_image_path]);
      setSiteSettings(values);setLocationImage(null);setLocationPreview(stores_image_url||DEFAULT_LOCATION_IMAGE);setMessage("Sección de tiendas guardada correctamente.");
    } catch(error:unknown){if(uploadedPath)await supabase.storage.from("product-images").remove([uploadedPath]);setMessage(error instanceof Error?error.message:"No fue posible guardar la sección.");} finally{setSaving(false);}
  };

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    const data = new FormData(event.currentTarget);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(data.get("email")),
      password: String(data.get("password")),
    });
    if (error) setMessage("No fue posible iniciar sesión. Revisa tus datos.");
  };

  const moderateReview = async (review: ProductReview, status: "approved" | "rejected") => {
    if (!session) return;
    setSaving(true);
    setMessage("");
    const { error } = await supabase.from("product_reviews").update({ status, reviewed_at: new Date().toISOString(), reviewed_by: session.user.id }).eq("id", review.id);
    if (error) setMessage("No fue posible actualizar el comentario. Vuelve a iniciar sesión si el problema continúa.");
    else {
      setReviews((items) => items.map((item) => item.id === review.id ? { ...item, status } : item));
      setMessage(status === "approved" ? "Comentario aprobado y publicado." : "Comentario rechazado.");
    }
    setSaving(false);
  };

  const selectImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    if (!selected.length) return;
    const currentVariantImages = editing?.currentImages.filter(image => image.variant_id === imageVariantId).length ?? 0;
    const availableSlots = 5 - currentVariantImages;
    if (selected.length > availableSlots) {
      setMessage(`Este formato permite hasta 5 fotografías. Quedan ${Math.max(availableSlots, 0)} espacios disponibles.`);
      event.target.value = "";
      return;
    }
    setCompressing(true);
    setMessage("");
    try {
      const files = await Promise.all(
        selected.map((file) => compressProductImage(file)),
      );
      previews.forEach(URL.revokeObjectURL);
      setImages(files);
      setPreviews(files.map((file) => URL.createObjectURL(file)));
      setPrimaryImageIndex(editing?.currentImages.some((image) => image.variant_id === imageVariantId && image.is_primary) ? null : 0);
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "No fue posible procesar la imagen.");
    } finally {
      setCompressing(false);
    }
  };

  const toggleEditVariant = (variantId: string) => {
    if (expandedVariantId === variantId) {
      setExpandedVariantId(null);
      return;
    }
    if (imageVariantId !== variantId) {
      previews.forEach(URL.revokeObjectURL);
      setImages([]);
      setPreviews([]);
      setPrimaryImageIndex(null);
      setImageVariantId(variantId);
    }
    setExpandedVariantId(variantId);
  };

  const selectNewFormatImages = async (event:ChangeEvent<HTMLInputElement>, formatIndex:number) => {
    const selected=Array.from(event.target.files??[]);
    if(!selected.length)return;
    if(selected.length>5){setMessage("Cada formato permite un máximo de 5 fotografías.");event.target.value="";return;}
    setCompressing(true);setMessage("");
    try{const compressed=await Promise.all(selected.map(file=>compressProductImage(file)));setNewFormats(items=>items.map((item,index)=>{if(index!==formatIndex)return item;item.previews.forEach(URL.revokeObjectURL);return{...item,images:compressed,previews:compressed.map(file=>URL.createObjectURL(file)),primaryIndex:0}}));}
    catch(error:unknown){setMessage(error instanceof Error?error.message:"No fue posible procesar las fotografías.");}
    finally{setCompressing(false);}
  };

  const removeNewFormatImage=(formatIndex:number,imageIndex:number)=>setNewFormats(items=>items.map((item,index)=>{if(index!==formatIndex)return item;URL.revokeObjectURL(item.previews[imageIndex]);const nextImages=item.images.filter((_,i)=>i!==imageIndex);const nextPreviews=item.previews.filter((_,i)=>i!==imageIndex);return{...item,images:nextImages,previews:nextPreviews,primaryIndex:item.primaryIndex===imageIndex?0:item.primaryIndex>imageIndex?item.primaryIndex-1:item.primaryIndex}}));

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setImages((items) => items.filter((_, itemIndex) => itemIndex !== index));
    setPreviews((items) => items.filter((_, itemIndex) => itemIndex !== index));
    setPrimaryImageIndex((current) => {
      if (current === null) return null;
      if (current === index) return images.length > 1 ? 0 : null;
      return current > index ? current - 1 : current;
    });
  };

  const selectCurrentPrimaryImage = (imageId: string) => {
    if (!editing) return;
    setEditing({
      ...editing,
      currentImages: editing.currentImages.map((image) => ({
        ...image,
        is_primary: image.variant_id === editing.currentImages.find(item=>item.id===imageId)?.variant_id ? image.id === imageId : image.is_primary,
      })),
    });
    setPrimaryImageIndex(null);
  };

  const selectNewPrimaryImage = (index: number) => {
    setPrimaryImageIndex(index);
    if (editing) {
      setEditing({
        ...editing,
        currentImages: editing.currentImages.map((image) => ({ ...image, is_primary: image.variant_id === imageVariantId ? false : image.is_primary })),
      });
    }
  };

  const slugify = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const selectCategoryImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    setMessage("");
    try {
      const compressed = await compressProductImage(file);
      if (categoryImagePreview.startsWith("blob:")) URL.revokeObjectURL(categoryImagePreview);
      setCategoryImage(compressed);
      setCategoryImagePreview(URL.createObjectURL(compressed));
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "No fue posible procesar la imagen de la categoría.");
    } finally {
      setCompressing(false);
    }
  };

  const saveCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (compressing) return;
    setSaving(true);
    setMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const currentCategory = categories.find((item) => item.id === editingCategoryId);
    const payload = {
      name: String(data.get("name")).trim(),
      slug: slugify(String(data.get("slug") || data.get("name"))),
      active: data.get("active") === "on",
      sort_order: Number(data.get("sort_order") || 0),
      updated_at: new Date().toISOString(),
    };
    let uploadedPath = "";
    try {
      if (!editingCategoryId && !categoryImage) throw new Error("Selecciona una imagen para la categoría.");
      let imageValues = currentCategory
        ? { image_url: currentCategory.image_url, image_storage_path: currentCategory.image_storage_path }
        : { image_url: null as string | null, image_storage_path: null as string | null };
      if (categoryImage) {
        const extension = categoryImage.name.split(".").pop()?.toLowerCase() || "webp";
        uploadedPath = `categories/${payload.slug}-${Date.now()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(uploadedPath, categoryImage, { cacheControl: "3600", contentType: "image/webp", upsert: false });
        if (uploadError) throw uploadError;
        const { data: publicFile } = supabase.storage.from("product-images").getPublicUrl(uploadedPath);
        imageValues = { image_url: publicFile.publicUrl, image_storage_path: uploadedPath };
      }
      const result = editingCategoryId
        ? await supabase.from("categories").update({ ...payload, ...imageValues }).eq("id", editingCategoryId)
        : await supabase.from("categories").insert({ ...payload, ...imageValues });
      if (result.error) throw result.error;
      if (categoryImage && currentCategory?.image_storage_path) {
        await supabase.storage.from("product-images").remove([currentCategory.image_storage_path]);
      }
      const { data: refreshed } = await supabase
        .from("categories")
        .select("id,name,slug,active,sort_order,image_url,image_storage_path")
        .order("sort_order");
      setCategories(refreshed ?? []);
      setEditingCategoryId(null);
      setCategoryEditorOpen(false);
      setCategoryImage(null);
      if (categoryImagePreview.startsWith("blob:")) URL.revokeObjectURL(categoryImagePreview);
      setCategoryImagePreview("");
      form.reset();
      setMessage("Categoría guardada correctamente.");
    } catch (error: unknown) {
      if (uploadedPath) await supabase.storage.from("product-images").remove([uploadedPath]);
      setMessage(error instanceof Error ? error.message : typeof error === "object" && error && "message" in error ? String(error.message) : "No fue posible guardar la categoría.");
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (category: Category) => {
    if (!window.confirm(`¿Eliminar la categoría “${category.name}”?`)) return;
    setSaving(true);
    setMessage("");
    try {
      const { count, error: usageError } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("category_id", category.id);
      if (usageError) throw usageError;
      if (count) throw new Error("No se puede eliminar esta categoría porque contiene productos.");
      const { error } = await supabase.from("categories").delete().eq("id", category.id);
      if (error) throw error;
      if (category.image_storage_path) await supabase.storage.from("product-images").remove([category.image_storage_path]);
      setCategories(items => items.filter(item => item.id !== category.id));
      setMessage("Categoría eliminada correctamente.");
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : typeof error === "object" && error && "message" in error ? String(error.message) : "No fue posible eliminar la categoría.");
    } finally { setSaving(false); }
  };

  const refreshScents = async () => {
    const { data, error } = await supabase
      .from("scents")
      .select("id,name,slug,notes,description,active,sort_order")
      .order("sort_order");
    if (error) throw error;
    setScents(data ?? []);
  };

  const saveScent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const payload = {
      name,
      slug: slugify(String(data.get("slug") || name)),
      notes: String(data.get("notes") || "").trim() || null,
      description: String(data.get("description") || "").trim() || null,
      active: data.get("active") === "on",
      sort_order: Number(data.get("sort_order") || 0),
      updated_at: new Date().toISOString(),
    };
    try {
      if (!payload.slug) throw new Error("Escribe un nombre válido para la fragancia.");
      const isEditingScent = Boolean(editingScentId);
      const result = editingScentId
        ? await supabase.from("scents").update(payload).eq("id", editingScentId)
        : await supabase.from("scents").insert(payload);
      if (result.error) throw result.error;
      await refreshScents();
      setEditingScentId(null);
      form.reset();
      setMessage(isEditingScent ? "Fragancia actualizada correctamente." : "Fragancia creada correctamente.");
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "No fue posible guardar la fragancia.");
    } finally {
      setSaving(false);
    }
  };

  const openScentEdit = (scentId: string) => {
    setEditingScentId(scentId);
    window.requestAnimationFrame(() => scentFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const refreshAromaFamilies = async () => {
    const { data, error } = await supabase.from("aroma_families").select("slug,name,active,sort_order").order("sort_order");
    if (error) throw error;
    setAromaFamilies(data ?? []);
  };

  const saveAromaFamily = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setMessage("");
    const form = event.currentTarget; const data = new FormData(form);
    const name = String(data.get("name") || "").trim(); const slug = slugify(name);
    try {
      if (!slug) throw new Error("Escribe un nombre válido para el aroma.");
      const payload = { slug, name, active: data.get("active") === "on", sort_order: Number(data.get("sort_order") || 0), updated_at: new Date().toISOString() };
      const result = editingAromaSlug
        ? await supabase.from("aroma_families").update(payload).eq("slug", editingAromaSlug)
        : await supabase.from("aroma_families").insert(payload);
      if (result.error) throw result.error;
      await refreshAromaFamilies(); setEditingAromaSlug(null); form.reset();
      setMessage(editingAromaSlug ? "Aroma actualizado correctamente." : "Aroma creado correctamente.");
    } catch (error: unknown) { setMessage(error instanceof Error ? error.message : "No fue posible guardar el aroma."); }
    finally { setSaving(false); }
  };

  const deleteAromaFamily = async (family: AromaFamily) => {
    if (!window.confirm(`¿Eliminar el aroma “${family.name}”?`)) return;
    setSaving(true); setMessage("");
    try {
      const { count, error: usageError } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("aroma_family", family.slug);
      if (usageError) throw usageError;
      if (count) throw new Error("No se puede eliminar porque está asociado a uno o más productos.");
      const { error } = await supabase.from("aroma_families").delete().eq("slug", family.slug);
      if (error) throw error;
      await refreshAromaFamilies(); if (editingAromaSlug === family.slug) setEditingAromaSlug(null);
      setMessage("Aroma eliminado correctamente.");
    } catch (error: unknown) { setMessage(error instanceof Error ? error.message : "No fue posible eliminar el aroma."); }
    finally { setSaving(false); }
  };

  const deleteScent = async (scent: Scent) => {
    if (!window.confirm(`¿Eliminar la fragancia “${scent.name}”?`)) return;
    setSaving(true);
    setMessage("");
    try {
      const { count, error: usageError } = await supabase
        .from("product_variants")
        .select("id", { count: "exact", head: true })
        .eq("scent_id", scent.id);
      if (usageError) throw usageError;
      if (count) throw new Error("No se puede eliminar porque está asociada a uno o más productos.");
      const { error } = await supabase.from("scents").delete().eq("id", scent.id);
      if (error) throw error;
      await refreshScents();
      if (editingScentId === scent.id) setEditingScentId(null);
      setMessage("Fragancia eliminada correctamente.");
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "No fue posible eliminar la fragancia.");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = async (productId: string | number) => {
    setLoadingEdit(true);
    setMessage("");
    const { data, error } = await supabase
      .from("products")
      .select(
        "id,name,category_id,description,scent_notes,aroma_family,sku,price_clp,stock,active,featured,categories(slug),product_variants(id,name,sku,price_clp,sale_price_clp,stock,size_value,size_unit,scent_id,active,is_default,sort_order),product_images(id,variant_id,image_url,storage_path,is_primary,sort_order)",
      )
      .eq("id", productId)
      .single();
    setLoadingEdit(false);
    if (error || !data) {
      setMessage(error?.message || "No fue posible cargar el producto.");
      return;
    }
    const item: any = data;
    let productSku = String(item.sku ?? "");
    if (!/^AR\d{11}$/.test(productSku)) {
      try {
        productSku = await getNextProductSku();
      } catch (skuError: unknown) {
        setMessage(skuError instanceof Error ? skuError.message : "No fue posible generar el SKU.");
        return;
      }
    }
    setEditing({
      id: item.id,
      name: item.name ?? "",
      category_id: item.category_id,
      category_slug: item.categories?.slug ?? "home-spray",
      description: item.description ?? "",
      scent_notes: item.scent_notes ?? "",
      aroma_family: item.aroma_family ?? "",
      sku: productSku,
      price_clp: item.price_clp ?? 0,
      stock: item.stock ?? 0,
      active: item.active ?? true,
      featured: item.featured ?? false,
      variants: (item.product_variants ?? [])
        .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((variant: any) => ({
          id: variant.id,
          name: variant.name ?? "",
          sku: variant.sku ?? "",
          price_clp: variant.price_clp ?? 0,
          sale_price_clp: variant.sale_price_clp ?? null,
          stock: variant.stock ?? 0,
          size_value: variant.size_value,
          size_unit: variant.size_unit ?? "unidad",
          scent_id: variant.scent_id ?? "",
          active: variant.active ?? true,
        })),
      currentImages: (item.product_images ?? []).sort(
        (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
      ),
    });
    setImageVariantId((item.product_variants ?? []).sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]?.id ?? "");
  };

  const changeVariant = (
    index: number,
    field: keyof EditableVariant,
    value: string | number | boolean | null,
  ) => {
    setEditing((current) => {
      if (!current) return current;
      const variants = [...current.variants];
      variants[index] = { ...variants[index], [field]: value };
      return { ...current, variants };
    });
  };

  const changeProductScent = (scentId: string) => {
    setEditing((current) => current ? { ...current, variants: current.variants.map((variant) => ({ ...variant, scent_id: scentId })) } : current);
  };

  const removeCurrentImage = async (image: EditableImage) => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase
      .from("product_images")
      .delete()
      .eq("id", image.id);
    if (!error && image.storage_path) {
      await supabase.storage.from("product-images").remove([image.storage_path]);
    }
    setSaving(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    const remainingImages = editing.currentImages.filter((item) => item.id !== image.id);
    if (image.is_primary && primaryImageIndex === null && remainingImages.length) {
      remainingImages[0] = { ...remainingImages[0], is_primary: true };
    }
    if (image.is_primary && !remainingImages.length && images.length) {
      setPrimaryImageIndex(0);
    }
    setEditing({ ...editing, currentImages: remainingImages });
  };

  const deleteProduct = async () => {
    if (!pendingDelete) return;
    const product = pendingDelete;
    setSaving(true);
    setMessage("");
    try {
      const { data: productImages, error: imagesError } = await supabase
        .from("product_images")
        .select("storage_path")
        .eq("product_id", product.id);
      if (imagesError) throw imagesError;

      const { data: storedFiles, error: listError } = await supabase.storage
        .from("product-images")
        .list(String(product.id), { limit: 1000 });
      if (listError) throw listError;

      const { data: deletedProduct, error: productError } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id)
        .select("id")
        .single();
      if (productError) throw productError;
      if (!deletedProduct) throw new Error("Supabase no confirmó la eliminación.");

      const storagePaths = Array.from(
        new Set([
          ...(productImages ?? [])
            .map((image) => image.storage_path)
            .filter((storagePath): storagePath is string => Boolean(storagePath)),
          ...(storedFiles ?? []).map(
            (file) => `${String(product.id)}/${file.name}`,
          ),
        ]),
      );
      let storageWarning = "";
      if (storagePaths.length) {
        const { error: storageError } = await supabase.storage
          .from("product-images")
          .remove(storagePaths);
        if (storageError) storageWarning = ` ${storageError.message}`;
      }

      setProducts((items) =>
        items.filter((item) => String(item.id) !== String(product.id)),
      );
      setPendingDelete(null);
      setMessage(
        storageWarning
          ? `Producto eliminado de la base de datos. Revisa sus archivos:${storageWarning}`
          : `“${product.name}” y sus fotografías fueron eliminados.`,
      );
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No fue posible eliminar el producto.",
      );
    } finally {
      setSaving(false);
    }
  };

  const updateProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing || compressing) return;
    setSaving(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    const updatedName = String(data.get("name"));
    const updatedSlug = slugify(updatedName);
    const updatedSku = editing.sku;
    try {
      if (!updatedSlug || !updatedSku) {
        throw new Error("El nombre debe incluir al menos una letra o un número.");
      }
      if (editing.currentImages.filter(image=>image.variant_id===imageVariantId).length + images.length > 5) {
        throw new Error("Cada formato puede tener un máximo de 5 fotografías.");
      }
      if (editing.variants.some(variant => variant.price_clp < 0 || (variant.sale_price_clp !== null && (variant.sale_price_clp < 0 || variant.sale_price_clp >= variant.price_clp)))) {
        throw new Error("El precio de oferta debe ser menor que el precio normal de cada formato.");
      }
      const { data: category, error: categoryError } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", String(data.get("category")))
        .single();
      if (categoryError) throw categoryError;
      const totalStock = editing.variants.reduce(
        (sum, variant) => sum + Number(variant.stock || 0),
        0,
      );
      const defaultVariant = editing.variants[0];
      const scentId = defaultVariant?.scent_id;
      const selectedScent = scents.find((scent) => scent.id === scentId);
      const aromaFamily = String(data.get("aroma_family") || "");
      if (!selectedScent) throw new Error("Selecciona una fragancia válida para el producto.");
      if (!aromaFamilies.some((family) => family.slug === aromaFamily)) throw new Error("Selecciona un aroma válido.");
      const { error: productError } = await supabase
        .from("products")
        .update({
          category_id: category.id,
          name: updatedName,
          slug: updatedSlug,
          description: String(data.get("description") || ""),
          scent_notes: String(data.get("scent_notes") || "").trim(),
          aroma_family: aromaFamily,
          sku: updatedSku,
          price_clp: defaultVariant?.price_clp ?? editing.price_clp,
          stock: totalStock,
          active: data.get("active") === "on",
          featured: data.get("featured") === "on",
          updated_at: new Date().toISOString(),
        })
        .eq("id", editing.id);
      if (productError) throw productError;

      const savedVariantIds = new Map<string, string>();
      for (let index = 0; index < editing.variants.length; index++) {
        const variant = editing.variants[index];
        const variantPayload = {
            name: `${variant.size_value} ml`,
            sku: `${editing.sku}${String(index + 1).padStart(2, "0")}`,
            price_clp: Number(variant.price_clp),
            sale_price_clp: variant.sale_price_clp === null ? null : Number(variant.sale_price_clp),
            stock: Number(variant.stock),
            size_value: variant.size_value || null,
            size_unit: variant.size_unit,
            scent_id: variant.scent_id || null,
            active: variant.active,
            is_default: index === 0,
            sort_order: index + 1,
          };
        const result = variant.id.startsWith("new-")
          ? await supabase.from("product_variants").insert({ ...variantPayload, product_id: editing.id }).select("id").single()
          : await supabase.from("product_variants").update(variantPayload).eq("id", variant.id).select("id").single();
        const { data: savedVariant, error: variantError } = result;
        if (variantError) throw variantError;
        savedVariantIds.set(variant.id, savedVariant.id);
      }

      for (let index = 0; index < editing.currentImages.length; index++) {
        const currentImage = editing.currentImages[index];
        const { error: currentImageError } = await supabase
          .from("product_images")
          .update({ is_primary: currentImage.is_primary, sort_order: index + 1 })
          .eq("id", currentImage.id);
        if (currentImageError) throw currentImageError;
      }

      const newImageRows: Array<{
        product_id: string;
        variant_id: string | null;
        image_url: string;
        storage_path: string;
        alt_text: string;
        sort_order: number;
        is_primary: boolean;
        active: boolean;
      }> = [];
      for (let index = 0; index < images.length; index++) {
        const file = images[index];
        const extension = file.name.split(".").pop()?.toLowerCase() || "webp";
        const path = `${editing.id}/${Date.now()}-${index}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(path, file, { cacheControl: "3600", contentType: "image/webp", upsert: false });
        if (uploadError) throw uploadError;
        const { data: publicFile } = supabase.storage
          .from("product-images")
          .getPublicUrl(path);
        newImageRows.push({
          product_id: editing.id,
          variant_id: (savedVariantIds.get(imageVariantId) ?? imageVariantId) || null,
          image_url: publicFile.publicUrl,
          storage_path: path,
          alt_text: `${String(data.get("name"))} de Aroma Studio`,
          sort_order: editing.currentImages.filter(image=>image.variant_id===imageVariantId).length + index + 1,
          is_primary: primaryImageIndex === index,
          active: true,
        });
      }
      if (newImageRows.length) {
        const { error: imageError } = await supabase
          .from("product_images")
          .insert(newImageRows);
        if (imageError) throw imageError;
      }
      setProducts((items) =>
        items.map((item) =>
          String(item.id) === editing.id
            ? {
                ...item,
                name: String(data.get("name")),
                family: aromaFamilies.find((family) => family.slug === aromaFamily)?.name ?? aromaFamily,
                price: defaultVariant?.price_clp ?? editing.price_clp,
                stock: totalStock,
                active: data.get("active") === "on",
                featured: data.get("featured") === "on",
                image:
                  editing.currentImages.find((image) => image.is_primary)?.image_url ??
                  newImageRows.find((image) => image.is_primary)?.image_url ??
                  editing.currentImages[0]?.image_url ?? newImageRows[0]?.image_url,
              }
            : item,
        ),
      );
      previews.forEach(URL.revokeObjectURL);
      setImages([]);
      setPreviews([]);
      setPrimaryImageIndex(0);
      setEditing(null);
      setMessage("Producto actualizado correctamente.");
    } catch (error: any) {
      setMessage(error?.message || "No fue posible actualizar el producto.");
    } finally {
      setSaving(false);
    }
  };

  const toggleFeaturedProduct = async (product: Product) => {
    setSaving(true);
    setMessage("");
    const nextFeatured = !product.featured;
    const { error } = await supabase.from("products").update({ featured: nextFeatured, updated_at: new Date().toISOString() }).eq("id", product.id);
    if (error) setMessage(error.message || "No fue posible actualizar el producto destacado.");
    else {
      setProducts(items => items.map(item => String(item.id) === String(product.id) ? { ...item, featured: nextFeatured } : item));
      setMessage(nextFeatured ? `“${product.name}” ahora aparece como destacado.` : `“${product.name}” dejó de estar destacado.`);
    }
    setSaving(false);
  };

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (compressing) {
      setMessage("Espera mientras terminamos de optimizar las fotografías.");
      return;
    }
    if (newFormats.some(format=>!format.images.length)) {
      setMessage("Selecciona al menos una fotografía para cada formato.");
      return;
    }
    setSaving(true);
    setMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name"));
    const productSlug = slugify(name);
    const scentId = String(data.get("scent_id"));
    const aromaFamily = String(data.get("aroma_family") || "");
    try {
      if (!productSlug) {
        throw new Error("El nombre debe incluir al menos una letra o un número.");
      }
      if (!newFormats.length || newFormats.some(format => !Number.isFinite(format.size) || format.size <= 0 || format.price < 0 || format.stock < 0 || (format.salePrice !== null && (format.salePrice < 0 || format.salePrice >= format.price)))) {
        throw new Error("Completa correctamente todos los formatos en ml, sus precios y stock.");
      }
      if (new Set(newFormats.map(format => format.size)).size !== newFormats.length) {
        throw new Error("No puedes repetir un formato en ml.");
      }
      const price = newFormats[0].price;
      const stock = newFormats.reduce((total, format) => total + format.stock, 0);
      const sku = await getNextProductSku();
      setGeneratedSku(sku);
      const { data: category } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", String(data.get("category")))
        .single();
      const scent = scents.find((item) => item.id === scentId);
      if (!category || !scent) throw new Error("Selecciona una categoría y fragancia válidas.");
      if (!aromaFamilies.some((family) => family.slug === aromaFamily && family.active)) throw new Error("Selecciona un aroma activo válido.");
      const { data: duplicate } = await supabase
        .from("product_variants")
        .select("id,products!inner(category_id)")
        .eq("scent_id", scentId)
        .eq("products.category_id", category.id)
        .limit(1);
      if (duplicate?.length) throw new Error("Esta categoría ya tiene un producto para la fragancia seleccionada.");
      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          category_id: category?.id ?? null,
          name,
          slug: productSlug,
          description: String(data.get("description") || ""),
          scent_notes: String(data.get("scent_notes") || "").trim(),
          aroma_family: aromaFamily,
          sku,
          price_clp: price,
          stock,
          active: true,
          featured: data.get("featured") === "on",
        })
        .select("id")
        .single();
      if (productError) throw productError;

      const { data: createdVariants, error: variantError } = await supabase
        .from("product_variants")
        .insert(newFormats.map((format, index) => ({
          product_id: product.id,
          scent_id: scentId || null,
          name: `${format.size} ml`,
          sku: `${sku}${String(index + 1).padStart(2, "0")}`,
          size_value: format.size,
          size_unit: "ml",
          price_clp: format.price,
          sale_price_clp: format.salePrice,
          stock: format.stock,
          sort_order: index + 1,
          is_default: index === 0,
          active: true,
        }))).select("id,sort_order");
      if (variantError) throw variantError;

      const imageRows: Array<{
        product_id: string;
        variant_id: string;
        image_url: string;
        storage_path: string;
        alt_text: string;
        sort_order: number;
        is_primary: boolean;
        active: boolean;
      }> = [];
      for (let formatIndex = 0; formatIndex < newFormats.length; formatIndex++) {
        const format=newFormats[formatIndex];const variantId=createdVariants?.find(variant=>variant.sort_order===formatIndex+1)?.id;
        if(!variantId)throw new Error("No fue posible asociar las fotografías a su formato.");
        for(let imageIndex=0;imageIndex<format.images.length;imageIndex++){
          const file=format.images[imageIndex];const path=`${product.id}/${variantId}/${Date.now()}-${imageIndex}.webp`;
          const {error:uploadError}=await supabase.storage.from("product-images").upload(path,file,{cacheControl:"3600",contentType:"image/webp",upsert:false});if(uploadError)throw uploadError;
          const {data:publicFile}=supabase.storage.from("product-images").getPublicUrl(path);
          imageRows.push({product_id:product.id,variant_id:variantId,image_url:publicFile.publicUrl,storage_path:path,alt_text:`${name} ${format.size} ml de Aroma Studio`,sort_order:imageIndex+1,is_primary:format.primaryIndex===imageIndex,active:true});
        }
      }
      if (imageRows.length) {
        const { error: imageError } = await supabase
          .from("product_images")
          .insert(imageRows);
        if (imageError) throw imageError;
      }
      setProducts((items) => [
        {
          id: product.id,
          name,
          family: aromaFamilies.find((family) => family.slug === aromaFamily)?.name ?? aromaFamily,
          price,
          stock,
          active: true,
          featured: data.get("featured") === "on",
          image: imageRows.find((image) => image.is_primary)?.image_url ?? imageRows[0]?.image_url,
        },
        ...items,
      ]);
      newFormats.forEach(format=>format.previews.forEach(URL.revokeObjectURL));
      setImages([]);
      setPreviews([]);
      setPrimaryImageIndex(0);
      setNewProductName("");
      setNewFormats([{ size: 250, price: 6990, salePrice: null, stock: 12, images:[], previews:[], primaryIndex:0 }]);
      form.reset();
      setModal(false);
      setMessage("Producto creado correctamente.");
    } catch (error: any) {
      setMessage(error?.message || "No fue posible crear el producto.");
    } finally {
      setSaving(false);
    }
  };

  if (!session)
    return (
      <main className="admin-login admin-login--minimal">
        <section className="admin-login-minimal">
          <Link href="/" className="admin-login-minimal__logo">
            <Image
              src="/logo-hd.png"
              alt="Aroma Studio"
              width={180}
              height={155}
              priority
            />
          </Link>
          <h1>PANEL ADMINISTRADOR</h1>
          <form onSubmit={login}>
            <label>
              USUARIO
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label>
              CLAVE
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            {message && <div className="admin-message error">{message}</div>}
            <button>INGRESAR</button>
          </form>
        </section>
      </main>
    );
  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/" className="admin-brand">
          <Image src="/logo-white-transparent.png" alt="Aroma Studio" width={150} height={120} priority />
        </Link>
        <p>ADMINISTRACIÓN</p>
        <nav>
          {[
            { name: "Bienvenida", icon: LayoutDashboard },
            { name: "Productos", icon: Package },
            { name: "Categorías", icon: Package },
            { name: "Pedidos", icon: ShoppingBag },
            { name: "Comentarios", icon: MessageSquare },
            { name: "Clientes", icon: Users },
            { name: "Configuración", icon: Settings },
          ].map(({ name, icon: Icon }) => {
            const notificationCount = name === "Comentarios" ? reviews.filter(review => review.status === "pending").length : name === "Pedidos" ? pendingOrdersCount : 0;
            return (
            <button
              key={name}
              className={tab === name ? "active" : ""}
              onClick={() => setTab(name)}
            >
              <Icon aria-hidden="true" />
              <span>{name}</span>
              {notificationCount > 0 && <b className="admin-notification-badge" aria-label={`${notificationCount} ${name.toLowerCase()} sin gestionar`}>{notificationCount > 99 ? "99+" : notificationCount}</b>}
            </button>
          )})}
        </nav>
      </aside>
      <section className="admin-content">
        <header>
          <div>
            <p>7 DE AGOSTO DE 2026</p>
            <h1>{tab}</h1>
          </div>
          <div className="admin-header-actions">
            <strong>ADMINISTRADOR</strong>
            <Link href="/" target="_blank" rel="noopener noreferrer">
              VER SITIO ↗
            </Link>
            <button onClick={() => supabase.auth.signOut()}>
              CERRAR SESIÓN
            </button>
          </div>
        </header>
        {tab === "Bienvenida" && (
          <section className="admin-intro">
            <div>
              <p>BIENVENIDO</p>
              <h2>Panel de control Aroma Studio</h2>
            </div>
          </section>
        )}
        {message && <div className="admin-message">{message}</div>}
        {tab === "Productos" && (
          <section className="admin-table">
            <header>
              <div>
                <p>GESTIÓN</p>
                <h2>Catálogo de productos</h2>
              </div>
              <div className="admin-header-actions">
                <button onClick={() => setAromaManagerOpen(true)}>GESTIONAR AROMAS</button>
                <button onClick={() => setScentManagerOpen(true)}>GESTIONAR FRAGANCIAS</button>
                <button onClick={async () => { setPrimaryImageIndex(0); setModal(true); setGeneratedSku(""); try { setGeneratedSku(await getNextProductSku()); } catch (error: unknown) { setMessage(error instanceof Error ? error.message : "No fue posible generar el SKU."); } }}>+ NUEVO PRODUCTO</button>
              </div>
            </header>
            <div>
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Familia</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        {product.image ? (
                          <Image
                            className="admin-product-image"
                            src={product.image}
                            alt=""
                            width={42}
                            height={52}
                          />
                        ) : (
                          <i>Sin imagen</i>
                        )}
                        <strong>{product.name}</strong>
                      </td>
                      <td>{product.family}</td>
                      <td>${product.price.toLocaleString("es-CL")}</td>
                      <td>{product.stock}</td>
                      <td>
                        <span
                          className={
                            product.stock === 0
                              ? "bad"
                              : product.stock < 7
                                ? "warn"
                                : "ok"
                          }
                        >
                          {product.stock === 0
                            ? "Agotado"
                            : product.stock < 7
                              ? "Stock bajo"
                              : "Activo"}
                        </span>
                      </td>
                      <td>
                        <div className="product-icon-actions">
                          <button type="button" className={product.featured ? "is-featured" : ""} onClick={() => toggleFeaturedProduct(product)} disabled={saving} aria-label={product.featured ? `Quitar ${product.name} de destacados` : `Destacar ${product.name}`} title={product.featured ? "Quitar de destacados" : "Destacar producto"}>
                            <Star aria-hidden="true" />
                          </button>
                        <button
                          onClick={() => openEdit(product.id)}
                          disabled={loadingEdit || saving}
                          aria-label={`Editar ${product.name}`}
                          title="Editar producto"
                        >
                          <Pencil aria-hidden="true" />
                        </button>
                          <button
                            onClick={() => setPendingDelete(product)}
                            disabled={saving}
                            aria-label={`Eliminar ${product.name}`}
                            title="Eliminar producto"
                          >
                            <Trash2 aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
        {tab === "Categorías" && (
          <section className="admin-table">
            <header><div><p>CATÁLOGO</p><h2>Todas las categorías</h2></div><button onClick={()=>{setEditingCategoryId(null);setCategoryImage(null);setCategoryImagePreview("");setCategoryEditorOpen(true)}}>+ AGREGAR CATEGORÍA</button></header>
            <div><table><thead><tr><th>Imagen</th><th>Categoría</th><th>Orden</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{categories.map((category) => <tr key={category.id}><td>{category.image_url ? <Image className="admin-category-image" src={category.image_url} alt={category.name} width={54} height={54} unoptimized/> : "Sin imagen"}</td><td className="admin-category-name"><strong>{category.name}</strong><small>{category.slug}</small></td><td>{category.sort_order}</td><td><span className={category.active ? "ok" : "bad"}>{category.active ? "Activa" : "Inactiva"}</span></td><td><div className="category-icon-actions"><button type="button" aria-label={`Editar ${category.name}`} title="Editar" onClick={() => { if (categoryImagePreview.startsWith("blob:")) URL.revokeObjectURL(categoryImagePreview); setCategoryImage(null); setCategoryImagePreview(category.image_url ?? ""); setEditingCategoryId(category.id); setCategoryEditorOpen(true); }}><Pencil/></button><button type="button" aria-label={`Eliminar ${category.name}`} title="Eliminar" onClick={()=>deleteCategory(category)} disabled={saving}><Trash2/></button></div></td></tr>)}{!categories.length&&<tr><td colSpan={5} className="admin-review-empty">Aún no hay categorías. Usa “Agregar categoría” para crear la primera.</td></tr>}</tbody></table></div>
          </section>
        )}
        {tab === "Comentarios" && (
          <section className="admin-table admin-reviews">
            <header>
              <div><p>MODERACIÓN</p><h2>Comentarios de productos</h2></div>
              <div className="admin-review-filters">
                {[{ value: "pending", label: "Pendientes" }, { value: "approved", label: "Aprobados" }, { value: "rejected", label: "Rechazados" }, { value: "all", label: "Todos" }].map((item) => <button key={item.value} className={reviewFilter === item.value ? "active" : ""} onClick={() => setReviewFilter(item.value)}>{item.label} ({item.value === "all" ? reviews.length : reviews.filter((review) => review.status === item.value).length})</button>)}
              </div>
            </header>
            <div>
              <table>
                <thead><tr><th>Cliente</th><th>Producto</th><th>Calificación</th><th>Comentario</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>
                  {reviews.filter((review) => reviewFilter === "all" || review.status === reviewFilter).map((review) => <tr key={review.id}>
                    <td><strong>{review.reviewer_name}</strong></td>
                    <td><strong>{review.products?.name ?? "Producto"}</strong><small>{review.product_variants?.name ?? ""}</small></td>
                    <td><span className="admin-review-stars">{"★".repeat(review.rating)}{"☆".repeat(5-review.rating)}</span></td>
                    <td className="admin-review-comment">{review.comment}</td>
                    <td>{new Intl.DateTimeFormat("es-CL", { dateStyle: "short" }).format(new Date(review.created_at))}</td>
                    <td><span className={review.status === "approved" ? "ok" : review.status === "rejected" ? "bad" : "warn"}>{review.status === "approved" ? "Aprobado" : review.status === "rejected" ? "Rechazado" : "Pendiente"}</span></td>
                    <td><div className="admin-review-actions"><button className="approve" onClick={() => moderateReview(review, "approved")} disabled={saving || review.status === "approved"} aria-label="Aprobar comentario" title="Aprobar"><Check aria-hidden="true"/></button><button className="reject" onClick={() => moderateReview(review, "rejected")} disabled={saving || review.status === "rejected"} aria-label="Rechazar comentario" title="Rechazar"><X aria-hidden="true"/></button></div></td>
                  </tr>)}
                  {reviews.filter((review) => reviewFilter === "all" || review.status === reviewFilter).length === 0 && <tr><td colSpan={7} className="admin-review-empty">No hay comentarios en esta sección.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        )}
        {tab === "Pedidos" && (
          <section className="admin-table">
            <header>
              <div>
                <p>VENTAS</p>
                <h2>Pedidos recientes</h2>
              </div>
            </header>
            <div>
              <table>
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order[0]}>
                      {order.map((value, i) => (
                        <td key={value}>
                          {i === 3 ? (
                            <span className="ok">{value}</span>
                          ) : (
                            value
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
        {tab === "Clientes" && (
          <section className="admin-table customer-management">
            <header><div><p>CUENTAS</p><h2>Clientes</h2></div><button type="button" onClick={()=>{setEditingCustomer(null);setCustomerEditorOpen(true)}}>+ AGREGAR CLIENTE</button></header>
            <div><table><thead><tr><th>Cliente</th><th>Correo</th><th>Teléfono</th><th>Registro</th><th>Acciones</th></tr></thead><tbody>{customers.map(customer=><tr key={customer.id}><td><strong>{customer.full_name||"Sin nombre"}</strong></td><td>{customer.email}</td><td>{customer.phone||"—"}</td><td>{new Intl.DateTimeFormat("es-CL",{dateStyle:"medium"}).format(new Date(customer.created_at))}</td><td><div className="category-icon-actions"><button type="button" aria-label={`Editar ${customer.full_name}`} title="Editar" onClick={()=>{setEditingCustomer(customer);setCustomerEditorOpen(true)}}><Pencil aria-hidden="true"/></button><button type="button" aria-label={`Eliminar ${customer.full_name}`} title="Eliminar" onClick={()=>deleteCustomer(customer)} disabled={saving}><Trash2 aria-hidden="true"/></button></div></td></tr>)}{!customers.length&&<tr><td colSpan={5} className="admin-review-empty">Aún no hay clientes registrados.</td></tr>}</tbody></table></div>
          </section>
        )}
        {tab === "Configuración" && <><nav className="configuration-submenu" aria-label="Secciones de configuración">{[{id:"encabezado",label:"Encabezado"},{id:"portada",label:"Portada"},{id:"contacto",label:"Contacto"},{id:"redes",label:"Redes sociales"},{id:"preguntas",label:"Preguntas frecuentes"},{id:"sucursales",label:"Sucursales"}].map(item=><button type="button" className={configSection===item.id?"active":""} onClick={()=>setConfigSection(item.id as typeof configSection)} key={item.id}>{item.label}</button>)}</nav>
        {(configSection === "encabezado" || configSection === "portada" || configSection === "contacto" || configSection === "redes") && <section className="admin-table configuration-panel"><header><div><p>CONFIGURACIÓN</p><h2>{configSection==="encabezado"?"Franja superior":configSection==="portada"?"Portada del sitio":configSection==="contacto"?"Teléfono y WhatsApp":"Redes sociales"}</h2></div></header>
          <form className="site-settings-form" onSubmit={saveSiteSettings}>
            {configSection==="encabezado"&&<div className="site-settings-form__group"><h3>Mensaje del encabezado</h3><p>Este texto aparece en la franja negra superior de todas las páginas.</p><label>Texto visible<input name="announcement_text" maxLength={100} required value={siteSettings.announcement_text} onChange={e=>setSiteSettings({...siteSettings,announcement_text:e.target.value})} placeholder="ENVÍOS A TODO CHILE"/></label><label className="featured-check"><input name="announcement_enabled" type="checkbox" checked={siteSettings.announcement_enabled} onChange={e=>setSiteSettings({...siteSettings,announcement_enabled:e.target.checked})}/> Mostrar la franja superior en el sitio</label><div className="announcement-preview"><small>VISTA PREVIA</small><strong>{siteSettings.announcement_text||"Tu mensaje aparecerá aquí"}</strong></div></div>}
            {configSection==="portada"&&<div className="site-settings-form__hero"><div><span>PORTADA DEL SITIO</span><h3>Fotografías del hero</h3><p>Aquí puedes revisar las fotografías activas. Sube una imagen horizontal para escritorio y otra vertical para celular; se comprimen automáticamente antes de guardarse.</p></div><div className="hero-image-fields"><label><b>ESCRITORIO</b><span>Proporción óptima: 1920 × 640 px · 3:1</span>{heroDesktopPreview&&<figure><em>IMAGEN ACTUAL</em><Image src={heroDesktopPreview} alt="Fotografía actual del hero de escritorio" fill unoptimized/></figure>}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>selectHeroImage(event,"desktop")}/><i>{compressing?"Procesando…":"Reemplazar fotografía"}</i>{heroDesktopPreview&&<button className="hero-download" type="button" onClick={event=>downloadImage(event,heroDesktopPreview,"hero-aroma-studio-escritorio")}><Download aria-hidden="true"/> DESCARGAR IMAGEN</button>}</label><label><b>CELULAR</b><span>Proporción óptima: 1080 × 1920 px · 9:16</span>{heroMobilePreview&&<figure className="mobile"><em>IMAGEN ACTUAL</em><Image src={heroMobilePreview} alt="Fotografía actual del hero móvil" fill unoptimized/></figure>}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>selectHeroImage(event,"mobile")}/><i>{compressing?"Procesando…":"Reemplazar fotografía"}</i>{heroMobilePreview&&<button className="hero-download" type="button" onClick={event=>downloadImage(event,heroMobilePreview,"hero-aroma-studio-movil")}><Download aria-hidden="true"/> DESCARGAR IMAGEN</button>}</label></div></div>}
            {configSection==="contacto"&&<div className="site-settings-form__group"><h3>Datos de contacto</h3><div><label>Teléfono visible<input name="phone" required value={siteSettings.phone} onChange={e=>setSiteSettings({...siteSettings,phone:e.target.value})} placeholder="+56 9 1234 5678"/></label><label>Número de WhatsApp<input name="whatsapp_number" required value={siteSettings.whatsapp_number} onChange={e=>setSiteSettings({...siteSettings,whatsapp_number:e.target.value})} placeholder="56912345678"/></label></div><label className="featured-check"><input name="whatsapp_enabled" type="checkbox" checked={siteSettings.whatsapp_enabled} onChange={e=>setSiteSettings({...siteSettings,whatsapp_enabled:e.target.checked})}/> Mostrar botón de WhatsApp en el sitio</label></div>}
            {configSection==="redes"&&<div className="site-settings-form__group social-settings-group"><div className="social-settings-heading"><h3>Perfiles oficiales</h3><p>Agrega los enlaces completos de las redes sociales que deseas mostrar en el sitio.</p></div><div className="social-settings-grid"><label>Instagram<input name="instagram_url" type="url" value={siteSettings.instagram_url} onChange={e=>setSiteSettings({...siteSettings,instagram_url:e.target.value})} placeholder="https://instagram.com/..."/></label><label>Facebook<input name="facebook_url" type="url" value={siteSettings.facebook_url} onChange={e=>setSiteSettings({...siteSettings,facebook_url:e.target.value})} placeholder="https://facebook.com/..."/></label><label>TikTok<input name="tiktok_url" type="url" value={siteSettings.tiktok_url} onChange={e=>setSiteSettings({...siteSettings,tiktok_url:e.target.value})} placeholder="https://tiktok.com/@..."/></label><label>YouTube<input name="youtube_url" type="url" value={siteSettings.youtube_url} onChange={e=>setSiteSettings({...siteSettings,youtube_url:e.target.value})} placeholder="https://youtube.com/@..."/></label></div></div>}
            <div className="site-settings-form__actions"><button disabled={saving}>{saving?"GUARDANDO…":"GUARDAR CONFIGURACIÓN"}</button></div>
          </form>
        </section>}{configSection === "preguntas"&&<section className="admin-table configuration-panel"><header><div><p>CONTENIDO</p><h2>Preguntas frecuentes</h2></div></header>
          <form key={editingFaqId??"new-faq"} className="category-form" onSubmit={saveFaq}>
            <label>Pregunta<input name="question" required defaultValue={faqs.find(x=>x.id===editingFaqId)?.question??""}/></label>
            <label>Respuesta<textarea name="answer" required rows={3} defaultValue={faqs.find(x=>x.id===editingFaqId)?.answer??""}/></label>
            <label>Orden<input name="sort_order" type="number" min="0" defaultValue={faqs.find(x=>x.id===editingFaqId)?.sort_order??faqs.length+1}/></label>
            <label className="featured-check"><input name="active" type="checkbox" defaultChecked={faqs.find(x=>x.id===editingFaqId)?.active??true}/> Visible</label>
            <button disabled={saving}>{editingFaqId?"GUARDAR CAMBIOS":"CREAR PREGUNTA"}</button>
          </form>
          <div><table><thead><tr><th>Pregunta</th><th>Respuesta</th><th>Orden</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{faqs.map(faq=><tr key={faq.id}><td><strong>{faq.question}</strong></td><td>{faq.answer}</td><td>{faq.sort_order}</td><td>{faq.active?"Visible":"Oculta"}</td><td><div className="admin-row-actions"><button className="admin-edit-button" onClick={()=>setEditingFaqId(faq.id)}>EDITAR</button><button className="admin-delete-button" onClick={()=>deleteFaq(faq.id)}><Trash2/> ELIMINAR</button></div></td></tr>)}</tbody></table></div>
        </section>}{configSection === "sucursales"&&<section className="admin-table configuration-panel"><header><div><p>PORTADA</p><h2>Sección de tiendas</h2></div></header>
          <form className="site-settings-form store-section-form" onSubmit={saveStoreSection}>
            <div className="site-settings-form__group">
              <h3>Contenido visible</h3><p>Edita la única sección de tiendas que aparece en la página principal.</p>
              <div><label>Etiqueta superior<input required maxLength={50} value={siteSettings.stores_eyebrow} onChange={e=>setSiteSettings({...siteSettings,stores_eyebrow:e.target.value})}/></label><label>Título principal<input required maxLength={100} value={siteSettings.stores_title} onChange={e=>setSiteSettings({...siteSettings,stores_title:e.target.value})}/></label></div>
              <div><label>Etiqueta del contenido<input required maxLength={50} value={siteSettings.stores_content_eyebrow} onChange={e=>setSiteSettings({...siteSettings,stores_content_eyebrow:e.target.value})}/></label><label>Título del contenido<input required maxLength={100} value={siteSettings.stores_content_title} onChange={e=>setSiteSettings({...siteSettings,stores_content_title:e.target.value})}/></label></div>
              <label>Texto descriptivo<textarea required rows={4} maxLength={500} value={siteSettings.stores_content_text} onChange={e=>setSiteSettings({...siteSettings,stores_content_text:e.target.value})}/></label>
            </div>
            <div className="location-photo-field"><div><b>FOTOGRAFÍA DE LA SECCIÓN</b><span>Proporción recomendada: 1600 × 1050 px</span><small>La imagen se comprime automáticamente antes de guardarse.</small></div>{locationPreview&&<figure><em>{locationImage?"NUEVA FOTO":"IMAGEN ACTUAL"}</em><Image src={locationPreview} alt="Fotografía de la sección de tiendas" fill unoptimized/></figure>}<label className="image-upload">Fotografía<input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectLocationImage}/><span>{compressing?"Procesando…":"Reemplazar y comprimir fotografía"}</span></label>{locationPreview&&<button className="hero-download" type="button" onClick={event=>downloadImage(event,locationPreview,"seccion-tiendas-aroma-studio")}><Download aria-hidden="true"/> DESCARGAR IMAGEN</button>}</div>
            <div className="site-settings-form__actions"><button disabled={saving||compressing}>{saving?"GUARDANDO…":"GUARDAR SECCIÓN"}</button></div>
          </form>
        </section>}</>}
      </section>
      {categoryEditorOpen&&<div className="modal-backdrop"><form key={editingCategoryId??"new-category"} className="category-management-form category-management-modal" onSubmit={saveCategory}><header><div><p>CATEGORÍAS</p><h2>{editingCategoryId?"Editar categoría":"Nueva categoría"}</h2></div><button type="button" aria-label="Cerrar" onClick={()=>{setCategoryEditorOpen(false);setEditingCategoryId(null);setCategoryImage(null);setCategoryImagePreview("")}}>×</button></header><div className="category-management-fields"><label>Nombre<input name="name" required defaultValue={categories.find(item=>item.id===editingCategoryId)?.name??""} placeholder="Ej. Home Spray"/></label><label>Orden<input name="sort_order" type="number" min="0" defaultValue={categories.find(item=>item.id===editingCategoryId)?.sort_order??categories.length+1}/></label></div><label className="image-upload">Fotografía<input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectCategoryImage}/><span>{compressing?"Comprimiendo…":categoryImagePreview?"Cambiar fotografía":"Seleccionar fotografía"}</span></label>{categoryImagePreview&&<div className="category-management-preview"><Image src={categoryImagePreview} alt="Vista previa" fill unoptimized/></div>}<label className="featured-check"><input name="active" type="checkbox" defaultChecked={categories.find(item=>item.id===editingCategoryId)?.active??true}/> Mostrar en el sitio</label><div className="category-management-actions"><button type="button" onClick={()=>setCategoryEditorOpen(false)}>CANCELAR</button><button disabled={saving||compressing}>{saving?"GUARDANDO…":editingCategoryId?"GUARDAR":"CREAR CATEGORÍA"}</button></div></form></div>}
      {customerEditorOpen&&<div className="modal-backdrop"><form key={editingCustomer?.id??"new-customer"} className="product-modal customer-form-modal" onSubmit={saveCustomer}><header><div><p>CLIENTES</p><h2>{editingCustomer?"Editar cliente":"Nuevo cliente"}</h2></div><button type="button" aria-label="Cerrar" onClick={()=>{setCustomerEditorOpen(false);setEditingCustomer(null)}}>×</button></header><label>Nombre completo<input name="full_name" required minLength={3} autoComplete="name" defaultValue={editingCustomer?.full_name??""} placeholder="Nombre y apellido"/></label><label>Correo electrónico<input name="email" type="email" required autoComplete="email" defaultValue={editingCustomer?.email??""} placeholder="cliente@correo.cl"/></label><label>Teléfono<input name="phone" type="tel" autoComplete="tel" defaultValue={editingCustomer?.phone??""} placeholder="+56 9 1234 5678"/></label>{!editingCustomer&&<label>Contraseña temporal<input name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="Mínimo 8 caracteres"/></label>}<p>{editingCustomer?"Los cambios actualizarán la cuenta y los datos visibles del cliente.":"La cuenta se confirmará automáticamente. El cliente podrá iniciar sesión inmediatamente y modificar sus datos desde Mi cuenta."}</p><div><button type="button" onClick={()=>{setCustomerEditorOpen(false);setEditingCustomer(null)}}>CANCELAR</button><button type="submit" disabled={saving}>{saving?"GUARDANDO…":editingCustomer?"GUARDAR CAMBIOS":"CREAR CLIENTE"}</button></div></form></div>}
      {aromaManagerOpen && <div className="modal-backdrop"><section className="scent-manager" role="dialog" aria-modal="true" aria-labelledby="aroma-manager-title"><header><div><p>PRODUCTOS</p><h2 id="aroma-manager-title">Aromas</h2></div><button type="button" aria-label="Cerrar" onClick={()=>{setEditingAromaSlug(null);setAromaManagerOpen(false)}}>×</button></header><form key={editingAromaSlug??"new-aroma"} className="scent-form" onSubmit={saveAromaFamily}><div><label>Nombre<input name="name" required defaultValue={aromaFamilies.find(item=>item.slug===editingAromaSlug)?.name??""} placeholder="Ej. Frutal"/></label><label>Orden<input name="sort_order" type="number" min="0" defaultValue={aromaFamilies.find(item=>item.slug===editingAromaSlug)?.sort_order??aromaFamilies.length+1}/></label></div><label className="featured-check"><input name="active" type="checkbox" defaultChecked={aromaFamilies.find(item=>item.slug===editingAromaSlug)?.active??true}/> Aroma activo</label><div className="scent-form-actions">{editingAromaSlug&&<button type="button" onClick={()=>setEditingAromaSlug(null)}>CANCELAR</button>}<button type="submit" disabled={saving}>{editingAromaSlug?"GUARDAR CAMBIOS":"+ CREAR AROMA"}</button></div></form><div className="scent-list"><table><thead><tr><th>Aroma</th><th>Slug</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{aromaFamilies.map(family=><tr key={family.slug}><td><strong>{family.name}</strong></td><td>{family.slug}</td><td><span className={family.active?"ok":"bad"}>{family.active?"Activo":"Inactivo"}</span></td><td><div className="admin-row-actions"><button type="button" className="admin-edit-button" onClick={()=>setEditingAromaSlug(family.slug)}>EDITAR</button><button type="button" className="admin-delete-button" onClick={()=>deleteAromaFamily(family)} disabled={saving}><Trash2/> ELIMINAR</button></div></td></tr>)}{!aromaFamilies.length&&<tr><td colSpan={4} className="admin-review-empty">No hay aromas creados.</td></tr>}</tbody></table></div></section></div>}
      {scentManagerOpen && (
        <div className="modal-backdrop">
          <section className="scent-manager" role="dialog" aria-modal="true" aria-labelledby="scent-manager-title">
            <header>
              <div><p>CATÁLOGO</p><h2 id="scent-manager-title">Fragancias</h2></div>
              <button type="button" aria-label="Cerrar" onClick={() => { setEditingScentId(null); setScentManagerOpen(false); }}>×</button>
            </header>
            <form ref={scentFormRef} key={editingScentId ?? "new-scent"} className="scent-form" onSubmit={saveScent}>
              <div>
                <label>Nombre<input name="name" required defaultValue={scents.find((item) => item.id === editingScentId)?.name ?? ""}/></label>
              </div>
              <label>Notas aromáticas<input name="notes" defaultValue={scents.find((item) => item.id === editingScentId)?.notes ?? ""} placeholder="Ej. mango, vainilla y durazno"/></label>
              <label>Descripción<textarea name="description" rows={2} defaultValue={scents.find((item) => item.id === editingScentId)?.description ?? ""}/></label>
              <div>
                <label>Orden<input name="sort_order" type="number" min="0" defaultValue={scents.find((item) => item.id === editingScentId)?.sort_order ?? scents.length + 1}/></label>
                <label className="featured-check"><input name="active" type="checkbox" defaultChecked={scents.find((item) => item.id === editingScentId)?.active ?? true}/> Fragancia activa</label>
              </div>
              <div className="scent-form-actions">
                {editingScentId && <button type="button" onClick={() => setEditingScentId(null)}>CANCELAR</button>}
                <button type="submit" disabled={saving}>{editingScentId ? "GUARDAR CAMBIOS" : "+ CREAR FRAGANCIA"}</button>
              </div>
            </form>
            <div className="scent-list">
              <table>
                <thead><tr><th>Fragancia</th><th>Notas</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>
                  {scents.map((scent) => <tr key={scent.id}>
                    <td><strong>{scent.name}</strong><small>{scent.slug}</small></td>
                    <td>{scent.notes || "Sin notas"}</td>
                    <td><span className={scent.active ? "ok" : "bad"}>{scent.active ? "Activa" : "Inactiva"}</span></td>
                    <td><div className="admin-row-actions"><button type="button" className="admin-edit-button" onClick={() => openScentEdit(scent.id)}>EDITAR</button><button type="button" className="admin-delete-button" onClick={() => deleteScent(scent)} disabled={saving}><Trash2/> ELIMINAR</button></div></td>
                  </tr>)}
                  {!scents.length && <tr><td colSpan={4} className="admin-review-empty">No hay fragancias creadas.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
      {modal && (
        <div className="modal-backdrop">
          <form className="product-modal" onSubmit={create}>
            <header>
              <h2>Nuevo producto</h2>
              <button type="button" onClick={() => {
                previews.forEach(URL.revokeObjectURL);
                setImages([]);
                setPreviews([]);
                setPrimaryImageIndex(0);
                setNewFormats([{ size: 250, price: 6990, salePrice: null, stock: 12, images:[], previews:[], primaryIndex:0 }]);
                setModal(false);
              }}>
                ×
              </button>
            </header>
            <label>
              Nombre
              <input name="name" required placeholder="Ej. Home Spray Mango" value={newProductName} onChange={(event) => setNewProductName(event.target.value)} />
            </label>
            <div>
              <label>
                Categoría
                <select name="category" required>
                  <option value="">Selecciona una categoría</option>
                  {categories.map((category) => <option value={category.slug} key={category.id}>{category.name}</option>)}
                </select>
              </label>
              <label>
                Slug automático
                <input name="slug" readOnly value={slugify(newProductName)} placeholder="home-spray-mango" />
              </label>
            </div>
              <label>
                SKU automático
                <input name="sku" readOnly value={generatedSku} placeholder="AR20260903001" />
            </label>
            <label>
              Descripción
              <textarea name="description" rows={3} />
            </label>
            <label>
              Notas aromáticas
              <textarea name="scent_notes" rows={3} placeholder="Ej. Frutilla, guinda, piña y notas especiadas de anís…" />
            </label>
            <div>
              <label>
                Aroma
                <select name="aroma_family" required defaultValue="">
                  <option value="" disabled>Selecciona una familia</option>
                  {aromaFamilies.filter((family) => family.active).map((family) => <option key={family.slug} value={family.slug}>{family.name}</option>)}
                </select>
              </label>
              <label>
                Fragancia
                <select name="scent_id" required defaultValue="">
                <option value="" disabled>Selecciona una fragancia</option>
                {scents.filter((scent) => scent.active).map((scent) => (
                  <option key={scent.id} value={scent.id}>
                    {scent.name}
                  </option>
                ))}
                </select>
              </label>
            </div>
            <section className="new-product-formats">
              <header><div><h3>Formatos disponibles</h3><p>Cada formato admite hasta 5 fotografías propias, comprimidas antes de guardarse.</p></div><button type="button" onClick={() => setNewFormats(items => [...items, { size: 0, price: 0, salePrice: null, stock: 0, images:[], previews:[], primaryIndex:0 }])}>+ AGREGAR FORMATO</button></header>
              {newFormats.map((format, index) => <article key={index}>
                <strong>Formato {index + 1}</strong>
                <label>Capacidad (ml)<input type="number" min="1" required value={format.size || ""} onChange={event => setNewFormats(items => items.map((item, itemIndex) => itemIndex === index ? { ...item, size: Number(event.target.value) } : item))}/></label>
                <label>Precio normal<input type="number" min="0" required value={format.price} onChange={event => setNewFormats(items => items.map((item, itemIndex) => itemIndex === index ? { ...item, price: Number(event.target.value) } : item))}/></label>
                <label>Precio oferta<input type="number" min="0" max={Math.max(0,format.price-1)} value={format.salePrice??""} placeholder="Sin oferta" onChange={event => setNewFormats(items => items.map((item, itemIndex) => itemIndex === index ? { ...item, salePrice: event.target.value===""?null:Number(event.target.value) } : item))}/></label>
                <label>Stock<input type="number" min="0" required value={format.stock} onChange={event => setNewFormats(items => items.map((item, itemIndex) => itemIndex === index ? { ...item, stock: Number(event.target.value) } : item))}/></label>
                {newFormats.length > 1 && <button type="button" aria-label={`Eliminar formato ${index + 1}`} onClick={() => setNewFormats(items => {items[index].previews.forEach(URL.revokeObjectURL);return items.filter((_, itemIndex) => itemIndex !== index)})}><Trash2/> ELIMINAR</button>}
                <div className="new-format-images"><label className="image-upload">Fotografías del formato<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={event=>selectNewFormatImages(event,index)}/><span>{compressing?"Comprimiendo…":"Seleccionar hasta 5 fotografías"}</span></label>{format.previews.length>0&&<div className="image-previews">{format.previews.map((src,imageIndex)=><figure key={src}><Image src={src} alt={`Formato ${format.size||index+1}, foto ${imageIndex+1}`} fill unoptimized/><button type="button" onClick={()=>removeNewFormatImage(index,imageIndex)}>×</button><button type="button" className="image-primary-button" onClick={()=>setNewFormats(items=>items.map((item,itemIndex)=>itemIndex===index?{...item,primaryIndex:imageIndex}:item))}>{format.primaryIndex===imageIndex?"PRINCIPAL":"USAR COMO PRINCIPAL"}</button></figure>)}</div>}</div>
              </article>)}
            </section>
            <label className="featured-check">
              <input name="featured" type="checkbox" /> Mostrar como producto
              destacado
            </label>
            <button disabled={saving}>
              {saving ? "GUARDANDO…" : "CREAR PRODUCTO"}
            </button>
          </form>
        </div>
      )}
      {editing && (
        <div className="modal-backdrop">
          <form className="product-modal product-modal--edit" onSubmit={updateProduct}>
            <header>
              <div>
                <p>GESTIÓN DE CATÁLOGO</p>
                <h2>Editar producto</h2>
              </div>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => {
                  setEditing(null);
                  setImages([]);
                  previews.forEach(URL.revokeObjectURL);
                  setPreviews([]);
                  setPrimaryImageIndex(0);
                }}
              >
                ×
              </button>
            </header>
            <label>
              Nombre
              <input
                name="name"
                required
                value={editing.name}
                onChange={(event) => setEditing({ ...editing, name: event.target.value })}
              />
            </label>
            <div>
              <label>
                Categoría
                <select name="category" defaultValue={editing.category_slug} required>
                  <option value="">Selecciona una categoría</option>
                  {categories.map((category) => <option value={category.slug} key={category.id}>{category.name}</option>)}
                </select>
              </label>
              <label>
                SKU automático
                <input name="sku" readOnly value={editing.sku} />
              </label>
            </div>
            <label>
              Descripción
              <textarea name="description" rows={3} defaultValue={editing.description} />
            </label>
            <label>
              Notas aromáticas
              <textarea name="scent_notes" rows={3} value={editing.scent_notes} onChange={(event)=>setEditing({...editing,scent_notes:event.target.value})} placeholder="Escribe manualmente las notas de este producto" />
            </label>
            <div>
              <label>
                Aroma
                <select name="aroma_family" required value={editing.aroma_family} onChange={(event) => setEditing({ ...editing, aroma_family: event.target.value })}>
                  <option value="" disabled>Selecciona una familia</option>
                  {aromaFamilies.map((family) => <option key={family.slug} value={family.slug}>{family.name}{family.active ? "" : " (inactivo)"}</option>)}
                </select>
              </label>
              <label>
                Fragancia
                <select required value={editing.variants[0]?.scent_id ?? ""} onChange={(event) => changeProductScent(event.target.value)}>
                  <option value="" disabled>Selecciona una fragancia</option>
                  {scents.map((scent) => <option key={scent.id} value={scent.id}>{scent.name}{scent.active ? "" : " (inactiva)"}</option>)}
                </select>
              </label>
            </div>

            <section className="edit-variants">
              <header><div><h3>Presentaciones, precios y stock</h3><p>Cada formato puede tener precio normal, precio de oferta y fotografías propias.</p></div><button type="button" onClick={() => { const id=`new-${crypto.randomUUID()}`; setEditing(current => current ? { ...current, variants: [...current.variants, { id, name: "", sku: "", price_clp: current.variants[0]?.price_clp ?? 0, sale_price_clp: null, stock: 0, size_value: null, size_unit: "ml", scent_id: current.variants[0]?.scent_id ?? "", active: true }] } : current); setExpandedVariantId(id); }}>+ AGREGAR FORMATO</button></header>
              {editing.variants.map((variant, index) => (
                <details className="variant-accordion" key={variant.id} open={expandedVariantId === variant.id}>
                  <summary onClick={event=>{event.preventDefault();toggleEditVariant(variant.id)}}><span>Formato {index + 1}</span><small>{variant.size_value ? `${variant.size_value} ml` : "Sin capacidad"} · {new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(variant.price_clp)} · Stock {variant.stock}</small><ChevronDown aria-hidden="true"/></summary>
                  <div className="variant-accordion__content">
                  <div className="variant-fields">
                    <label>
                      Capacidad (ml)
                      <input type="number" min="1" value={variant.size_value ?? ""} onChange={(event) => changeVariant(index, "size_value", Number(event.target.value))}/>
                    </label>
                    <label>
                      Precio normal
                      <input
                        type="number"
                        min="0"
                        value={variant.price_clp}
                        onChange={(event) =>
                          changeVariant(index, "price_clp", Number(event.target.value))
                        }
                      />
                    </label>
                    <label>
                      Precio oferta
                      <input type="number" min="0" max={Math.max(0,variant.price_clp-1)} value={variant.sale_price_clp??""} placeholder="Sin oferta" onChange={(event) => changeVariant(index, "sale_price_clp", event.target.value===""?null:Number(event.target.value))}/>
                    </label>
                    <label>
                      Stock
                      <input
                        type="number"
                        min="0"
                        value={variant.stock}
                        onChange={(event) =>
                          changeVariant(index, "stock", Number(event.target.value))
                        }
                      />
                    </label>
                  </div>
                  <label className="featured-check">
                    <input
                      type="checkbox"
                      checked={variant.active}
                      onChange={(event) =>
                        changeVariant(index, "active", event.target.checked)
                      }
                    />
                    Formato activo
                  </label>
                  <section className="variant-image-manager" aria-label={`Fotografías del formato ${variant.size_value || index + 1}`}>
                    <header><strong>Fotografías del formato</strong><span>{editing.currentImages.filter(image=>image.variant_id===variant.id).length + (imageVariantId===variant.id ? images.length : 0)} de 5</span></header>
                    {editing.currentImages.filter(image=>image.variant_id===variant.id).length > 0 ? (
                      <div className="image-previews">
                        {editing.currentImages.filter(image=>image.variant_id===variant.id).map((image) => (
                          <figure key={image.id}>
                            <Image src={image.image_url} alt="" fill unoptimized />
                            <button type="button" onClick={() => removeCurrentImage(image)} aria-label="Eliminar fotografía">×</button>
                            <button type="button" className="image-primary-button" onClick={() => selectCurrentPrimaryImage(image.id)}>{image.is_primary ? "PRINCIPAL" : "USAR COMO PRINCIPAL"}</button>
                          </figure>
                        ))}
                      </div>
                    ) : <p className="edit-no-images">Este formato aún no tiene fotografías.</p>}
                    <label className="image-upload">
                      Agregar fotografías
                      <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={selectImages}/>
                      <span>Se comprimen automáticamente y se guardan en Supabase · Máximo 5</span>
                    </label>
                    {imageVariantId===variant.id && previews.length > 0 && (
                      <div className="image-previews">
                        {previews.map((src, imageIndex) => (
                          <figure key={src}>
                            <Image src={src} alt="" fill unoptimized />
                            <button type="button" onClick={() => removeImage(imageIndex)} aria-label="Quitar fotografía nueva">×</button>
                            <button type="button" className="image-primary-button" onClick={() => selectNewPrimaryImage(imageIndex)}>{primaryImageIndex === imageIndex ? "PRINCIPAL" : "USAR COMO PRINCIPAL"}</button>
                          </figure>
                        ))}
                      </div>
                    )}
                  </section>
                  {editing.variants.length > 1 && variant.id.startsWith("new-") && <button type="button" className="remove-format-button" onClick={() => { setEditing(current => current ? { ...current, variants: current.variants.filter(item => item.id !== variant.id) } : current); if (imageVariantId === variant.id) setImageVariantId(editing.variants[0]?.id ?? ""); }}><Trash2/> ELIMINAR FORMATO</button>}
                  </div>
                </details>
              ))}
            </section>

            <div className="edit-product-checks">
              <label className="featured-check">
                <input name="active" type="checkbox" defaultChecked={editing.active} />
                Producto activo y visible
              </label>
              <label className="featured-check">
                <input name="featured" type="checkbox" defaultChecked={editing.featured} />
                Producto destacado
              </label>
            </div>
            <button disabled={saving || compressing}>
              {saving ? "GUARDANDO…" : compressing ? "OPTIMIZANDO IMÁGENES…" : "GUARDAR CAMBIOS"}
            </button>
          </form>
        </div>
      )}
      {pendingDelete && (
        <div className="modal-backdrop">
          <section
            className="delete-product-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-product-title"
          >
            <Trash2 aria-hidden="true" />
            <p>ELIMINAR PRODUCTO</p>
            <h2 id="delete-product-title">¿Eliminar “{pendingDelete.name}”?</h2>
            <span>
              Se borrará definitivamente de la base de datos junto con sus
              variantes y fotografías. Esta acción no se puede deshacer.
            </span>
            <div>
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                disabled={saving}
              >
                CANCELAR
              </button>
              <button type="button" onClick={deleteProduct} disabled={saving}>
                {saving ? "ELIMINANDO…" : "SÍ, ELIMINAR"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
