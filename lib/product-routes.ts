export function variantPathSegment(sizeValue: number | null, sizeUnit: string | null) {
  if (sizeValue == null) return "unidad";
  return `${Number(sizeValue)}-${(sizeUnit || "ml").toLowerCase()}`;
}
export function productVariantHref(
  productSlug: string,
  sizeValue: number | null,
  sizeUnit: string | null,
) {
  return `/producto/${productSlug}/${variantPathSegment(sizeValue, sizeUnit)}`;
}
