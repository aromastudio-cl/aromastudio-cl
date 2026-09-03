export const PRODUCT_CATEGORY_ORDER = [
  "home-spray",
  "mikados-varilla",
  "esencias-puras",
  "difusor-auto",
] as const;

export const productCategoryRank = (slug: string) => {
  const index = PRODUCT_CATEGORY_ORDER.indexOf(
    slug as (typeof PRODUCT_CATEGORY_ORDER)[number],
  );

  return index === -1 ? PRODUCT_CATEGORY_ORDER.length : index;
};

const PRODUCT_CATEGORY_LABELS: Record<string, string> = {
  "home-spray": "Home Spray",
  "mikados-varilla": "Difusor de Varillas",
  "esencias-puras": "Esencias Puras",
  "difusor-auto": "Difusor para Vehículo",
};

export const productCategoryLabel = (slug: string, fallback: string) =>
  PRODUCT_CATEGORY_LABELS[slug] ?? fallback;
