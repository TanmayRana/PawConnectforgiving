import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatMoney } from "@/lib/utils/money";
import { formatFriendlyDate } from "@/lib/utils/date";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Package, Calendar, Truck, FileText, CreditCard } from "lucide-react";
import { InvoiceModal } from "@/components/shared/invoice-modal";
import { PaymentCountdownBanner } from "@/components/shared/payment-countdown-banner";
import type { CustomerOrder } from "@/lib/mock/orders";

interface OrderCardProps {
  order: CustomerOrder;
}

export function OrderCard({ order }: OrderCardProps) {
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const visibleItems = order.items.slice(0, 3);
  const remainingCount = order.items.length - visibleItems.length;

  const isPaid = ["paid", "success", "refunded"].includes(
    (order.paymentStatus || "").toLowerCase()
  );
  const isDispatched = ["packed", "shipped", "delivered"].includes(
    (order.status || "").toLowerCase()
  );
  const courier = order.courierPartner || order.carrier || "PawConnect Express";
  const trackingCode = order.awbNumber || order.trackingNumber;

  const [mountTime] = useState(() => Date.now());
  const isPending = !isPaid && !["cancelled"].includes((order.status || "").toLowerCase());
  const hasPaymentWindow = Boolean(
    order.canRetryPayment ||
    (order.paymentExpiresAt && isPending && new Date(order.paymentExpiresAt).getTime() > mountTime)
  );

  return (
    <>
      <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 transition-[box-shadow,border-color] duration-200 hover:shadow-md hover:border-primary/30 motion-reduce:transition-none">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-border/60">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-foreground">
                {order.orderNumber}
              </span>
              <StatusBadge
                status={order.status}
                label={order.status === "pending" ? "Awaiting Payment" : undefined}
              />

              {/* Live 15-Minute Payment Window Compact Badge */}
              {hasPaymentWindow && (
                <PaymentCountdownBanner
                  compact
                  expiresAt={order.paymentExpiresAt}
                  remainingSecondsInitial={order.remainingPaymentSeconds}
                />
              )}

              {/* Live Courier & AWB Tracking Badge */}
              {isDispatched && trackingCode && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-primary/10 border border-primary/20 text-[11px] font-medium text-primary">
                  <Truck className="h-3 w-3 shrink-0" />
                  <span className="font-medium">{courier}:</span>
                  <span className="font-mono font-bold">{trackingCode}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>Placed {formatFriendlyDate(order.createdAt)}</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm font-semibold text-foreground">
              {formatMoney(order.total)}
            </div>
            <div className="text-xs text-muted-foreground">
              {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
            </div>
          </div>
        </div>

        {/* Item Previews & Details */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2 overflow-hidden py-1">
              {visibleItems.map((item, idx) => (
                <div
                  key={`${item.productId}-${idx}`}
                  className="relative h-12 w-12 rounded-xl overflow-hidden border-2 border-background bg-secondary/50 shrink-0 shadow-xs"
                  title={`${item.quantity}x ${item.name}`}
                >
                  <Image
                    src={
                      item.image ||
                      item.productImageUrl ||
                      "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&auto=format&fit=crop&q=80"
                    }
                    alt={item.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                  {item.quantity > 1 && (
                    <span className="absolute bottom-0 right-0 bg-black/85 text-white font-bold text-[9px] px-1 rounded-tl-sm z-10 leading-tight">
                      {item.quantity}x
                    </span>
                  )}
                </div>
              ))}
              {remainingCount > 0 && (
                <div className="relative h-12 w-12 rounded-xl border-2 border-background bg-secondary flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0 shadow-xs">
                  +{remainingCount}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground line-clamp-1">
                {order.items.map((i) => `${i.quantity > 1 ? `${i.quantity}× ` : ""}${i.name}`).join(", ")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {order.estimatedDelivery}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 sm:pt-0">
            {isPaid && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsInvoiceOpen(true);
                }}
                className="w-full sm:w-auto font-medium gap-1.5 text-xs h-9 rounded-xl"
                title="View & Print Official GST Tax Invoice"
              >
                <FileText className="h-3.5 w-3.5" />
                Tax Invoice
              </Button>
            )}

            {hasPaymentWindow && (
              <Button
                asChild
                size="sm"
                className="w-full sm:w-auto font-bold gap-1.5 text-xs h-9 rounded-xl shadow-xs"
              >
                <Link href={`/app/orders/${order.id}`}>
                  <CreditCard className="h-3.5 w-3.5" />
                  Pay Now
                </Link>
              </Button>
            )}

            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full sm:w-auto font-medium gap-1 text-xs h-9 rounded-xl"
            >
              <Link href={`/app/orders/${order.id}`}>
                <Package className="h-3.5 w-3.5 mr-1" />
                View Order
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Printable GST Tax Invoice Modal */}
      <InvoiceModal
        open={isInvoiceOpen}
        onOpenChange={setIsInvoiceOpen}
        invoiceType="ORDER"
        resourceId={order.id}
      />
    </>
  );
}
