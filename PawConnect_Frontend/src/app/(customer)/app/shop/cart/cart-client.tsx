"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useGlobalCart } from "@/providers/CartProvider";
import { PageHeader } from "@/components/shared/page-header";
import { CartItem } from "@/components/shop/cart-item";
import { CartSummary } from "@/components/shop/cart-summary";
import { EmptyState, LoadingState } from "@/components/shared/states";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/utils/toast";
import { ArrowRight, Trash2, ArrowLeft, ShoppingBag } from "lucide-react";

export function CartClient() {
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const {
    cart,
    isLoading,
    updateQuantity,
    removeItem,
    clearCart,
    applyPromo,
    removePromo,
  } = useGlobalCart();

  const items = cart?.items || [];
  const isEmpty = items.length === 0;

  // Render a consistent page shell during SSR and initial hydration mount
  if (!mounted || (isLoading && (!cart || cart.items.length === 0))) {
    return (
      <div className="space-y-8 pb-20">
        <PageHeader
          title="Shopping Cart"
          description="Review your selected pet food, toys, and care items before checkout."
        />
        <div className="py-8">
          <LoadingState variant="list" count={3} message="Loading your shopping cart..." />
        </div>
      </div>
    );
  }

  const handleUpdateQuantity = async (
    productId: string,
    quantity: number,
    cartItemId?: number
  ) => {
    try {
      await updateQuantity(productId, quantity, cartItemId);
    } catch {
      toast.error("Could not update quantity");
    }
  };

  const handleRemove = async (productId: string, cartItemId?: number) => {
    try {
      await removeItem(productId, cartItemId);
    } catch {
      toast.error("Could not remove item");
    }
  };

  const handleApplyPromo = async (code: string) => {
    try {
      const updated = await applyPromo(code);
      if (updated.promoCode) {
        toast.success("Promo Code Applied!", {
          description: `Code ${updated.promoCode} applied successfully.`,
        });
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Invalid promo code. Please try again.";
      toast.error("Invalid Promo Code", {
        description: message,
      });
    }
  };

  const handleRemovePromo = async () => {
    try {
      await removePromo();
      toast.info("Promo Code Removed", {
        description: "Your cart discount has been reset.",
      });
    } catch {
      toast.error("Could not remove promo code");
    }
  };

  const handleConfirmClear = async () => {
    try {
      await clearCart();
      setClearDialogOpen(false);
      toast.success("Cart Cleared", {
        description: "All items have been removed from your cart.",
      });
    } catch {
      toast.error("Could not clear cart");
    }
  };

  const totalCount =
    cart?.totalItems ??
    cart?.itemCount ??
    items.reduce((acc, it) => acc + it.quantity, 0);

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        title="Shopping Cart"
        description="Review your selected pet food, toys, and care items before checkout."
      />

      {isEmpty ? (
        <div className="py-12">
          <EmptyState
            icon={<ShoppingBag className="h-8 w-8 text-muted-foreground" />}
            title="Your cart is empty"
            description="Looks like you haven't added any in-house pet essentials yet. Explore our veterinarian-approved catalog."
            action={
              <Button asChild className="rounded-xl">
                <Link href="/app/shop/products">Continue Shopping</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="text-sm font-semibold text-foreground">
                {totalCount} {totalCount === 1 ? "Item" : "Items"} in your bag
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setClearDialogOpen(true)}
                className="text-xs text-muted-foreground hover:text-destructive gap-1.5 h-8 px-2"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear Cart
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item) => (
                <CartItem
                  key={item.cartItemId ? `cart-item-${item.cartItemId}` : `prod-${item.productId}`}
                  item={item}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemove={handleRemove}
                />
              ))}
            </div>

            <div className="pt-4">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <Link href="/app/shop/products">
                  <ArrowLeft className="h-4 w-4" />
                  Continue Shopping
                </Link>
              </Button>
            </div>
          </div>

          {/* Cart Summary */}
          {cart && (
            <div className="lg:col-span-5 xl:col-span-4 sticky top-24">
              <CartSummary
                cart={cart}
                onApplyPromo={handleApplyPromo}
                onRemovePromo={handleRemovePromo}
                checkoutAction={
                  <Button
                    asChild
                    size="lg"
                    className="w-full rounded-2xl h-12 font-bold shadow-md text-sm gap-2"
                  >
                    <Link href="/app/shop/checkout">
                      Proceed to Checkout
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                }
              />
            </div>
          )}
        </div>
      )}

      {/* Clear Cart Confirmation Dialog */}
      <ConfirmDialog
        open={clearDialogOpen}
        onOpenChange={setClearDialogOpen}
        title="Clear entire cart?"
        description="Are you sure you want to remove all items from your shopping cart? This cannot be undone."
        confirmLabel="Yes, Clear Cart"
        variant="destructive"
        onConfirm={handleConfirmClear}
      />
    </div>
  );
}
