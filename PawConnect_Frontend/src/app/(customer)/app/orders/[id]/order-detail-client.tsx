"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useOrder, useCancelOrder, useAddProductReview } from "@/lib/api/hooks";
import { createPaymentOrder, launchRazorpayCheckout, recordPaymentFailure } from "@/lib/api/payments";
import { PaymentCountdownBanner } from "@/components/shared/payment-countdown-banner";
import { formatMoney } from "@/lib/utils/money";
import { formatFriendlyDate, formatDateTime } from "@/lib/utils/date";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { ProductReviewModal } from "@/components/shop/product-review-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { InvoiceModal } from "@/components/shared/invoice-modal";
import { LoadingState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { showSuccess, showError } from "@/lib/utils/toast";
import type { RazorpayOrderResponse } from "@/lib/api/payments";
import {
  Package,
  CreditCard,
  MapPin,
  Star,
  Ban,
  ArrowLeft,
  ShieldCheck,
  Loader2,
  RefreshCw,
  Truck,
  Copy,
  Check,
  ExternalLink,
  FileText,
  CheckCircle2,
} from "lucide-react";
import type { OrderItem } from "@/lib/mock/orders";

interface OrderDetailClientProps {
  orderId: string;
}

export function OrderDetailClient({ orderId }: OrderDetailClientProps) {
  const { data: order, isLoading, isError, refetch } = useOrder(orderId);
  const { mutateAsync: cancelOrderMutation, isPending: isCancelling } = useCancelOrder();

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [reviewItem, setReviewItem] = useState<OrderItem | null>(null);
  const [isRetryingPayment, setIsRetryingPayment] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [copiedAwb, setCopiedAwb] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [mountTime] = useState(() => Date.now());

  const { mutateAsync: addReview, isPending: isSubmittingReview } =
    useAddProductReview();

  if (isLoading) {
    return (
      <div className="py-8">
        <LoadingState variant="detail" message="Loading order details..." />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="py-12">
        <ErrorState
          title="Order Not Found"
          description="We couldn't locate this order in our system."
          action={
            <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
              Retry
            </Button>
          }
        />
        <div className="text-center mt-6">
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/app/orders">View All Orders</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isDelivered = order.status === "delivered";
  const isCancellable = order.status === "confirmed" || order.status === "packed";

  const handleConfirmCancel = async () => {
    try {
      await cancelOrderMutation(order.id);
      await refetch();
      setCancelDialogOpen(false);
      showSuccess("Order Cancelled", "Your order has been cancelled and any payment has been refunded.");
    } catch {
      showError("Cancellation Failed", "Unable to cancel order at this stage. Please contact support.");
    }
  };

  const handleReviewSubmit = async (formData: { rating: number; comment: string }) => {
    if (!reviewItem) return;
    try {
      await addReview({
        productId: reviewItem.productId,
        authorName: "PawConnect Verified Buyer",
        rating: formData.rating,
        comment: formData.comment,
      });
      setReviewItem(null);
      showSuccess("Review Submitted", `Thank you for reviewing ${reviewItem.name}!`);
    } catch {
      showError("Review Submission Failed", "Please try again later.");
    }
  };

  const normalizedPaymentStatus = String(order.paymentStatus || "").toUpperCase();
  const isPaid = normalizedPaymentStatus === "PAID" || normalizedPaymentStatus === "SUCCESS";
  const isRefunded = normalizedPaymentStatus === "REFUNDED";
  const isFailed = normalizedPaymentStatus === "FAILED";
  const isPending = !isPaid && !isRefunded && !isFailed;
  const isCancelled = order.status === "cancelled";
  const isPendingStatus = order.status === "pending";

  const isWindowActive = Boolean(
    order.canRetryPayment ?? (
      order.paymentExpiresAt
        ? new Date(order.paymentExpiresAt).getTime() > mountTime
        : false
    )
  );
  const canPay = (order.canRetryPayment || isWindowActive || isPending) && !isPaid && !isCancelled;

  const handleCheckPaymentStatus = async () => {
    try {
      setIsCheckingStatus(true);
      await refetch();
      showSuccess("Payment Status Checked", "Order and payment status have been synchronized.");
    } catch {
      showError("Status Check Failed", "Unable to refresh payment status right now.");
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handlePayOrder = async () => {
    try {
      setIsRetryingPayment(true);
      const razorpayOrder = await createPaymentOrder({
        orderId: Number(order.id),
      });

      await launchRazorpayCheckout({
        order: razorpayOrder,
        preferredMethod: "all",
        onSuccess: async () => {
          setIsRetryingPayment(false);
          showSuccess("Payment Verified", "Your payment was confirmed and the order is now marked paid.");
          await refetch();
        },
        onDismiss: () => {
          setIsRetryingPayment(false);
          recordPaymentFailure({
            orderId: Number(order.id),
            reason: "Checkout dismissed by user",
          }).catch(() => {});
          showError("Payment Incomplete", "Payment was not completed. You have 15 minutes from order creation to complete payment.");
          refetch();
        },
        onError: (err) => {
          setIsRetryingPayment(false);
          const msg = err instanceof Error ? err.message : "Payment verification failed.";
          recordPaymentFailure({
            orderId: Number(order.id),
            reason: msg,
          }).catch(() => {});
          showError("Payment Failed", msg);
          refetch();
        },
      });
    } catch (err: unknown) {
      setIsRetryingPayment(false);
      const msg = err instanceof Error ? err.message : "Unable to initiate payment with Razorpay.";
      showError("Payment Order Failed", msg);
    }
  };

  const handleCopyAwb = () => {
    const code = order.awbNumber || order.trackingNumber;
    if (code) {
      navigator.clipboard.writeText(code);
      setCopiedAwb(true);
      showSuccess("AWB Copied", `Tracking number ${code} copied to clipboard.`);
      setTimeout(() => setCopiedAwb(false), 2000);
    }
  };

  const isDispatchPhase =
    order.status === "packed" ||
    order.status === "shipped" ||
    order.status === "delivered" ||
    Boolean(order.courierPartner) ||
    Boolean(order.awbNumber);

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        title={`Order ${order.orderNumber}`}
        description={`Placed on ${formatFriendlyDate(order.createdAt)} • ${order.itemCount} items`}
      />

      {/* 15-Minute Re-Payment Window Banner (Active Pending State) */}
      {(order.canRetryPayment || (isPendingStatus && order.paymentExpiresAt) || (isPending && order.paymentExpiresAt && isWindowActive)) && (
        <PaymentCountdownBanner
          expiresAt={order.paymentExpiresAt}
          remainingSecondsInitial={order.remainingPaymentSeconds}
          amount={order.total}
          orderId={order.id}
          isRetrying={isRetryingPayment}
          onRetryPayment={handlePayOrder}
          onExpired={async () => {
            showError("Payment Window Expired", "The 15-minute payment window has elapsed. The order has been automatically cancelled and stock restored.");
            await refetch();
          }}
        />
      )}

      {/* Expired Window & Cancelled Banner */}
      {isCancelled && !isPaid && !isRefunded && (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-5 sm:p-6 text-foreground shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-destructive/15 text-destructive mt-0.5">
              <Ban className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-destructive">
                Order Cancelled — Payment Window Expired
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                The 15-minute re-payment window elapsed without payment completion. Reserved items have been released back to available inventory. You can browse the shop to place a new order.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Status & Quick Action Card */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-6 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-foreground">
                  {order.orderNumber}
                </span>
                <StatusBadge
                  status={order.status}
                  label={order.status === "pending" ? "Awaiting Payment" : undefined}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Carrier: {order.courierPartner || order.carrier} • Tracking #{order.awbNumber || order.trackingNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isCancellable && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelDialogOpen(true)}
                disabled={isCancelling}
                className="text-xs text-destructive hover:bg-destructive/10 border-destructive rounded-xl"
              >
                <Ban className="h-3.5 w-3.5 mr-1" />
                Cancel Order
              </Button>
            )}
            {(isPaid || isRefunded) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInvoiceModalOpen(true)}
                className="text-xs rounded-xl gap-1.5"
              >
                <FileText className="h-3.5 w-3.5" />
                Tax Invoice
              </Button>
            )}
            <Button
              asChild
              variant="outline"
              size="sm"
              className="text-xs rounded-xl"
            >
              <Link href="/app/orders">
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Back to Orders
              </Link>
            </Button>
          </div>
        </div>

        {/* Timeline Progression */}
        <div className="pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
            Order Status & Fulfillment Journey
          </h3>
          <OrderTimeline
            timeline={order.timeline}
            currentStatus={order.status}
          />
        </div>

        {/* Live Shipment & Delivery Tracking Card (PACKED, SHIPPED, DELIVERED) */}
        {isDispatchPhase && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5 space-y-3.5 mt-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-primary/15">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                  <Truck className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Courier Dispatch & Live Shipment Tracking
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    In transit via <strong className="text-foreground">{order.courierPartner || order.carrier || "PawConnect Express"}</strong>
                  </p>
                </div>
              </div>

              {order.trackingUrl && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs rounded-xl gap-1.5 text-primary border-primary/30 hover:bg-primary/10"
                >
                  <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Track on Courier Portal
                  </a>
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">
                  AWB Tracking Code
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-foreground truncate max-w-[150px]">
                    {order.awbNumber || order.trackingNumber || "Pending Generation"}
                  </span>
                  {(order.awbNumber || order.trackingNumber) && (
                    <button
                      type="button"
                      onClick={handleCopyAwb}
                      className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      title="Copy AWB code"
                    >
                      {copiedAwb ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">
                  Estimated Delivery Date
                </span>
                <p className="font-medium text-foreground">
                  {order.estimatedDeliveryDate || order.estimatedDelivery}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">
                  Parcel Weight
                </span>
                <p className="font-medium text-foreground">
                  {order.packageWeightKg !== undefined ? `${order.packageWeightKg} kg` : "0.50 kg"}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">
                  Parcel Dimensions
                </span>
                <p className="font-medium text-foreground">
                  {order.packageDimensions || "25x20x15 cm"}
                </p>
              </div>
            </div>

            {order.status === "delivered" ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 space-y-1.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Proof of Delivery (POD) Confirmed</span>
                  </div>
                  {order.deliveredAt && (
                    <span className="text-[11px] font-normal text-muted-foreground font-mono">
                      Delivered at {formatDateTime(order.deliveredAt)}
                    </span>
                  )}
                </div>
                {order.dispatchNotes && (
                  <p className="text-[11px] text-foreground/90 pl-6 leading-relaxed">
                    <span className="font-semibold text-muted-foreground">Delivery Note / Handover: </span>
                    &ldquo;{order.dispatchNotes}&rdquo;
                  </p>
                )}
              </div>
            ) : order.dispatchNotes ? (
              <p className="text-[11px] text-muted-foreground border-t border-primary/10 pt-2 italic">
                Note: {order.dispatchNotes}
              </p>
            ) : null}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Order Items */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-4 shadow-2xs">
            <h3 className="text-base font-bold text-foreground border-b border-border/60 pb-3 flex items-center justify-between">
              <span>Purchased Items ({order.itemCount})</span>
              <span className="text-xs font-normal text-muted-foreground">
                Snapshot Unit Pricing
              </span>
            </h3>

            <div className="divide-y divide-border/60">
              {order.items.map((item, idx) => (
                <div
                  key={`${item.productId}-${idx}`}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <Link
                      href={`/app/shop/products/${item.productId}`}
                      className="relative h-16 w-16 rounded-2xl overflow-hidden bg-surface shrink-0 border border-border/60 hover:opacity-90"
                    >
                      <Image
                        src={
                          item.image ||
                          "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&auto=format&fit=crop&q=80"
                        }
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </Link>

                    <div className="space-y-1 min-w-0 flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        {item.category}
                      </span>
                      <Link
                        href={`/app/shop/products/${item.productId}`}
                        className="block hover:underline"
                      >
                        <h4 className="text-sm font-bold text-foreground truncate">
                          {item.name}
                        </h4>
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {formatMoney(item.price)} × {item.quantity}
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                    <span className="text-sm font-bold text-foreground">
                      {formatMoney(item.lineTotal)}
                    </span>

                    {/* Review Button if delivered */}
                    {isDelivered && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setReviewItem(item)}
                        className="text-[11px] h-7 px-2.5 rounded-lg gap-1 font-semibold text-primary"
                      >
                        <Star className="h-3 w-3" />
                        Write Review
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address & Delivery Summary Card */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-4 shadow-2xs">
            <h3 className="text-base font-bold text-foreground border-b border-border/60 pb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Delivery Destination
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-muted-foreground">Recipient</span>
                <p className="font-bold text-foreground text-sm">
                  {order.deliveryAddress.recipientName}
                </p>
                <p className="text-muted-foreground">
                  Address label: {order.deliveryAddress.label}
                </p>
                <p className="text-muted-foreground">
                  Phone: {order.deliveryAddress.phone}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-muted-foreground">Street Address</span>
                <p className="text-foreground leading-relaxed">
                  {order.deliveryAddress.street}
                  <br />
                  {order.deliveryAddress.city}, {order.deliveryAddress.state}{" "}
                  {order.deliveryAddress.zipCode}
                </p>
                {order.deliveryAddress.deliveryInstructions && (
                  <p className="text-muted-foreground italic pt-1">
                    &ldquo;{order.deliveryAddress.deliveryInstructions}&rdquo;
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Financial Breakdown & Payment Info */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4 sticky top-24">
          <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-5 shadow-2xs">
            <h3 className="text-base font-bold text-foreground border-b border-border/60 pb-3">
              Payment & Totals
            </h3>

            {/* Payment Details */}
            <div className="rounded-2xl border border-border/70 bg-surface/50 p-3.5 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span>{order.paymentMethod || "Razorpay Standard"}</span>
                </div>
                <Badge
                  variant={isPaid ? "default" : isRefunded ? "outline" : isFailed ? "destructive" : "secondary"}
                  className={`text-[10px] uppercase font-bold ${
                    isPaid
                      ? "bg-emerald-600 text-white dark:bg-emerald-700"
                      : isRefunded
                      ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30"
                      : isFailed
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {isPaid ? "PAID" : isRefunded ? "REFUNDED" : isFailed ? "FAILED" : "PENDING"}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isPaid
                  ? "Transaction cryptographically verified via Razorpay Standard Gateway."
                  : isRefunded
                  ? "Order cancelled. Payment has been refunded back to customer original source."
                  : isFailed
                  ? "Payment attempt failed at gateway. Please try paying again."
                  : "Payment has not yet been completed for this order."}
              </p>

              {order.orderNumber && (
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                  <span>Payment Reference ID:</span>
                  <span className="font-mono font-medium text-foreground">{order.orderNumber}</span>
                </div>
              )}

              {(isPaid || isRefunded) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setInvoiceModalOpen(true)}
                  className="w-full rounded-xl text-xs font-semibold gap-2 h-9"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Download GST Tax Invoice</span>
                </Button>
              )}

              {isPending && order.status !== "cancelled" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full text-xs font-medium text-muted-foreground hover:text-foreground h-8 gap-1.5"
                  disabled={isCheckingStatus}
                  onClick={handleCheckPaymentStatus}
                >
                  <RefreshCw className={`h-3 w-3 ${isCheckingStatus ? "animate-spin" : ""}`} />
                  <span>Check Payment Status</span>
                </Button>
              )}

              {canPay && (
                <div className="space-y-2 pt-1">
                  <Button
                    size="sm"
                    className="w-full rounded-xl text-xs font-bold gap-2 shadow-xs"
                    disabled={isRetryingPayment}
                    onClick={handlePayOrder}
                  >
                    {isRetryingPayment ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Opening Razorpay...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        <span>Pay with Razorpay ({formatMoney(order.total)})</span>
                      </>
                    )}
                  </Button>

                  <p className="text-[10px] text-center text-muted-foreground pt-0.5">
                    Official Razorpay Checkout (Instant UPI, Cards & NetBanking).
                  </p>
                </div>
              )}
            </div>

            {/* Financial Line Items */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-semibold text-foreground">
                  {formatMoney(order.subtotal)}
                </span>
              </div>

              {order.discount > 0 && (
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Discount</span>
                  <span className="font-semibold">
                    -{formatMoney(order.discount)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-muted-foreground">
                <span>Express Shipping</span>
                <span className="font-semibold text-foreground">
                  {order.deliveryFee === 0 ? "FREE" : formatMoney(order.deliveryFee)}
                </span>
              </div>

              <Separator className="my-2" />

              <div className="flex items-baseline justify-between text-base font-bold text-foreground">
                <span>Total Paid</span>
                <span className="text-xl font-black text-primary">
                  {formatMoney(order.total)}
                </span>
              </div>
            </div>

            {/* Trust badge */}
            <div className="pt-3 border-t border-border/60 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Fulfilled directly by PawConnect Central Depot</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Confirm Dialog */}
      <ConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancel this order?"
        description="Are you sure you wish to cancel this order? It will be stopped from processing and your cancellation request will be recorded."
        confirmLabel="Confirm Cancellation"
        variant="destructive"
        onConfirm={handleConfirmCancel}
      />

      {/* Review Modal for delivered item */}
      {reviewItem && (
        <ProductReviewModal
          open={Boolean(reviewItem)}
          onOpenChange={(open) => !open && setReviewItem(null)}
          productName={reviewItem.name}
          onSubmit={handleReviewSubmit}
          isSubmitting={isSubmittingReview}
        />
      )}

      {/* Official Universal GST Tax Invoice Modal */}
      <InvoiceModal
        open={invoiceModalOpen}
        onOpenChange={setInvoiceModalOpen}
        invoiceType="ORDER"
        resourceId={order.id}
      />
    </div>
  );
}
