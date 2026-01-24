/**
 * Centralized product image utility
 * All product images are now PNG files in /products/[slug]-neon.png format
 */

// Default fallback image
export const DEFAULT_PRODUCT_IMAGE = '/products/airpods-4-neon.png'

/**
 * Convert a product name to a slug
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/['']/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Get the neon PNG image path for a product
 */
export function getNeonImagePath(itemName: string): string {
  return `/products/${slugify(itemName)}-neon.png`
}

/**
 * Get product image with fallback
 * Primary: the actual image_url from database
 * Fallback: generated path based on product name slug
 */
export function getProductImageWithFallback(
  itemName: string,
  imageUrl?: string
): { primary: string; fallback: string } {
  const neonPath = getNeonImagePath(itemName)
  return {
    primary: imageUrl || neonPath,
    fallback: DEFAULT_PRODUCT_IMAGE
  }
}

/**
 * @deprecated Use getNeonImagePath or the image_url from database
 * This function is kept for backwards compatibility
 */
export function getProductSvg(itemName: string, _itemId?: string): string {
  // Now returns the neon PNG path instead of SVG
  return getNeonImagePath(itemName)
}
