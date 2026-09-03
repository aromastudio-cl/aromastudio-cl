"use client";
import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  BadgePercent,
  LayoutDashboard,
  Package,
  MessageSquare,
  ShoppingBag,
  Trash2,
  Users,
} from "lucide-react";
import { supabase } from "../../lib/supabase-browser";
import { compressProductImage } from "../../lib/compress-product-image";
import ProductLabel from "../product-label";

type Product = {
  id: string | number;
  name: string;
  family: string;
  price: number;
  stock: number;
  active: boolean;
  image?: string;
};
type Category = { id: string; name: string; slug: string };
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
  const [tab, setTab] = useState("Resumen");
  const [products, setProducts] = useState(seed);
  const [scents, setScents] = useState<Scent[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingScentId, setEditingScentId] = useState<string | null>(null);
  const [generatingCategory, setGeneratingCategory] = useState("home-spray");
  const [modal, setModal] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<EditableProduct | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewFilter, setReviewFilter] = useState("pending");

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
      .select("id,name,slug")
      .order("sort_order")
      .then(({ data }) => setCategories(data ?? []));
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
  }, [session]);

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
    setCompressing(true);
    setMessage("");
    try {
      const files = await Promise.all(
        selected.map((file) => compressProductImage(file)),
      );
      previews.forEach(URL.revokeObjectURL);
      setImages(files);
      setPreviews(files.map((file) => URL.createObjectURL(file)));
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
  };

  const slugify = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const saveScent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name")).trim(),
      slug: slugify(String(data.get("slug") || data.get("name"))),
      notes: String(data.get("notes") || "").trim() || null,
      description: String(data.get("description") || "").trim() || null,
      active: data.get("active") === "on",
      sort_order: Number(data.get("sort_order") || 0),
      updated_at: new Date().toISOString(),
    };
    const result = editingScentId
      ? await supabase.from("scents").update(payload).eq("id", editingScentId)
      : await supabase.from("scents").insert(payload);
    if (result.error) setMessage(result.error.message);
    else {
      const { data: refreshed } = await supabase
        .from("scents")
        .select("id,name,slug,notes,description,active,sort_order,category_scents(categories(name))")
        .order("sort_order");
      setScents(refreshed ?? []);
      setEditingScentId(null);
      form.reset();
      setMessage("Fragancia guardada correctamente.");
    }
    setSaving(false);
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
    setEditing({
      ...editing,
      currentImages: editing.currentImages.filter((item) => item.id !== image.id),
    });
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
    try {
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
          name: String(data.get("name")),
          description: String(data.get("description") || ""),
          scent_notes: String(data.get("notes") || ""),
          sku: String(data.get("sku") || ""),
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
          is_primary: editing.currentImages.length === 0 && index === 0,
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
                  editing.currentImages[0]?.image_url ??
                  newImageRows[0]?.image_url,
              }
            : item,
        ),
      );
      previews.forEach(URL.revokeObjectURL);
      setImages([]);
      setPreviews([]);
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
    const sku = String(data.get("sku"));
    const price = Number(data.get("price"));
    const stock = Number(data.get("stock"));
    const scentId = String(data.get("scent_id"));
    try {
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
      const productSlug = `${String(data.get("category"))}-${scent.slug}`;
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
          sku: `${sku}-VAR`,
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
          is_primary: index === 0,
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
          image: imageRows[0]?.image_url,
        },
        ...items,
      ]);
      previews.forEach(URL.revokeObjectURL);
      setImages([]);
      setPreviews([]);
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
            { name: "Resumen", icon: LayoutDashboard },
            { name: "Productos", icon: Package },
            { name: "Fragancias", icon: Package },
            { name: "Comentarios", icon: MessageSquare },
            { name: "Pedidos", icon: ShoppingBag },
            { name: "Clientes", icon: Users },
            { name: "Descuentos", icon: BadgePercent },
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
            <Link href="/tienda" target="_blank" rel="noopener noreferrer">
              VER TIENDA ↗
            </Link>
            <button onClick={() => supabase.auth.signOut()}>
              CERRAR SESIÓN
            </button>
          </div>
        </header>
        {tab === "Resumen" && (
          <>
            <section className="admin-intro">
              <div>
                <p>BUENOS DÍAS</p>
                <h2>Así va Aroma Studio hoy.</h2>
              </div>
              <button onClick={() => setModal(true)}>+ NUEVO PRODUCTO</button>
            </section>
            <section className="stats">
              <article>
                <p>
                  VENTAS DEL MES <b>↗</b>
                </p>
                <strong>$2.486.740</strong>
                <span>+18,4% vs. mes anterior</span>
              </article>
              <article>
                <p>
                  PEDIDOS <b>↗</b>
                </p>
                <strong>48</strong>
                <span>+9 esta semana</span>
              </article>
              <article>
                <p>TICKET PROMEDIO</p>
                <strong>$18.807</strong>
                <span>+4,2% vs. mes anterior</span>
              </article>
              <article>
                <p>
                  STOCK BAJO <b>!</b>
                </p>
                <strong>3</strong>
                <span>Requieren atención</span>
              </article>
            </section>
            <section className="admin-grid">
              <article className="chart-card">
                <div>
                  <p>RENDIMIENTO</p>
                  <h2>Ventas</h2>
                </div>
                <div className="bars">
                  {[42, 58, 36, 72, 61, 88, 78].map((height, i) => (
                    <i key={i} style={{ height: `${height}%` }}>
                      <span>{["L", "M", "M", "J", "V", "S", "D"][i]}</span>
                    </i>
                  ))}
                </div>
              </article>
              <article className="recent">
                <p>ACTIVIDAD</p>
                <h2>Últimos pedidos</h2>
                {orders.map((order) => (
                  <div key={order[0]}>
                    <b>
                      {order[1]
                        .split(" ")
                        .map((x) => x[0])
                        .join("")}
                    </b>
                    <span>
                      <strong>{order[1]}</strong>
                      <small>{order[0]} · Hace 2 h</small>
                    </span>
                    <em>{order[2]}</em>
                  </div>
                ))}
              </article>
            </section>
          </>
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
                <button onClick={generateMissingProducts} disabled={saving}>GENERAR FRAGANCIAS FALTANTES</button>
                <button onClick={() => setModal(true)}>+ NUEVO PRODUCTO</button>
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
        {tab === "Fragancias" && (
          <section className="admin-table">
            <header><div><p>CATÁLOGO CENTRAL</p><h2>Fragancias</h2></div></header>
            <form key={editingScentId ?? "new-scent"} className="product-modal" onSubmit={saveScent}>
              <div><label>Nombre<input name="name" required defaultValue={scents.find((item) => item.id === editingScentId)?.name ?? ""}/></label><label>Slug<input name="slug" defaultValue={scents.find((item) => item.id === editingScentId)?.slug ?? ""}/></label></div>
              <label>Notas aromáticas<textarea name="notes" rows={3} defaultValue={scents.find((item) => item.id === editingScentId)?.notes ?? ""} placeholder="Pendiente de completar"/></label>
              <label>Descripción<textarea name="description" rows={2} defaultValue={scents.find((item) => item.id === editingScentId)?.description ?? ""}/></label>
              <div><label>Orden<input name="sort_order" type="number" min="0" defaultValue={scents.find((item) => item.id === editingScentId)?.sort_order ?? scents.length + 1}/></label><label className="featured-check"><input name="active" type="checkbox" defaultChecked={scents.find((item) => item.id === editingScentId)?.active ?? true}/> Fragancia activa</label></div>
              <button disabled={saving}>{editingScentId ? "GUARDAR CAMBIOS" : "CREAR FRAGANCIA"}</button>
            </form>
            {editingScentId && (
              <ProductLabel fragrance={scents.find((item) => item.id === editingScentId)?.name ?? ""} notes={scents.find((item) => item.id === editingScentId)?.notes} productName="Home Spray" volumeMl={250}/>
            )}
            <div><table><thead><tr><th>Fragancia</th><th>Notas</th><th>Categorías</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{scents.map((scent) => <tr key={scent.id}><td><strong>{scent.name}</strong><small>{scent.slug}</small></td><td>{scent.notes || "Pendientes"}</td><td>{scent.category_scents?.map((item) => item.categories?.[0]?.name).filter(Boolean).join(", ") || "Sin categorías"}</td><td><span className={scent.active ? "ok" : "bad"}>{scent.active ? "Activa" : "Inactiva"}</span></td><td><button className="admin-edit-button" onClick={() => setEditingScentId(scent.id)}>EDITAR</button></td></tr>)}</tbody></table></div>
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
        {["Clientes", "Descuentos"].includes(tab) && (
          <section className="admin-empty">
            <b>AS</b>
            <h2>{tab}</h2>
            <p>Sección preparada para administrar tus datos comerciales.</p>
          </section>
        )}
      </section>
      {modal && (
        <div className="modal-backdrop">
          <form className="product-modal" onSubmit={create}>
            <header>
              <h2>Nuevo producto</h2>
              <button type="button" onClick={() => setModal(false)}>
                ×
              </button>
            </header>
            <label>
              Nombre
              <input name="name" required placeholder="Ej. Home Spray Mango" />
            </label>
            <div>
              <label>
                Categoría
                <select name="category">
                  <option value="home-spray">Home Spray</option>
                  <option value="mikados-varilla">Mikados Varilla</option>
                  <option value="difusor-auto">Difusor Auto</option>
                  <option value="esencias-puras">Esencias Puras</option>
                  <option value="humidificadores">Humidificadores</option>
                </select>
              </label>
              <label>
                SKU
                <input name="sku" required placeholder="AS-HS-MANGO-250" />
              </label>
            </div>
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
              <span>Seleccionar imágenes · La primera será la principal</span>
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
                    {index === 0 && <b>PRINCIPAL</b>}
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
                }}
              >
                ×
              </button>
            </header>
            <label>
              Nombre
              <input name="name" required defaultValue={editing.name} />
            </label>
            <div>
              <label>
                Categoría
                <select name="category" defaultValue={editing.category_slug}>
                  <option value="home-spray">Home Spray</option>
                  <option value="mikados-varilla">Mikados Varilla</option>
                  <option value="difusor-auto">Difusor Auto</option>
                  <option value="esencias-puras">Esencias Puras</option>
                  <option value="humidificadores">Humidificadores</option>
                </select>
              </label>
              <label>
                SKU principal
                <input name="sku" required defaultValue={editing.sku} />
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

            <label>Fotografías actuales</label>
            {editing.currentImages.length > 0 ? (
              <div className="image-previews">
                {editing.currentImages.map((image, index) => (
                  <figure key={image.id}>
                    <Image src={image.image_url} alt="" fill unoptimized />
                    <button type="button" onClick={() => removeCurrentImage(image)}>
                      ×
                    </button>
                    {(image.is_primary || index === 0) && <b>PRINCIPAL</b>}
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
              <span>Seleccionar nuevas imágenes optimizadas automáticamente</span>
            </label>
            {previews.length > 0 && (
              <div className="image-previews">
                {previews.map((src, index) => (
                  <figure key={src}>
                    <Image src={src} alt="" fill unoptimized />
                    <button type="button" onClick={() => removeImage(index)}>×</button>
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
