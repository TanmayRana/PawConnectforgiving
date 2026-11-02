"use client";

import * as React from "react";
import { formatMoney } from "@/lib/utils/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Truck, Tag, X, Loader2 } from "lucide-react";
import type { Cart } from "@/lib/api/cart";

interface CartSummaryProps {
  cart: Cart;
  onApplyPromo?: (code: string) => Promise<void> | void;
  onRemovePromo?: () => Promise<void> | void;
  checkoutAction?: React.ReactNode;
  showPromoInput?: boolean;
}

export function CartSummary({
  cart,
  onApplyPromo,
  onRemovePromo,
  checkoutAction,
  showPromoInput = true,
}: CartSummaryProps) {
  const [promoInput, setPromoInput] = React.useState("");
  const [isApplying, setIsApplying] = React.useState(false);
  const [isRemoving, setIsRemoving] = React.useState(false);

  const handlePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim() || !onApplyPromo) return;

    try {
      setIsApplying(true);
      await onApplyPromo(promoInput.trim().toUpperCase());
      setPromoInput("");
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveClick = async () => {
    if (!onRemovePromo) return;
    try {
      setIsRemoving(true);
      await onRemovePromo();
    } finally {
      setIsRemoving(false);
    }
  };

  const freeDeliveryThreshold = 500;
  const amountToFreeDelivery = Math.max(0, freeDeliveryThreshold - cart.subtotal);
  const totalCount =
    cart.totalItems ??
    cart.itemCount ??
    cart.items.reduce((acc, it) => acc + it.quantity, 0);

  const hasAppliedPromo = Boolean(cart.promoCode);

  return (
    <div className="space-y-6 rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
      <h3 className="text-lg font-bold text-foreground border-b border-border/60 pb-3">
        Order Summary
      </h3>

      {/* Free Delivery Bar */}
      {cart.subtotal < freeDeliveryThreshold && cart.subtotal > 0 && (
        <div className="rounded-2xl bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-300 border border-amber-500/20">
          <div className="flex items-center gap-2 font-semibold">
            <Truck className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              Add {formatMoney(amountToFreeDelivery)} more for Free Express Delivery!
            </span>
          </div>
        </div>
      )}

      {/* Promo Code Section */}
      {showPromoInput && (
        <div className="space-y-2">
          {hasAppliedPromo ? (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Tag className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs uppercase tracking-wider text-foreground font-mono">
                      {cart.promoCode}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-500/10">
                      Applied
                    </span>
                  </div>
                  {cart.discount > 0 && (
                    <p className="text-[11px] text-muted-foreground">
                      Saving {formatMoney(cart.discount)} on your order
                    </p>
                  )}
                </div>
              </div>

              {onRemovePromo && (
                <button
                  type="button"
                  onClick={handleRemoveClick}
                  disabled={isRemoving}
                  className="p-1.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                  aria-label={`Remove promo code ${cart.promoCode}`}
                >
                  {isRemoving ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          ) : (
            onApplyPromo && (
              <form onSubmit={handlePromoSubmit} className="flex gap-2">
                <Input
                  placeholder="Promo code (e.g. PAW10)"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  className="text-xs h-10 rounded-xl font-mono uppercase tracking-wider"
                  disabled={isApplying}
                />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  disabled={!promoInput.trim() || isApplying}
                  className="rounded-xl text-xs h-10 px-4 font-semibold shrink-0"
                >
                  {isApplying ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </Button>
              </form>
            )
          )}
        </div>
      )}

      {/* Line Items Breakdown */}
      <div className="space-y-2.5 text-xs text-muted-foreground border-b border-border/60 pb-4">
        <div className="flex items-center justify-between">
          <span>
            Items Subtotal ({totalCount} {totalCount === 1 ? "item" : "items"})
          </span>
          <span className="font-semibold text-foreground tabular-nums">
            {formatMoney(cart.subtotal)}
          </span>
        </div>

        {cart.discount > 0 && (
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
            <span className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" /> Discount ({cart.promoCode || "Promo"})
            </span>
            <span className="tabular-nums">-{formatMoney(cart.discount)}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Truck className="h-3.5 w-3.5" /> Express Delivery
          </span>
          <span className="font-semibold text-foreground tabular-nums">
            {cart.deliveryFee === 0 ? "FREE" : formatMoney(cart.deliveryFee)}
          </span>
        </div>
      </div>

      {/* Grand Total */}
      <div className="flex items-baseline justify-between pt-1">
        <div>
          <span className="text-base font-extrabold text-foreground block">Grand Total</span>
          <span className="text-[11px] text-muted-foreground">Includes all local taxes</span>
        </div>
        <span className="text-2xl font-extrabold text-foreground tabular-nums">
          {formatMoney(cart.total)}
        </span>
      </div>

      {/* Custom Checkout Button or Slot */}
      {checkoutAction && <div className="pt-2">{checkoutAction}</div>}

      {/* In-House Guarantee Note */}
      <div className="flex items-start gap-2.5 rounded-2xl bg-surface/60 p-3.5 text-[11px] text-muted-foreground border border-border/50">
        <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <span>
          Every item is inspected and fulfilled directly by <strong>PawConnect</strong>. No third-party sellers. 30-day money-back guarantee.
        </span>
      </div>
    </div>
  );
}

// Alias for OrderSummary to support alternative naming conventions
export const OrderSummary = CartSummary;
