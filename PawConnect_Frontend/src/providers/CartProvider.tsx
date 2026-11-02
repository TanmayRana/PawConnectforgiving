"use client";

import * as React from "react";
import {
  type Cart,
  type CartItem,
  EMPTY_CART,
  matchesProductId,
} from "@/lib/api/cart";
import {
  useCart,
  useAddToCart,
  useUpdateCartQuantity,
  useRemoveFromCart,
  useClearCart,
  useApplyPromoCode,
} from "@/lib/api/hooks";
import { useAuthStore } from "@/stores/auth.store";
import { useGuestCartStore } from "@/stores/cart.store";
import { toast } from "@/lib/utils/toast";
import type { ProductItem } from "@/lib/mock/data";

export interface CartContextValue {
  cart: Cart;
  cartCount: number;
  isLoading: boolean;
  getItemQuantity: (productId?: string | number | null) => number;
  getCartItem: (productId?: string | number | null) => CartItem | undefined;
  addToCart: (product: ProductItem, quantity?: number) => Promise<Cart>;
  increment: (
    productId: string | number,
    maxStock?: number,
    product?: ProductItem,
    cartItemId?: number
  ) => Promise<Cart>;
  decrement: (productId: string | number, cartItemId?: number) => Promise<Cart>;
  updateQuantity: (
    productId: string | number,
    quantity: number,
    cartItemId?: number
  ) => Promise<Cart>;
  removeItem: (productId: string | number, cartItemId?: number) => Promise<Cart>;
  clearCart: () => Promise<Cart>;
  applyPromo: (code: string) => Promise<Cart>;
  removePromo: () => Promise<Cart>;
  refreshCart: () => Promise<Cart>;
}

const CartContext = React.createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const guestCart = useGuestCartStore((state) => state.guestCart);
  const addGuestItem = useGuestCartStore((state) => state.addGuestItem);
  const updateGuestQuantity = useGuestCartStore((state) => state.updateGuestQuantity);
  const removeGuestItem = useGuestCartStore((state) => state.removeGuestItem);
  const clearGuestCart = useGuestCartStore((state) => state.clearGuestCart);
  const applyGuestPromo = useGuestCartStore((state) => state.applyGuestPromo);

  // TanStack Query for authenticated server cart state (with optimistic updates)
  const {
    data: serverCart,
    isLoading: isServerCartLoading,
    refetch: refetchServerCart,
  } = useCart();

  const addToCartMutation = useAddToCart();
  const updateQuantityMutation = useUpdateCartQuantity();
  const removeFromCartMutation = useRemoveFromCart();
  const clearCartMutation = useClearCart();
  const applyPromoMutation = useApplyPromoCode();

  // Single source of truth:
  // - Authenticated: serverCart from TanStack Query (with optimistic updates in cache)
  // - Unauthenticated / Guest: guestCart from Zustand
  const cart: Cart = React.useMemo(() => {
    if (isAuthenticated) {
      return serverCart ?? EMPTY_CART;
    }
    return guestCart ?? EMPTY_CART;
  }, [isAuthenticated, serverCart, guestCart]);

  const isLoading = isAuthenticated ? isServerCartLoading && !serverCart : false;

  const cartCount =
    cart.totalItems ??
    cart.itemCount ??
    cart.items.reduce((acc, it) => acc + it.quantity, 0);

  const getItemQuantity = React.useCallback(
    (productId?: string | number | null): number => {
      if (productId === undefined || productId === null || productId === "") return 0;
      const found = cart.items.find((it) => matchesProductId(it.productId, productId));
      return found?.quantity || 0;
    },
    [cart.items]
  );

  const getCartItem = React.useCallback(
    (productId?: string | number | null): CartItem | undefined => {
      if (productId === undefined || productId === null || productId === "") return undefined;
      return cart.items.find((it) => matchesProductId(it.productId, productId));
    },
    [cart.items]
  );

  const addToCart = React.useCallback(
    async (product: ProductItem, quantity = 1): Promise<Cart> => {
      if (isAuthenticated) {
        return await addToCartMutation.mutateAsync({ product, quantity });
      }
      return addGuestItem(product, quantity);
    },
    [isAuthenticated, addToCartMutation, addGuestItem]
  );

  const updateQuantity = React.useCallback(
    async (
      productId: string | number,
      quantity: number,
      cartItemId?: number
    ): Promise<Cart> => {
      const prodId = String(productId ?? "").trim();
      if (isAuthenticated) {
        const item = cart.items.find(
          (it) =>
            (cartItemId !== undefined && it.cartItemId === cartItemId) ||
            matchesProductId(it.productId, prodId)
        );
        const effectiveCartItemId = cartItemId ?? item?.cartItemId;
        return await updateQuantityMutation.mutateAsync({
          productId: prodId,
          quantity,
          cartItemId: effectiveCartItemId,
        });
      }
      return updateGuestQuantity(prodId, quantity);
    },
    [isAuthenticated, cart.items, updateQuantityMutation, updateGuestQuantity]
  );

  const increment = React.useCallback(
    async (
      productId: string | number,
      maxStock?: number,
      product?: ProductItem,
      cartItemId?: number
    ): Promise<Cart> => {
      const prodId = String(productId ?? "").trim();
      const currentQty = getItemQuantity(prodId);
      const effectiveMax = maxStock ?? 50;

      if (currentQty >= effectiveMax) {
        toast.warning("Maximum stock reached", {
          description: `Only ${effectiveMax} items available in stock.`,
        });
        return cart;
      }

      if (currentQty === 0 && product) {
        return addToCart(product, 1);
      }

      return updateQuantity(prodId, currentQty + 1, cartItemId);
    },
    [getItemQuantity, cart, addToCart, updateQuantity]
  );

  const decrement = React.useCallback(
    async (productId: string | number, cartItemId?: number): Promise<Cart> => {
      const prodId = String(productId ?? "").trim();
      const currentQty = getItemQuantity(prodId);

      if (currentQty <= 1) {
        return updateQuantity(prodId, 0, cartItemId);
      }

      return updateQuantity(prodId, currentQty - 1, cartItemId);
    },
    [getItemQuantity, updateQuantity]
  );

  const removeItem = React.useCallback(
    async (productId: string | number, cartItemId?: number): Promise<Cart> => {
      const prodId = String(productId || "").trim();
      if (isAuthenticated) {
        const item = cart.items.find(
          (it) =>
            (cartItemId !== undefined && it.cartItemId === cartItemId) ||
            matchesProductId(it.productId, prodId)
        );
        const effectiveCartItemId = cartItemId ?? item?.cartItemId;
        return await removeFromCartMutation.mutateAsync({
          productId: prodId,
          cartItemId: effectiveCartItemId,
        });
      }
      return removeGuestItem(prodId);
    },
    [isAuthenticated, cart.items, removeFromCartMutation, removeGuestItem]
  );

  const clearCart = React.useCallback(async (): Promise<Cart> => {
    if (isAuthenticated) {
      return await clearCartMutation.mutateAsync();
    }
    clearGuestCart();
    return EMPTY_CART;
  }, [isAuthenticated, clearCartMutation, clearGuestCart]);

  const applyPromo = React.useCallback(
    async (code: string): Promise<Cart> => {
      if (isAuthenticated) {
        return await applyPromoMutation.mutateAsync(code);
      }
      return applyGuestPromo(code);
    },
    [isAuthenticated, applyPromoMutation, applyGuestPromo]
  );

  const removePromo = React.useCallback(async (): Promise<Cart> => {
    return applyPromo("");
  }, [applyPromo]);

  const refreshCart = React.useCallback(async (): Promise<Cart> => {
    if (isAuthenticated) {
      const res = await refetchServerCart();
      return res.data ?? EMPTY_CART;
    }
    return guestCart;
  }, [isAuthenticated, refetchServerCart, guestCart]);

  const value = React.useMemo<CartContextValue>(
    () => ({
      cart,
      cartCount,
      isLoading,
      getItemQuantity,
      getCartItem,
      addToCart,
      increment,
      decrement,
      updateQuantity,
      removeItem,
      clearCart,
      applyPromo,
      removePromo,
      refreshCart,
    }),
    [
      cart,
      cartCount,
      isLoading,
      getItemQuantity,
      getCartItem,
      addToCart,
      increment,
      decrement,
      updateQuantity,
      removeItem,
      clearCart,
      applyPromo,
      removePromo,
      refreshCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useGlobalCart(): CartContextValue {
  const context = React.useContext(CartContext);
  if (!context) {
    throw new Error("useGlobalCart must be used within a CartProvider");
  }
  return context;
}
