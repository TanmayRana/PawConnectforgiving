/**
 * Shopping Cart API
 * Connects to Spring Boot /api/me/cart endpoints for authenticated customers,
 * with resilient local storage fallback for guest sessions and offline support.
 */

import { apiGet, apiPost, apiPut, apiDelete, getStoredAccessToken } from "./client";
import type { ProductItem } from "@/lib/mock/data";
import {
  calculateLineTotal,
  calculateCartSubtotal,
  calculateDiscount,
  calculateDelivery,
  calculateOrderTotal,
} from "@/lib/utils/money";

export interface CartItem {
  cartItemId?: number;
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  quantity: number;
  stock: number;
  lineTotal: number;
}

export interface Cart {
  id?: number;
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
  totalItems: number;
  promoCode?: string;
}

export interface BackendCartItem {
  id: number;
  cartId: number;
  productId: number;
  productName: string;
  productSku?: string;
  productImageUrl?: string;
  imageUrl?: string;
  category?: string;
  categoryName?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  availableStock?: number;
  isAvailable?: boolean;
}

export interface BackendCart {
  id: number;
  userId: number;
  status: string;
  items: BackendCartItem[];
  subtotal: number;
  totalItems: number;
}

export const EMPTY_CART: Cart = {
  items: [],
  subtotal: 0,
  discount: 0,
  deliveryFee: 0,
  total: 0,
  itemCount: 0,
  totalItems: 0,
};

export const LOCAL_CART_KEY = "pawconnect_local_cart_v1";
export const PRODUCT_META_CACHE_KEY = "pawconnect_product_meta_cache_v1";
export const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&auto=format&fit=crop&q=80";

export interface ProductMetaCacheEntry {
  image?: string;
  category?: string;
}

export function getProductMetaCache(): Record<string, ProductMetaCacheEntry> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PRODUCT_META_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function cacheProductMeta(
  productId: string | number,
  image?: string,
  category?: string
): void {
  if (typeof window === "undefined" || !productId) return;
  const key = String(productId).replace(/\D/g, "") || String(productId);
  if (!key) return;
  try {
    const current = getProductMetaCache();
    let updated = false;
    const entry = current[key] || {};
    if (image && image.trim().length > 0 && image !== FALLBACK_PRODUCT_IMAGE && entry.image !== image) {
      entry.image = image;
      updated = true;
    }
    if (category && category.trim().length > 0 && category !== "Pet Supplies" && entry.category !== category) {
      entry.category = category;
      updated = true;
    }
    if (updated) {
      current[key] = entry;
      localStorage.setItem(PRODUCT_META_CACHE_KEY, JSON.stringify(current));
    }
  } catch {
    // ignore
  }
}

/**
 * Bulletproof product identifier comparison.
 * Handles strings, numbers, ID prefixes ('prod-3' vs '3'), nulls and undefined.
 */
export function matchesProductId(
  a?: string | number | null,
  b?: string | number | null
): boolean {
  if (a === undefined || a === null || b === undefined || b === null) return false;
  const strA = String(a).trim();
  const strB = String(b).trim();
  if (!strA || !strB) return false;
  if (strA === strB) return true;

  const numA = strA.replace(/\D/g, "");
  const numB = strB.replace(/\D/g, "");
  if (numA && numB && numA === numB) return true;

  return false;
}

export function recalculateCart(items: CartItem[], promoCode?: string): Cart {
  const subtotal = calculateCartSubtotal(items);
  const discount = calculateDiscount(subtotal, promoCode);
  const deliveryFee = calculateDelivery(subtotal);
  const total = calculateOrderTotal(subtotal, discount, deliveryFee);
  const totalItems = items.reduce((acc, it) => acc + it.quantity, 0);

  return {
    items,
    subtotal,
    discount,
    deliveryFee,
    total,
    itemCount: totalItems,
    totalItems,
    promoCode,
  };
}

export function mapBackendCart(
  bc: BackendCart,
  promoCode?: string,
  existingItems?: CartItem[]
): Cart {
  const localCartItems = getLocalCart().items;
  const fallbackList = existingItems && existingItems.length > 0 ? existingItems : localCartItems;
  const metaCache = getProductMetaCache();

  const items: CartItem[] = (bc.items || []).map((it) => {
    const existing = fallbackList.find((loc) => matchesProductId(loc.productId, it.productId));
    const cachedMeta =
      metaCache[String(it.productId)] ||
      metaCache[String(it.productId).replace(/\D/g, "")];

    // Priority for Image:
    // 1. Direct from backend response (it.productImageUrl || it.imageUrl)
    // 2. Existing cart item in memory / local store
    // 3. Persistent product meta cache
    // 4. Default fallback image
    const rawImage =
      it.productImageUrl ||
      it.imageUrl ||
      existing?.image ||
      cachedMeta?.image;

    const image =
      rawImage && rawImage.trim().length > 0 && rawImage !== FALLBACK_PRODUCT_IMAGE
        ? rawImage
        : existing?.image || cachedMeta?.image || FALLBACK_PRODUCT_IMAGE;

    // Priority for Category:
    // 1. Direct from backend response (it.categoryName || it.category)
    // 2. Existing cart item in memory / local store
    // 3. Persistent product meta cache
    // 4. "Pet Supplies"
    const rawCategory =
      it.categoryName ||
      it.category ||
      existing?.category ||
      cachedMeta?.category;

    const category =
      rawCategory && rawCategory.trim().length > 0 && rawCategory !== "Pet Supplies"
        ? rawCategory
        : existing?.category || cachedMeta?.category || "Pet Supplies";

    // Persist discovered image and category into metadata cache
    if (image && image !== FALLBACK_PRODUCT_IMAGE) {
      cacheProductMeta(it.productId, image, category);
    }

    const unitPrice = Number(it.unitPrice || 0);
    const lineTotal = Number(it.lineTotal || unitPrice * it.quantity);

    return {
      cartItemId: it.id,
      productId: String(it.productId),
      name: it.productName,
      price: unitPrice,
      image,
      category,
      quantity: it.quantity,
      stock: it.availableStock ?? 50,
      lineTotal,
    };
  });

  const subtotal = Number(bc.subtotal || calculateCartSubtotal(items));
  const discount = calculateDiscount(subtotal, promoCode);
  const deliveryFee = calculateDelivery(subtotal);
  const total = calculateOrderTotal(subtotal, discount, deliveryFee);
  const totalItems = bc.totalItems ?? items.reduce((acc, it) => acc + it.quantity, 0);

  const cart: Cart = {
    id: bc.id,
    items,
    subtotal,
    discount,
    deliveryFee,
    total,
    itemCount: totalItems,
    totalItems,
    promoCode,
  };

  // Sync back to local storage so subsequent cold loads or page refreshes preserve hydrated images
  if (items.length > 0) {
    saveLocalCart(cart);
  }

  return cart;
}

// ─── SERVER CART API FUNCTIONS (SPRING BOOT /api/me/cart) ─────────────────────

/**
 * GET /api/me/cart
 * Returns CartResponse containing items[] with cartItemId (id) and productId.
 */
export async function fetchServerCart(
  promoCode?: string,
  existingItems?: CartItem[]
): Promise<Cart> {
  const res = await apiGet<BackendCart>("/me/cart");
  if (!res) {
    return EMPTY_CART;
  }
  return mapBackendCart(res, promoCode, existingItems);
}

/**
 * POST /api/me/cart/items
 * Takes { productId, quantity } and ADDS / increments quantity on the backend.
 */
export async function addServerCartItem(
  productId: string | number,
  quantity = 1,
  existingItems?: CartItem[]
): Promise<Cart> {
  const numId = Number(String(productId).replace(/\D/g, "") || "0");
  if (!numId) throw new Error("Invalid product ID");

  const res = await apiPost<BackendCart>("/me/cart/items", {
    productId: numId,
    quantity,
  });
  return mapBackendCart(res, undefined, existingItems);
}

/**
 * PUT /api/me/cart/items/{cartItemId}
 * Takes { quantity } and sets exact quantity on the backend.
 * If quantity <= 0, calls DELETE /api/me/cart/items/{cartItemId}.
 */
export async function updateServerCartItemQuantity(
  cartItemId: number,
  quantity: number,
  existingItems?: CartItem[]
): Promise<Cart> {
  if (quantity <= 0) {
    const res = await apiDelete<BackendCart>(`/me/cart/items/${cartItemId}`);
    return res ? mapBackendCart(res, undefined, existingItems) : EMPTY_CART;
  }
  const res = await apiPut<BackendCart>(`/me/cart/items/${cartItemId}`, {
    quantity,
  });
  return res ? mapBackendCart(res, undefined, existingItems) : EMPTY_CART;
}

/**
 * PUT /api/me/cart/products/{productId}
 * Atomically sets product quantity on backend (or deletes if <= 0).
 */
export async function updateServerProductQuantity(
  productId: string | number,
  quantity: number,
  existingItems?: CartItem[]
): Promise<Cart> {
  const numId = Number(String(productId).replace(/\D/g, "") || "0");
  if (!numId) throw new Error("Invalid product ID");

  const res = await apiPut<BackendCart>(`/me/cart/products/${numId}`, {
    quantity: Math.max(0, quantity),
  });
  return res ? mapBackendCart(res, undefined, existingItems) : EMPTY_CART;
}

/**
 * DELETE /api/me/cart/items/{cartItemId}
 * Requires cartItemId in URL path.
 */
export async function removeServerCartItem(
  cartItemId: number,
  existingItems?: CartItem[]
): Promise<Cart> {
  const res = await apiDelete<BackendCart>(`/me/cart/items/${cartItemId}`);
  return res ? mapBackendCart(res, undefined, existingItems) : EMPTY_CART;
}

/**
 * DELETE /api/me/cart
 * Clears the authenticated customer cart.
 */
export async function clearServerCart(): Promise<Cart> {
  const res = await apiDelete<BackendCart>("/me/cart");
  return res ? mapBackendCart(res) : EMPTY_CART;
}

// ─── LOCAL STORAGE FALLBACK HELPERS ──────────────────────────────────────────

export function getLocalCart(): Cart {
  if (typeof window === "undefined") {
    return EMPTY_CART;
  }
  try {
    const raw = localStorage.getItem(LOCAL_CART_KEY);
    if (!raw) return EMPTY_CART;
    const parsed = JSON.parse(raw) as Cart;
    if (!Array.isArray(parsed.items)) parsed.items = [];
    return parsed;
  } catch {
    return EMPTY_CART;
  }
}

export function saveLocalCart(cart: Cart): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(cart));
  } catch (err) {
    console.error("Failed to save local cart:", err);
  }
}

// ─── COMPATIBILITY WRAPPERS (FOR DIRECT NON-HOOK CALLS) ──────────────────────

export interface CartSyncOptions {
  skipLocalUpdate?: boolean;
  cartItemId?: number;
}

export async function fetchCart(): Promise<Cart> {
  const token = getStoredAccessToken();
  if (token) {
    try {
      return await fetchServerCart();
    } catch {
      return getLocalCart();
    }
  }
  return getLocalCart();
}

export async function addToCart(
  product: ProductItem,
  quantity = 1,
  options?: CartSyncOptions
): Promise<Cart> {
  const prodId = String(product.id || "").trim();
  const productImage = product.images?.[0] || (product as { image?: string }).image;
  if (productImage || product.category) {
    cacheProductMeta(prodId, productImage, product.category);
  }

  const current = getLocalCart();
  const token = getStoredAccessToken();

  if (token) {
    try {
      return await addServerCartItem(prodId, quantity, current.items);
    } catch (err) {
      console.warn("Backend addServerCartItem error:", err);
    }
  }

  // Fallback to local storage for guest
  const existingIdx = current.items.findIndex((it) => matchesProductId(it.productId, prodId));
  const maxStock = (product as { stockQuantity?: number }).stockQuantity ?? product.stock ?? 50;

  let updatedItems: CartItem[];
  if (existingIdx > -1) {
    const existing = current.items[existingIdx];
    const newQty = Math.min(existing.quantity + quantity, maxStock);
    updatedItems = current.items.map((it, idx) =>
      idx === existingIdx
        ? { ...it, quantity: newQty, lineTotal: calculateLineTotal(it.price, newQty) }
        : it
    );
  } else {
    const newItem: CartItem = {
      productId: prodId,
      name: product.name,
      price: Number(product.price || 0),
      originalPrice: product.originalPrice,
      image: product.images?.[0] || (product as { image?: string }).image || "",
      category: product.category || "Pet Supplies",
      quantity,
      stock: maxStock,
      lineTotal: calculateLineTotal(Number(product.price || 0), quantity),
    };
    updatedItems = [...current.items, newItem];
  }

  const updatedCart = recalculateCart(updatedItems, current.promoCode);
  if (!options?.skipLocalUpdate) {
    saveLocalCart(updatedCart);
  }
  return updatedCart;
}

export async function updateCartQuantity(
  productId: string | number,
  quantity: number,
  options?: CartSyncOptions
): Promise<Cart> {
  const prodId = String(productId || "").trim();
  const token = getStoredAccessToken();

  if (token) {
    try {
      let targetCartItemId = options?.cartItemId;
      if (!targetCartItemId) {
        const bc = await apiGet<BackendCart>("/me/cart");
        const target = bc?.items?.find((it) => matchesProductId(it.productId, prodId));
        targetCartItemId = target?.id;
      }

      if (targetCartItemId) {
        if (quantity <= 0) {
          return await removeServerCartItem(targetCartItemId);
        }
        return await updateServerCartItemQuantity(targetCartItemId, quantity);
      }

      // If item not yet in cart and quantity > 0
      const numId = Number(prodId.replace(/\D/g, "") || "0");
      if (numId > 0 && quantity > 0) {
        return await addServerCartItem(numId, quantity);
      }
      return await fetchServerCart();
    } catch (err) {
      console.warn("Backend updateCartQuantity error:", err);
    }
  }

  // Fallback to local cart for guest
  const current = getLocalCart();
  let updatedItems: CartItem[];
  if (quantity <= 0) {
    updatedItems = current.items.filter((it) => !matchesProductId(it.productId, prodId));
  } else {
    const exists = current.items.some((it) => matchesProductId(it.productId, prodId));
    if (exists) {
      updatedItems = current.items.map((it) =>
        matchesProductId(it.productId, prodId)
          ? { ...it, quantity, lineTotal: calculateLineTotal(it.price, quantity) }
          : it
      );
    } else {
      updatedItems = [...current.items];
    }
  }

  const updatedCart = recalculateCart(updatedItems, current.promoCode);
  if (!options?.skipLocalUpdate) {
    saveLocalCart(updatedCart);
  }
  return updatedCart;
}

export async function removeFromCart(
  productId: string | number,
  options?: CartSyncOptions
): Promise<Cart> {
  return updateCartQuantity(productId, 0, options);
}

export async function applyPromoCode(promoCode: string): Promise<Cart> {
  const current = await fetchCart();
  const updatedCart = recalculateCart(current.items, promoCode);
  saveLocalCart(updatedCart);
  return updatedCart;
}

export async function clearCart(): Promise<Cart> {
  const token = getStoredAccessToken();
  if (token) {
    try {
      return await clearServerCart();
    } catch {
      // fallback
    }
  }
  saveLocalCart(EMPTY_CART);
  return EMPTY_CART;
}
