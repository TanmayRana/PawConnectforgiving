import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Cart, CartItem } from "@/lib/api/cart";
import type { ProductItem } from "@/lib/mock/data";
import {
  calculateLineTotal,
  calculateCartSubtotal,
  calculateDiscount,
  calculateDelivery,
  calculateOrderTotal,
} from "@/lib/utils/money";
import { matchesProductId } from "@/lib/api/cart";

export const EMPTY_CART: Cart = {
  items: [],
  subtotal: 0,
  discount: 0,
  deliveryFee: 0,
  total: 0,
  itemCount: 0,
  totalItems: 0,
};

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

export interface GuestCartState {
  guestCart: Cart;
  setGuestCart: (cart: Cart) => void;
  addGuestItem: (product: ProductItem, quantity?: number) => Cart;
  updateGuestQuantity: (productId: string | number, quantity: number) => Cart;
  removeGuestItem: (productId: string | number) => Cart;
  clearGuestCart: () => void;
  applyGuestPromo: (code: string) => Cart;
}

export const useGuestCartStore = create<GuestCartState>()(
  persist(
    (set, get) => ({
      guestCart: EMPTY_CART,
      setGuestCart: (cart) => set({ guestCart: cart }),
      addGuestItem: (product, quantity = 1) => {
        const current = get().guestCart;
        const prodId = String(product.id || "").trim();
        const maxStock =
          (product as { stockQuantity?: number }).stockQuantity ??
          product.stock ??
          50;

        const existingIdx = current.items.findIndex((it) =>
          matchesProductId(it.productId, prodId)
        );

        let updatedItems: CartItem[];
        if (existingIdx > -1) {
          const existing = current.items[existingIdx];
          const newQty = Math.min(existing.quantity + quantity, maxStock);
          updatedItems = current.items.map((it, idx) =>
            idx === existingIdx
              ? {
                  ...it,
                  quantity: newQty,
                  lineTotal: calculateLineTotal(it.price, newQty),
                }
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

        const nextCart = recalculateCart(updatedItems, current.promoCode);
        set({ guestCart: nextCart });
        return nextCart;
      },
      updateGuestQuantity: (productId, quantity) => {
        const current = get().guestCart;
        const prodId = String(productId || "").trim();

        let updatedItems: CartItem[];
        if (quantity <= 0) {
          updatedItems = current.items.filter(
            (it) => !matchesProductId(it.productId, prodId)
          );
        } else {
          const exists = current.items.some((it) =>
            matchesProductId(it.productId, prodId)
          );
          if (exists) {
            updatedItems = current.items.map((it) =>
              matchesProductId(it.productId, prodId)
                ? {
                    ...it,
                    quantity,
                    lineTotal: calculateLineTotal(it.price, quantity),
                  }
                : it
            );
          } else {
            updatedItems = [...current.items];
          }
        }

        const nextCart = recalculateCart(updatedItems, current.promoCode);
        set({ guestCart: nextCart });
        return nextCart;
      },
      removeGuestItem: (productId) => {
        return get().updateGuestQuantity(productId, 0);
      },
      clearGuestCart: () => {
        set({ guestCart: EMPTY_CART });
      },
      applyGuestPromo: (code) => {
        const current = get().guestCart;
        const nextCart = recalculateCart(current.items, code);
        set({ guestCart: nextCart });
        return nextCart;
      },
    }),
    {
      name: "pawconnect_guest_cart",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      })),
    }
  )
);
