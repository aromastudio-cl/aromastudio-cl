"use client";
import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  Package,
  MessageSquare,
  ShoppingBag,
  Settings,
  Trash2,
  Users,
} from "lucide-react";
import { supabase } from "../../lib/supabase-browser";
import { compressProductImage } from "../../lib/compress-product-image";

type Product = {
  id: string | number;
  name: string;
  family: string;
  price: number;
  stock: number;
  active: boolean;
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
  category_scents?: Array<{ categories: Array<{ name: string }> }>;
};
type EditableVariant = {
  id: string;
  name: string;
  sku: string;
  price_clp: number;
  stock: number;
  size_value: number | null;
  size_unit: string;
  scent_id: string;
  active: boolean;
};
type EditableImage = {
  id: string;
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
  sku: string;
  price_clp: number;
  stock: number;
  active: boolean;
  featured: boolean;
  variants: EditableVariant[];
  currentImages: EditableImage[];
};
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
type StoreLocation = { id:string; name:string; address:string; image_url:string; image_storage_path:string; show_in_hero:boolean; active:boolean; sort_order:number };
type Faq={id:string;question:string;answer:string;active:boolean;sort_order:number};
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [scentManagerOpen, setScentManagerOpen] = useState(false);
  const [editingScentId, setEditingScentId] = useState<string | null>(null);
  const [categoryImage, setCategoryImage] = useState<File | null>(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState("");
  const [generatingCategory, setGeneratingCategory] = useState("");
  const [modal, setModal] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState<number | null>(0);
  const [saving, setSaving] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<EditableProduct | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewFilter, setReviewFilter] = useState("pending");
  const [newProductName, setNewProductName] = useState("");
  const [locations, setLocations] = useState<StoreLocation[]>([]);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [locationImage, setLocationImage] = useState<File | null>(null);
  const [locationPreview, setLocationPreview] = useState("");
  const [siteSettings, setSiteSettings] = useState({ phone: "", whatsapp_number: "", whatsapp_enabled: true, instagram_url: "", facebook_url: "", tiktok_url: "", youtube_url: "" });
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
    supabase
      .from("scents")
      .select("id,name,slug,notes,description,active,sort_order,category_scents(categories(name))")
      .order("sort_order")
      .then(({ data }) => setScents(data ?? []));
    supabase
      .from("categories")
      .select("id,name,slug,active,sort_order,image_url,image_storage_path")
      .order("sort_order")
      .then(({ data }) => {
        setCategories(data ?? []);
        setGeneratingCategory((current) => current || data?.[0]?.slug || "");
      });
    supabase
      .from("products")
      .select(
        "id,name,price_clp,stock,active,product_images(image_url,is_primary)",
      )
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!data) return;
        setProducts(
          data.map((product: any) => ({
            id: product.id,
            name: product.name,
            family: "Catálogo",
            price: product.price_clp,
            stock: product.stock,
            active: product.active,
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
    supabase.from("store_locations").select("*").order("sort_order").then(({data}) => setLocations(data ?? []));
    supabase.from("site_settings").select("phone,whatsapp_number,whatsapp_enabled,instagram_url,facebook_url,tiktok_url,youtube_url").eq("id",1).maybeSingle().then(({data})=>{if(data)setSiteSettings(data);});
    supabase.from("faqs").select("*").order("sort_order").then(({data})=>setFaqs(data??[]));
  }, [session]);

  const saveSiteSettings = async (event:FormEvent<HTMLFormElement>) => {
    event.preventDefault();setSaving(true);setMessage("");const data=new FormData(event.currentTarget);
    const values={phone:String(data.get("phone")||"").trim(),whatsapp_number:String(data.get("whatsapp_number")||"").replace(/\D/g,""),whatsapp_enabled:data.get("whatsapp_enabled")==="on",instagram_url:String(data.get("instagram_url")||"").trim(),facebook_url:String(data.get("facebook_url")||"").trim(),tiktok_url:String(data.get("tiktok_url")||"").trim(),youtube_url:String(data.get("youtube_url")||"").trim(),updated_at:new Date().toISOString()};
    const {error}=await supabase.from("site_settings").upsert({id:1,...values});
    if(error)setMessage(error.message);else{setSiteSettings(values);setMessage("Configuración de contacto guardada.");}setSaving(false);
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

  const saveLocation = async (event:FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setMessage("");
    const data=new FormData(event.currentTarget); const current=locations.find(x=>x.id===editingLocationId); let uploadedPath="";
    try {
      if(!current&&!locationImage)throw new Error("Selecciona una foto para la sucursal.");
      let image_url=current?.image_url??"", image_storage_path=current?.image_storage_path??"";
      if(locationImage){uploadedPath=`locations/${Date.now()}.webp`;const up=await supabase.storage.from("product-images").upload(uploadedPath,locationImage,{cacheControl:"3600"});if(up.error)throw up.error;image_url=supabase.storage.from("product-images").getPublicUrl(uploadedPath).data.publicUrl;image_storage_path=uploadedPath;}
      const show_in_hero=data.get("show_in_hero")==="on";
      if(show_in_hero){const clear=await supabase.from("store_locations").update({show_in_hero:false}).neq("id",editingLocationId??"");if(clear.error)throw clear.error;}
      const payload={name:String(data.get("name")).trim(),address:String(data.get("address")).trim(),image_url,image_storage_path,show_in_hero,active:data.get("active")==="on",sort_order:Number(data.get("sort_order")||0),updated_at:new Date().toISOString()};
      const result=editingLocationId?await supabase.from("store_locations").update(payload).eq("id",editingLocationId):await supabase.from("store_locations").insert(payload);if(result.error)throw result.error;
      if(locationImage&&current?.image_storage_path)await supabase.storage.from("product-images").remove([current.image_storage_path]);
      const refreshed=await supabase.from("store_locations").select("*").order("sort_order");setLocations(refreshed.data??[]);setEditingLocationId(null);setLocationImage(null);setLocationPreview("");(event.currentTarget as HTMLFormElement).reset();setMessage("Sucursal guardada correctamente.");
    } catch(error:unknown){if(uploadedPath)await supabase.storage.from("product-images").remove([uploadedPath]);setMessage(error instanceof Error?error.message:"No fue posible guardar la sucursal.");} finally{setSaving(false);}
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
    const availableSlots = 5 - (editing?.currentImages.length ?? 0);
    if (selected.length > availableSlots) {
      setMessage(`Puedes guardar hasta 5 fotografías por producto. Quedan ${Math.max(availableSlots, 0)} espacios disponibles.`);
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
      setPrimaryImageIndex(editing?.currentImages.some((image) => image.is_primary) ? null : 0);
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "No fue posible procesar la imagen.");
    } finally {
      setCompressing(false);
    }
  };

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
        is_primary: image.id === imageId,
      })),
    });
    setPrimaryImageIndex(null);
  };

  const selectNewPrimaryImage = (index: number) => {
    setPrimaryImageIndex(index);
    if (editing) {
      setEditing({
        ...editing,
        currentImages: editing.currentImages.map((image) => ({ ...image, is_primary: false })),
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

  const compactIdentifier = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "");

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
          .upload(uploadedPath, categoryImage, { cacheControl: "3600", upsert: false });
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
      setCategoryImage(null);
      if (categoryImagePreview.startsWith("blob:")) URL.revokeObjectURL(categoryImagePreview);
      setCategoryImagePreview("");
      form.reset();
      setMessage("Categoría guardada correctamente.");
    } catch (error: unknown) {
      if (uploadedPath) await supabase.storage.from("product-images").remove([uploadedPath]);
      setMessage(error instanceof Error ? error.message : "No fue posible guardar la categoría.");
    } finally {
      setSaving(false);
    }
  };

  const refreshScents = async () => {
    const { data, error } = await supabase
      .from("scents")
      .select("id,name,slug,notes,description,active,sort_order,category_scents(categories(name))")
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
      const { error: relationError } = await supabase.from("category_scents").delete().eq("scent_id", scent.id);
      if (relationError) throw relationError;
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

  const generateMissingProducts = async () => {
    setSaving(true);
    setMessage("");
    try {
      const category = categories.find((item) => item.slug === generatingCategory);
      if (!category) throw new Error("Selecciona una categoría válida.");
      const [{ data: availability, error: availabilityError }, { data: formats, error: formatsError }, { data: existing, error: existingError }] = await Promise.all([
        supabase.from("category_scents").select("scent_id,scents(id,name,slug,notes,active)").eq("category_id", category.id).eq("active", true),
        supabase.from("catalog_formats").select("prefix,variant_code,variant_name,size_value,size_unit,price_clp,stock,is_default,sort_order").eq("category_slug", category.slug).order("sort_order"),
        supabase.from("products").select("id,product_variants(scent_id)").eq("category_id", category.id),
      ]);
      if (availabilityError || formatsError || existingError) throw availabilityError || formatsError || existingError;
      if (!formats?.length) throw new Error("La categoría no tiene formatos configurados.");
      const existingScentIds = new Set((existing ?? []).flatMap((item: any) => (item.product_variants ?? []).map((variant: any) => variant.scent_id)));
      const missing = (availability ?? []).map((item: any) => item.scents).filter((scent: any) => scent?.active && !existingScentIds.has(scent.id));
      for (const scent of missing) {
        const productSku = `AS-${formats[0].prefix}-${scent.slug.replace(/[^a-z0-9]/g, "").toUpperCase()}`;
        const { data: product, error: productError } = await supabase.from("products").insert({
          category_id: category.id,
          name: `${category.name} ${scent.name}`,
          slug: `${category.slug}-${scent.slug}`,
          description: `${category.name} con fragancia ${scent.name}.`,
          scent_notes: scent.notes,
          sku: productSku,
          price_clp: Math.min(...formats.map((format) => format.price_clp)),
          stock: formats.reduce((sum, format) => sum + format.stock, 0),
          active: true,
          featured: false,
        }).select("id").single();
        if (productError) throw productError;
        const { error: variantError } = await supabase.from("product_variants").insert(formats.map((format) => ({
          product_id: product.id,
          scent_id: scent.id,
          name: format.variant_name,
          sku: `${productSku}-${format.variant_code}`,
          size_value: format.size_value,
          size_unit: format.size_unit,
          price_clp: format.price_clp,
          stock: format.stock,
          low_stock_threshold: 5,
          active: true,
          is_default: format.is_default,
          sort_order: format.sort_order,
        })));
        if (variantError) throw variantError;
      }
      setMessage(missing.length ? `Se crearon ${missing.length} productos faltantes para ${category.name}.` : `${category.name} ya contiene todas las fragancias disponibles.`);
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "No fue posible generar los productos.");
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
        "id,name,category_id,description,scent_notes,sku,price_clp,stock,active,featured,categories(slug),product_variants(id,name,sku,price_clp,stock,size_value,size_unit,scent_id,active,is_default,sort_order),product_images(id,image_url,storage_path,is_primary,sort_order)",
      )
      .eq("id", productId)
      .single();
    setLoadingEdit(false);
    if (error || !data) {
      setMessage(error?.message || "No fue posible cargar el producto.");
      return;
    }
    const item: any = data;
    setEditing({
      id: item.id,
      name: item.name ?? "",
      category_id: item.category_id,
      category_slug: item.categories?.slug ?? "home-spray",
      description: item.description ?? "",
      scent_notes: item.scent_notes ?? "",
      sku: item.sku ?? "",
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
  };

  const changeVariant = (
    index: number,
    field: keyof EditableVariant,
    value: string | number | boolean,
  ) => {
    setEditing((current) => {
      if (!current) return current;
      const variants = [...current.variants];
      variants[index] = { ...variants[index], [field]: value };
      return { ...current, variants };
    });
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
    const updatedSlug = compactIdentifier(updatedName).toLowerCase();
    const updatedSku = compactIdentifier(updatedName).toUpperCase();
    try {
      if (!updatedSlug || !updatedSku) {
        throw new Error("El nombre debe incluir al menos una letra o un número.");
      }
      if (editing.currentImages.length + images.length > 5) {
        throw new Error("Cada producto puede tener un máximo de 5 fotografías.");
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
      const { error: productError } = await supabase
        .from("products")
        .update({
          category_id: category.id,
          name: updatedName,
          slug: updatedSlug,
          description: String(data.get("description") || ""),
          scent_notes: String(data.get("notes") || ""),
          sku: updatedSku,
          price_clp: defaultVariant?.price_clp ?? editing.price_clp,
          stock: totalStock,
          active: data.get("active") === "on",
          featured: data.get("featured") === "on",
          updated_at: new Date().toISOString(),
        })
        .eq("id", editing.id);
      if (productError) throw productError;

      for (let index = 0; index < editing.variants.length; index++) {
        const variant = editing.variants[index];
        const { error: variantError } = await supabase
          .from("product_variants")
          .update({
            name: variant.name,
            sku: variant.sku,
            price_clp: Number(variant.price_clp),
            stock: Number(variant.stock),
            size_value: variant.size_value || null,
            size_unit: variant.size_unit,
            scent_id: variant.scent_id || null,
            active: variant.active,
            is_default: index === 0,
            sort_order: index + 1,
          })
          .eq("id", variant.id);
        if (variantError) throw variantError;
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
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (uploadError) throw uploadError;
        const { data: publicFile } = supabase.storage
          .from("product-images")
          .getPublicUrl(path);
        newImageRows.push({
          product_id: editing.id,
          image_url: publicFile.publicUrl,
          storage_path: path,
          alt_text: `${String(data.get("name"))} de Aroma Studio`,
          sort_order: editing.currentImages.length + index + 1,
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
                family: String(data.get("category")),
                price: defaultVariant?.price_clp ?? editing.price_clp,
                stock: totalStock,
                active: data.get("active") === "on",
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

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (compressing) {
      setMessage("Espera mientras terminamos de optimizar las fotografías.");
      return;
    }
    if (!images.length) {
      setMessage("Selecciona al menos una fotografía del producto.");
      return;
    }
    setSaving(true);
    setMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name"));
    const productSlug = compactIdentifier(name).toLowerCase();
    const sku = compactIdentifier(name).toUpperCase();
    const price = Number(data.get("price"));
    const stock = Number(data.get("stock"));
    const scentId = String(data.get("scent_id"));
    try {
      if (!productSlug || !sku) {
        throw new Error("El nombre debe incluir al menos una letra o un número.");
      }
      const { data: category } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", String(data.get("category")))
        .single();
      const scent = scents.find((item) => item.id === scentId);
      if (!category || !scent) throw new Error("Selecciona una categoría y fragancia válidas.");
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
          scent_notes: String(data.get("notes") || ""),
          sku,
          price_clp: price,
          stock,
          active: true,
          featured: data.get("featured") === "on",
        })
        .select("id")
        .single();
      if (productError) throw productError;

      const { error: variantError } = await supabase
        .from("product_variants")
        .insert({
          product_id: product.id,
          scent_id: scentId || null,
          name: String(data.get("size") || "Formato estándar"),
          sku: `${sku}VAR`,
          size_value: Number(data.get("size_value")) || null,
          size_unit: String(data.get("size_unit") || "unidad"),
          price_clp: price,
          stock,
          is_default: true,
          active: true,
        });
      if (variantError) throw variantError;

      const imageRows: Array<{
        product_id: string;
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
        const path = `${String(data.get("category"))}/${scent.slug}/${productSlug}-${Date.now()}-${index}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (uploadError) throw uploadError;
        const { data: publicFile } = supabase.storage
          .from("product-images")
          .getPublicUrl(path);
        imageRows.push({
          product_id: product.id,
          image_url: publicFile.publicUrl,
          storage_path: path,
          alt_text: `${name} de Aroma Studio`,
          sort_order: index + 1,
          is_primary: primaryImageIndex === index,
          active: true,
        });
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
          family: String(data.get("category")),
          price,
          stock,
          active: true,
          image: imageRows.find((image) => image.is_primary)?.image_url ?? imageRows[0]?.image_url,
        },
        ...items,
      ]);
      previews.forEach(URL.revokeObjectURL);
      setImages([]);
      setPreviews([]);
      setPrimaryImageIndex(0);
      setNewProductName("");
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
          AS<small>AROMA STUDIO</small>
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
          ].map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={tab === name ? "active" : ""}
              onClick={() => setTab(name)}
            >
              <Icon aria-hidden="true" />
              <span>{name}</span>
            </button>
          ))}
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
                <select value={generatingCategory} onChange={(event) => setGeneratingCategory(event.target.value)}>
                  {categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
                </select>
                <button onClick={() => setScentManagerOpen(true)}>GESTIONAR FRAGANCIAS</button>
                <button onClick={() => { setPrimaryImageIndex(0); setModal(true); }}>+ NUEVO PRODUCTO</button>
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
                        <div className="admin-row-actions">
                        <button
                          className="admin-edit-button"
                          onClick={() => openEdit(product.id)}
                          disabled={loadingEdit || saving}
                        >
                          {loadingEdit ? "CARGANDO…" : "EDITAR"}
                        </button>
                          <button
                            className="admin-delete-button"
                            onClick={() => setPendingDelete(product)}
                            disabled={saving}
                            aria-label={`Eliminar ${product.name}`}
                            title="Eliminar producto"
                          >
                            <Trash2 aria-hidden="true" />
                            ELIMINAR
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
            <form key={editingCategoryId ?? "new-category"} className="category-management-form" onSubmit={saveCategory}>
              <div className="category-management-fields"><label>Nombre de la categoría<input name="name" required defaultValue={categories.find((item) => item.id === editingCategoryId)?.name ?? ""} placeholder="Ej. Home Spray"/></label><label>Orden<input name="sort_order" type="number" min="0" defaultValue={categories.find((item) => item.id === editingCategoryId)?.sort_order ?? categories.length + 1}/></label></div>
              <label className="image-upload">
                Foto de la categoría
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectCategoryImage}/>
                <span>{compressing ? "Comprimiendo imagen…" : categoryImagePreview ? "Cambiar fotografía" : "Seleccionar una fotografía"}</span>
              </label>
              {categoryImagePreview && <div className="category-management-preview"><Image src={categoryImagePreview} alt="Vista previa de categoría" fill unoptimized/></div>}
              <label className="featured-check"><input name="active" type="checkbox" defaultChecked={categories.find((item) => item.id === editingCategoryId)?.active ?? true}/> Mostrar categoría en el sitio</label>
              <div className="category-management-actions">{editingCategoryId && <button type="button" onClick={()=>{setEditingCategoryId(null);setCategoryImage(null);setCategoryImagePreview("")}}>CANCELAR</button>}<button disabled={saving || compressing}>{editingCategoryId ? "GUARDAR" : "CREAR CATEGORÍA"}</button></div>
            </form>
            <div><table><thead><tr><th>Imagen</th><th>Categoría</th><th>Slug</th><th>Orden</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{categories.map((category) => <tr key={category.id}><td>{category.image_url ? <Image className="admin-category-image" src={category.image_url} alt={category.name} width={54} height={54} unoptimized/> : "Sin imagen"}</td><td><strong>{category.name}</strong></td><td>{category.slug}</td><td>{category.sort_order}</td><td><span className={category.active ? "ok" : "bad"}>{category.active ? "Activa" : "Inactiva"}</span></td><td><button className="admin-edit-button" onClick={() => { if (categoryImagePreview.startsWith("blob:")) URL.revokeObjectURL(categoryImagePreview); setCategoryImage(null); setCategoryImagePreview(category.image_url ?? ""); setEditingCategoryId(category.id); }}>EDITAR</button></td></tr>)}</tbody></table></div>
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
                    <td><div className="admin-review-actions"><button className="approve" onClick={() => moderateReview(review, "approved")} disabled={saving || review.status === "approved"}>APROBAR</button><button className="reject" onClick={() => moderateReview(review, "rejected")} disabled={saving || review.status === "rejected"}>RECHAZAR</button></div></td>
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
          <section className="admin-empty">
            <b>AS</b>
            <h2>{tab}</h2>
            <p>Sección preparada para administrar tus datos comerciales.</p>
          </section>
        )}
        {tab === "Configuración" && <><section className="admin-table"><header><div><p>CONTACTO</p><h2>Teléfono y WhatsApp</h2></div></header>
          <form className="category-form" onSubmit={saveSiteSettings}>
            <label>Teléfono visible<input name="phone" required value={siteSettings.phone} onChange={e=>setSiteSettings({...siteSettings,phone:e.target.value})} placeholder="+56 9 1234 5678"/></label>
            <label>Número de WhatsApp<input name="whatsapp_number" required value={siteSettings.whatsapp_number} onChange={e=>setSiteSettings({...siteSettings,whatsapp_number:e.target.value})} placeholder="56912345678"/></label>
            <label className="featured-check"><input name="whatsapp_enabled" type="checkbox" checked={siteSettings.whatsapp_enabled} onChange={e=>setSiteSettings({...siteSettings,whatsapp_enabled:e.target.checked})}/> Mostrar botón WhatsApp</label>
            <label>Instagram<input name="instagram_url" type="url" value={siteSettings.instagram_url} onChange={e=>setSiteSettings({...siteSettings,instagram_url:e.target.value})} placeholder="https://instagram.com/..."/></label>
            <label>Facebook<input name="facebook_url" type="url" value={siteSettings.facebook_url} onChange={e=>setSiteSettings({...siteSettings,facebook_url:e.target.value})} placeholder="https://facebook.com/..."/></label>
            <label>TikTok<input name="tiktok_url" type="url" value={siteSettings.tiktok_url} onChange={e=>setSiteSettings({...siteSettings,tiktok_url:e.target.value})} placeholder="https://tiktok.com/@..."/></label>
            <label>YouTube<input name="youtube_url" type="url" value={siteSettings.youtube_url} onChange={e=>setSiteSettings({...siteSettings,youtube_url:e.target.value})} placeholder="https://youtube.com/@..."/></label>
            <button disabled={saving}>GUARDAR CONTACTO</button>
          </form>
        </section><section className="admin-table"><header><div><p>CONTENIDO</p><h2>Preguntas frecuentes</h2></div></header>
          <form key={editingFaqId??"new-faq"} className="category-form" onSubmit={saveFaq}>
            <label>Pregunta<input name="question" required defaultValue={faqs.find(x=>x.id===editingFaqId)?.question??""}/></label>
            <label>Respuesta<textarea name="answer" required rows={3} defaultValue={faqs.find(x=>x.id===editingFaqId)?.answer??""}/></label>
            <label>Orden<input name="sort_order" type="number" min="0" defaultValue={faqs.find(x=>x.id===editingFaqId)?.sort_order??faqs.length+1}/></label>
            <label className="featured-check"><input name="active" type="checkbox" defaultChecked={faqs.find(x=>x.id===editingFaqId)?.active??true}/> Visible</label>
            <button disabled={saving}>{editingFaqId?"GUARDAR CAMBIOS":"CREAR PREGUNTA"}</button>
          </form>
          <div><table><thead><tr><th>Pregunta</th><th>Respuesta</th><th>Orden</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{faqs.map(faq=><tr key={faq.id}><td><strong>{faq.question}</strong></td><td>{faq.answer}</td><td>{faq.sort_order}</td><td>{faq.active?"Visible":"Oculta"}</td><td><div className="admin-row-actions"><button className="admin-edit-button" onClick={()=>setEditingFaqId(faq.id)}>EDITAR</button><button className="admin-delete-button" onClick={()=>deleteFaq(faq.id)}><Trash2/> ELIMINAR</button></div></td></tr>)}</tbody></table></div>
        </section><section className="admin-table"><header><div><p>TIENDAS</p><h2>Sucursales</h2></div></header>
          <form key={editingLocationId??"new-location"} className="category-form" onSubmit={saveLocation}>
            <label>Nombre<input name="name" required defaultValue={locations.find(x=>x.id===editingLocationId)?.name??""}/></label>
            <label>Dirección<input name="address" required defaultValue={locations.find(x=>x.id===editingLocationId)?.address??""}/></label>
            <label>Orden<input name="sort_order" type="number" min="0" defaultValue={locations.find(x=>x.id===editingLocationId)?.sort_order??locations.length+1}/></label>
            <label className="featured-check"><input name="active" type="checkbox" defaultChecked={locations.find(x=>x.id===editingLocationId)?.active??true}/> Activa</label>
            <label className="featured-check"><input name="show_in_hero" type="checkbox" defaultChecked={locations.find(x=>x.id===editingLocationId)?.show_in_hero??false}/> Mostrar foto en hero</label>
            <label className="image-upload">Foto<input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectLocationImage}/><span>Seleccionar y comprimir foto</span></label>
            {locationPreview&&<div className="category-image-preview"><Image src={locationPreview} alt="Sucursal" fill unoptimized/></div>}
            <button disabled={saving||compressing}>{editingLocationId?"GUARDAR CAMBIOS":"CREAR SUCURSAL"}</button>
          </form>
          <div><table><thead><tr><th>Foto</th><th>Sucursal</th><th>Dirección</th><th>Hero</th><th>Acción</th></tr></thead><tbody>{locations.map(location=><tr key={location.id}><td><Image className="admin-category-image" src={location.image_url} alt={location.name} width={54} height={54} unoptimized/></td><td><strong>{location.name}</strong></td><td>{location.address}</td><td>{location.show_in_hero?"Sí":"No"}</td><td><button className="admin-edit-button" onClick={()=>{setEditingLocationId(location.id);setLocationImage(null);setLocationPreview(location.image_url)}}>EDITAR</button></td></tr>)}</tbody></table></div>
        </section></>}
      </section>
      {scentManagerOpen && (
        <div className="modal-backdrop">
          <section className="scent-manager" role="dialog" aria-modal="true" aria-labelledby="scent-manager-title">
            <header>
              <div><p>CATÁLOGO</p><h2 id="scent-manager-title">Fragancias</h2></div>
              <button type="button" aria-label="Cerrar" onClick={() => { setEditingScentId(null); setScentManagerOpen(false); }}>×</button>
            </header>
            <form key={editingScentId ?? "new-scent"} className="scent-form" onSubmit={saveScent}>
              <div>
                <label>Nombre<input name="name" required defaultValue={scents.find((item) => item.id === editingScentId)?.name ?? ""}/></label>
                <label>Slug<input name="slug" defaultValue={scents.find((item) => item.id === editingScentId)?.slug ?? ""} placeholder="Se genera automáticamente"/></label>
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
            <div className="scent-generate-row">
              <select value={generatingCategory} onChange={(event) => setGeneratingCategory(event.target.value)}>
                <option value="">Selecciona una categoría</option>
                {categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
              </select>
              <button type="button" onClick={generateMissingProducts} disabled={saving || !generatingCategory}>GENERAR PRODUCTOS PARA FRAGANCIAS FALTANTES</button>
            </div>
            <div className="scent-list">
              <table>
                <thead><tr><th>Fragancia</th><th>Notas</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>
                  {scents.map((scent) => <tr key={scent.id}>
                    <td><strong>{scent.name}</strong><small>{scent.slug}</small></td>
                    <td>{scent.notes || "Sin notas"}</td>
                    <td><span className={scent.active ? "ok" : "bad"}>{scent.active ? "Activa" : "Inactiva"}</span></td>
                    <td><div className="admin-row-actions"><button type="button" className="admin-edit-button" onClick={() => setEditingScentId(scent.id)}>EDITAR</button><button type="button" className="admin-delete-button" onClick={() => deleteScent(scent)} disabled={saving}><Trash2/> ELIMINAR</button></div></td>
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
                <input name="slug" readOnly value={compactIdentifier(newProductName).toLowerCase()} placeholder="homespraymango" />
              </label>
            </div>
            <label>
              SKU automático
              <input name="sku" readOnly value={compactIdentifier(newProductName).toUpperCase()} placeholder="HOMESPRAYMANGO" />
            </label>
            <label>
              Descripción
              <textarea name="description" rows={3} />
            </label>
            <label>
              Notas aromáticas
              <input name="notes" placeholder="Mango, durazno y vainilla" />
            </label>
            <label>
              Aroma
              <select name="scent_id" required>
                <option value="">Selecciona un aroma</option>
                {scents.map((scent) => (
                  <option key={scent.id} value={scent.id}>
                    {scent.name}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <label>
                Precio
                <input
                  name="price"
                  type="number"
                  min="0"
                  required
                  defaultValue="6990"
                />
              </label>
              <label>
                Stock
                <input
                  name="stock"
                  type="number"
                  min="0"
                  required
                  defaultValue="12"
                />
              </label>
            </div>
            <div>
              <label>
                Tamaño
                <input
                  name="size_value"
                  type="number"
                  min="0"
                  placeholder="250"
                />
              </label>
              <label>
                Unidad
                <select name="size_unit">
                  <option value="ml">ml</option>
                  <option value="g">g</option>
                  <option value="unidad">unidad</option>
                  <option value="litro">litro</option>
                  <option value="kg">kg</option>
                </select>
              </label>
            </div>
            <label className="image-upload">
              Fotografías
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={selectImages}
              />
              <span>Seleccionar hasta 5 imágenes · Se comprimen antes de guardarse</span>
            </label>
            {previews.length > 0 && (
              <div className="image-previews">
                {previews.map((src, index) => (
                  <figure key={src}>
                    <Image
                      src={src}
                      alt={`Vista previa ${index + 1}`}
                      fill
                      unoptimized
                    />
                    <button type="button" onClick={() => removeImage(index)}>
                      ×
                    </button>
                    <button
                      type="button"
                      className="image-primary-button"
                      onClick={() => selectNewPrimaryImage(index)}
                    >
                      {primaryImageIndex === index ? "PRINCIPAL" : "USAR COMO PRINCIPAL"}
                    </button>
                  </figure>
                ))}
              </div>
            )}
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
                <input name="sku" readOnly value={compactIdentifier(editing.name).toUpperCase()} />
              </label>
            </div>
            <label>
              Descripción
              <textarea name="description" rows={3} defaultValue={editing.description} />
            </label>
            <label>
              Notas aromáticas
              <input name="notes" defaultValue={editing.scent_notes} />
            </label>

            <section className="edit-variants">
              <h3>Presentaciones, precios y stock</h3>
              {editing.variants.map((variant, index) => (
                <article key={variant.id}>
                  <strong>Presentación {index + 1}</strong>
                  <div>
                    <label>
                      Nombre
                      <input
                        value={variant.name}
                        onChange={(event) => changeVariant(index, "name", event.target.value)}
                      />
                    </label>
                    <label>
                      SKU
                      <input
                        value={variant.sku}
                        onChange={(event) => changeVariant(index, "sku", event.target.value)}
                      />
                    </label>
                  </div>
                  <div>
                    <label>
                      Precio
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
                    <label>
                      Aroma
                      <select
                        value={variant.scent_id}
                        onChange={(event) =>
                          changeVariant(index, "scent_id", event.target.value)
                        }
                      >
                        <option value="">Sin aroma</option>
                        {scents.map((scent) => (
                          <option key={scent.id} value={scent.id}>
                            {scent.name}
                          </option>
                        ))}
                      </select>
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
                    Presentación activa
                  </label>
                </article>
              ))}
            </section>

            <p className="image-section-title">Fotografías actuales</p>
            {editing.currentImages.length > 0 ? (
              <div className="image-previews">
                {editing.currentImages.map((image) => (
                  <figure key={image.id}>
                    <Image src={image.image_url} alt="" fill unoptimized />
                    <button type="button" onClick={() => removeCurrentImage(image)}>
                      ×
                    </button>
                    <button
                      type="button"
                      className="image-primary-button"
                      onClick={() => selectCurrentPrimaryImage(image.id)}
                    >
                      {image.is_primary ? "PRINCIPAL" : "USAR COMO PRINCIPAL"}
                    </button>
                  </figure>
                ))}
              </div>
            ) : (
              <p className="edit-no-images">Este producto aún no tiene fotografías.</p>
            )}
            <label className="image-upload">
              Agregar fotografías
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={selectImages}
              />
              <span>Agregar imágenes comprimidas · Máximo 5 por producto</span>
            </label>
            {previews.length > 0 && (
              <div className="image-previews">
                {previews.map((src, index) => (
                  <figure key={src}>
                    <Image src={src} alt="" fill unoptimized />
                    <button type="button" onClick={() => removeImage(index)}>×</button>
                    <button
                      type="button"
                      className="image-primary-button"
                      onClick={() => selectNewPrimaryImage(index)}
                    >
                      {primaryImageIndex === index ? "PRINCIPAL" : "USAR COMO PRINCIPAL"}
                    </button>
                  </figure>
                ))}
              </div>
            )}
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
