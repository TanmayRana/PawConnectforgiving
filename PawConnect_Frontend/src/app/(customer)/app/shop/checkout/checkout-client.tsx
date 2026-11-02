"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCreateOrder } from "@/lib/api/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useGlobalCart } from "@/providers/CartProvider";
import {
  createPaymentOrder,
  launchRazorpayCheckout,
  cancelAbandonedPayment,
  RazorpayOrderResponse,
} from "@/lib/api/payments";
import { formatMoney } from "@/lib/utils/money";
import { PageHeader } from "@/components/shared/page-header";
import { CheckoutAddressSelector } from "@/components/shop/checkout-address-selector";
import { LoadingState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { showSuccess, showError, showInfo } from "@/lib/utils/toast";
import {
  ShieldCheck,
  Truck,
  CreditCard,
  ShoppingBag,
  ArrowRight,
  Clock,
  AlertCircle,
  Loader2,
  Building2,
  QrCode,
  Lock,
  MapPin,
} from "lucide-react";
import { UpiIcon } from "@/components/shared/upi-badge";
import type { CustomerAddress } from "@/lib/mock/customer";
import type { OrderItem } from "@/lib/mock/orders";

import { PaymentCountdownBanner } from "@/components/shared/payment-countdown-banner";
import { recordPaymentFailure } from "@/lib/api/payments";

const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&auto=format&fit=crop&q=80";

export function CheckoutClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { cart, isLoading: isCartLoading, clearCart } = useGlobalCart();
  const { mutateAsync: createOrder, isPending: isCreatingOrder } = useCreateOrder();

  const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStepText, setPaymentStepText] = useState("");
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [pendingPaymentExpiresAt, setPendingPaymentExpiresAt] = useState<string | null>(null);
  const [pendingOrderTotal, setPendingOrderTotal] = useState<number | null>(null);

  if (isCartLoading) {
    return (
      <div className="py-8">
        <LoadingState variant="detail" message="Loading checkout details..." />
      </div>
    );
  }

  const items = cart?.items || [];
  const isEmpty = items.length === 0;

  if (isEmpty || !cart) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          Your shopping bag is empty
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Please add items to your cart before proceeding to checkout.
        </p>
        <Button asChild className="rounded-xl mt-2">
          <Link href="/app/shop/products">Browse Catalog</Link>
        </Button>
      </div>
    );
  }

  const executePaymentForOrderId = async (orderIdStr: string, totalAmount?: number) => {
    try {
      setIsProcessingPayment(true);
      setPaymentStepText("Connecting to Razorpay...");
      const razorpayOrder = await createPaymentOrder({
        orderId: Number(orderIdStr),
      });

      if (razorpayOrder.paymentExpiresAt) {
        setPendingPaymentExpiresAt(razorpayOrder.paymentExpiresAt);
      }
      if (totalAmount) {
        setPendingOrderTotal(totalAmount);
      }

      setPaymentStepText("Opening Razorpay...");
      await launchRazorpayCheckout({
        order: razorpayOrder,
        preferredMethod: "all",
        onSuccess: async () => {
          try {
            await clearCart();
          } catch {
            // Non-critical if cart clear error
          }
          queryClient.invalidateQueries({ queryKey: ["cart"] });
          queryClient.invalidateQueries({ queryKey: ["customer-cart"] });
          queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
          setIsProcessingPayment(false);
          setPendingOrderId(null);
          setPendingPaymentExpiresAt(null);
          showSuccess(
            "Payment Confirmed",
            "Payment successful! Your order is confirmed."
          );
          router.push(`/app/orders/${orderIdStr}`);
        },
        onDismiss: () => {
          setIsProcessingPayment(false);
          recordPaymentFailure({
            orderId: Number(orderIdStr),
            razorpayOrderId: razorpayOrder.razorpayOrderId,
            reason: "Checkout modal closed by user",
          }).catch(() => {});
          showInfo(
            "Payment Pending",
            "Payment was not completed. You have 15 minutes to retry before your order expires."
          );
        },
        onError: (err) => {
          setIsProcessingPayment(false);
          const msg =
            err instanceof Error
              ? err.message
              : "Payment was not completed. You can retry payment anytime within the 15-minute window.";
          recordPaymentFailure({
            orderId: Number(orderIdStr),
            razorpayOrderId: razorpayOrder.razorpayOrderId,
            reason: msg,
          }).catch(() => {});
          showError("Payment Failed", msg);
        },
      });
    } catch (err: unknown) {
      setIsProcessingPayment(false);
      const msg = err instanceof Error ? err.message : "Unable to initiate payment with Razorpay.";
      showError("Payment Order Failed", msg);
    }
  };

  const handlePlaceOrderClick = async () => {
    // If pendingOrderId already exists and timer is still active, verify amount matches current cart before reusing
    if (pendingOrderId && cart) {
      const isWindowValid = pendingPaymentExpiresAt && new Date(pendingPaymentExpiresAt).getTime() > Date.now();
      const isTotalMatching = pendingOrderTotal != null && Math.abs(pendingOrderTotal - cart.total) < 0.01;
      if (isWindowValid && isTotalMatching) {
        await executePaymentForOrderId(pendingOrderId, pendingOrderTotal || cart.total);
        return;
      } else {
        // Expired or order total changed (e.g., shipping fee updated); reset to generate fresh order
        setPendingOrderId(null);
        setPendingPaymentExpiresAt(null);
        setPendingOrderTotal(null);
      }
    }

    if (!selectedAddress) {
      showError("Address Required", "Please select or add a delivery address to continue.");
      return;
    }
    if (!cart) return;

    try {
      setIsProcessingPayment(true);
      setPaymentStepText("Reserving items & creating order...");

      // Map cart items into OrderItem snapshot
      const orderItems: OrderItem[] = cart.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        image: item.image || FALLBACK_PRODUCT_IMAGE,
        category: item.category,
        price: item.price,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      }));

      // 1. Create order on the server
      const methodLabel = "Razorpay (UPI, Cards, NetBanking)";

      const created = await createOrder({
        items: orderItems,
        subtotal: cart.subtotal,
        discount: cart.discount,
        deliveryFee: cart.deliveryFee,
        total: cart.total,
        itemCount: cart.totalItems,
        deliveryAddress: selectedAddress,
        paymentMethod: methodLabel,
        promoCode: cart.promoCode,
      });

      setPendingOrderId(String(created.id));
      if (created.paymentExpiresAt) {
        setPendingPaymentExpiresAt(created.paymentExpiresAt);
      }
      setPendingOrderTotal(created.total);

      // 2. Launch payment directly
      await executePaymentForOrderId(String(created.id), created.total);
    } catch (err: unknown) {
      setIsProcessingPayment(false);
      const msg =
        err instanceof Error
          ? err.message
          : "An error occurred while creating your order. Please retry.";
      showError("Checkout Error", msg);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        title="Express Checkout"
        description="Verify your delivery destination and confirm your in-house order."
      />

      {/* Live 15-Minute Re-Payment Window Banner */}
      {pendingOrderId && (
        <PaymentCountdownBanner
          expiresAt={pendingPaymentExpiresAt}
          onExpired={() => {
            setPendingOrderId(null);
            setPendingPaymentExpiresAt(null);
            showError("Payment Window Expired", "Your 15-minute payment window expired. Reserved stock has been released.");
          }}
          onRetryPayment={() => executePaymentForOrderId(pendingOrderId, pendingOrderTotal || cart?.total)}
          isRetrying={isProcessingPayment}
          amount={pendingOrderTotal || cart?.total}
          orderId={pendingOrderId}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Delivery Address & Cart Review */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Step 1: Delivery Address */}
          <section className="rounded-3xl border border-border/80 bg-card p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  1
                </span>
                <h3 className="text-base font-bold text-foreground">
                  Delivery Destination
                </h3>
              </div>
              {selectedAddress && (
                <div className="flex items-center gap-2">
                  {selectedAddress.latitude != null && selectedAddress.longitude != null && (
                    <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] gap-1 hidden sm:inline-flex">
                      <MapPin className="h-3 w-3" />
                      Map Verified
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs font-medium">
                    {selectedAddress.label}
                  </Badge>
                </div>
              )}
            </div>

            <CheckoutAddressSelector
              selectedAddressId={selectedAddress?.id || null}
              onSelectAddress={setSelectedAddress}
            />
          </section>

          {/* Step 2: Delivery Method / Logistics */}
          <section className="rounded-3xl border border-border/80 bg-card p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  2
                </span>
                <h3 className="text-base font-bold text-foreground">
                  Fulfillment & Delivery Method
                </h3>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs">
                In-House Express
              </Badge>
            </div>

            <div className="rounded-2xl border border-border/70 bg-surface/50 p-4 flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                <Truck className="h-5 w-5" />
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground text-sm">
                    PawConnect Dedicated Courier
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                    {cart.deliveryFee === 0 ? "FREE Delivery" : formatMoney(cart.deliveryFee)}
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Dispatched directly from our regional climate-regulated depot. Temperature-safe packaging for specialty nutrition.
                </p>
                <div className="flex items-center gap-1.5 text-muted-foreground pt-1">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  <span>Estimated delivery: 2–3 business days</span>
                </div>
              </div>
            </div>
          </section>

          {/* Step 3: Cart Items Snapshot Review */}
          <section className="rounded-3xl border border-border/80 bg-card p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  3
                </span>
                <h3 className="text-base font-bold text-foreground">
                  Review Items ({cart.totalItems})
                </h3>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs h-8 text-primary">
                <Link href="/app/shop/cart">Edit Cart</Link>
              </Button>
            </div>

            <div className="divide-y divide-border/60">
              {cart.items.map((item) => (
                <div
                  key={item.productId}
                  className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-surface shrink-0 border border-border/60">
                      <Image
                        src={item.image || FALLBACK_PRODUCT_IMAGE}
                        alt={item.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Qty: {item.quantity} × {formatMoney(item.price)}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs font-bold text-foreground whitespace-nowrap">
                    {formatMoney(item.lineTotal)}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Step 4: Payment Gateway (Razorpay Exclusive) */}
          <section className="rounded-3xl border border-border/80 bg-card p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  4
                </span>
                <h3 className="text-base font-bold text-foreground">
                  Payment Gateway
                </h3>
              </div>
              <Badge
                variant="outline"
                className="text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25"
              >
                100% Secure • 0% Fee
              </Badge>
            </div>

            <div className="rounded-2xl border-2 border-primary/30 bg-primary/[0.03] dark:bg-primary/[0.06] p-5 space-y-4 relative overflow-hidden">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                      <span>Razorpay Secure Standard Checkout</span>
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold">
                        Official Gateway
                      </Badge>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      All payment methods are processed & verified directly through Razorpay with HMAC-SHA256 signature verification.
                    </p>
                  </div>
                </div>
              </div>

              {/* Supported payment channels badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="rounded-xl border border-border/70 bg-card p-2.5 flex items-center gap-2 text-xs">
                  <UpiIcon className="h-4 w-4 shrink-0 text-emerald-600" />
                  <div className="min-w-0">
                    <p className="font-bold text-foreground truncate">Instant UPI</p>
                    <p className="text-[10px] text-muted-foreground truncate">GPay, PhonePe, QR</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border/70 bg-card p-2.5 flex items-center gap-2 text-xs">
                  <CreditCard className="h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="font-bold text-foreground truncate">Cards</p>
                    <p className="text-[10px] text-muted-foreground truncate">Visa, Master, RuPay</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border/70 bg-card p-2.5 flex items-center gap-2 text-xs">
                  <Building2 className="h-4 w-4 shrink-0 text-amber-600" />
                  <div className="min-w-0">
                    <p className="font-bold text-foreground truncate">Net Banking</p>
                    <p className="text-[10px] text-muted-foreground truncate">50+ Indian Banks</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border/70 bg-card p-2.5 flex items-center gap-2 text-xs">
                  <Lock className="h-4 w-4 shrink-0 text-sky-600" />
                  <div className="min-w-0">
                    <p className="font-bold text-foreground truncate">Wallets</p>
                    <p className="text-[10px] text-muted-foreground truncate">Paytm & more</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Price Breakdown & Place Order CTA */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-24 space-y-4">
          <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-5 shadow-sm">
            <h3 className="text-base font-bold text-foreground border-b border-border/60 pb-3 flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-xs font-medium text-muted-foreground">
                {cart.totalItems} items
              </span>
            </h3>

            {/* Calculations Breakdown */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-semibold text-foreground">
                  {formatMoney(cart.subtotal)}
                </span>
              </div>

              {cart.discount > 0 && (
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                  <span>
                    Promo Discount {cart.promoCode ? `(${cart.promoCode})` : ""}
                  </span>
                  <span className="font-semibold">
                    -{formatMoney(cart.discount)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-muted-foreground">
                <span>Estimated Express Shipping</span>
                <span className="font-semibold text-foreground">
                  {cart.deliveryFee === 0 ? "FREE" : formatMoney(cart.deliveryFee)}
                </span>
              </div>

              <Separator className="my-2" />

              <div className="flex items-baseline justify-between text-base font-bold text-foreground">
                <span>Total Amount</span>
                <span className="text-xl font-black text-primary">
                  {formatMoney(cart.total)}
                </span>
              </div>
            </div>

            {/* Address reminder if not selected */}
            {!selectedAddress && (
              <div className="rounded-xl bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2 border border-amber-500/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Please select a delivery address above to place order.</span>
              </div>
            )}

            {/* Selected Method Summary Badge */}
            <div className="rounded-2xl bg-surface/80 border border-border/70 p-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Payment Gateway:</span>
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-primary" />
                <span>Razorpay (UPI, Cards, NetBanking)</span>
              </span>
            </div>

            {/* Place Order CTA Button */}
            <Button
              size="lg"
              className="w-full rounded-2xl h-12 font-bold shadow-md text-sm gap-2"
              disabled={!selectedAddress || isCreatingOrder || isProcessingPayment}
              onClick={handlePlaceOrderClick}
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{paymentStepText || "Connecting to Razorpay..."}</span>
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  <span>Pay with Razorpay ({formatMoney(cart.total)})</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            {/* In-House Guarantee Note */}
            <div className="pt-2 text-[11px] text-muted-foreground space-y-1.5 border-t border-border/50">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Razorpay Secure Standard Checkout</span>
              </div>
              <p className="leading-relaxed">
                Payments are securely processed via Razorpay with HMAC-SHA256 server verification. Test Mode active.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
