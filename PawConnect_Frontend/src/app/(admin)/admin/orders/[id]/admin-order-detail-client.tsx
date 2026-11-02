"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAdminOrder, useUpdateAdminOrderStatus } from "@/lib/api/hooks";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { OrderStatusDialog } from "@/components/admin/order-status-dialog";
import { ShippingLabelModal } from "@/components/admin/shipping-label-modal";
import { InvoiceModal } from "@/components/shared/invoice-modal";
import { LoadingState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatMoney } from "@/lib/utils/money";
import { formatDateTime } from "@/lib/utils/date";
import { toast } from "@/lib/utils/toast";
import {
  ArrowLeft,
  CreditCard,
  MapPin,
  Edit2,
  FileText,
  Receipt,
  Truck,
  Copy,
  Check,
  PackageCheck,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import type { OrderStatus } from "@/lib/mock/orders";
import type { UpdateOrderStatusOptions } from "@/lib/api/admin";

interface AdminOrderDetailClientProps {
  orderId: string;
}

export function AdminOrderDetailClient({ orderId }: AdminOrderDetailClientProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [shippingLabelOpen, setShippingLabelOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [copiedAwb, setCopiedAwb] = useState(false);

  const { data: order, isLoading, isError } = useAdminOrder(orderId);
  const { mutateAsync: updateStatus, isPending: isUpdating } = useUpdateAdminOrderStatus();

  if (isLoading) {
    return (
      <div className="py-8">
        <LoadingState variant="detail" message="Loading order fulfillment details..." />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="py-12">
        <ErrorState
          title="Order Not Found"
          description="Could not locate customer order details for this reference."
          action={
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/admin/orders">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Orders
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  const handleUpdateStatus = async (
    id: string,
    status: OrderStatus,
    options?: UpdateOrderStatusOptions | string
  ) => {
    try {
      const payload = typeof options === "string" ? { note: options } : options || {};
      await updateStatus({ orderId: id, status, ...payload });
      toast.success("Order Status Updated", {
        description: `Order #${order.orderNumber} transitioned to '${status}'.`,
      });
      setDialogOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update order status.";
      toast.error("Update Failed", { description: msg });
    }
  };

  const awb = order.awbNumber || order.trackingNumber;
  const courier = order.courierPartner || (order.status === "shipped" || order.status === "delivered" ? "PawConnect Express" : null);

  const handleCopyAwb = () => {
    if (awb) {
      navigator.clipboard.writeText(awb);
      setCopiedAwb(true);
      toast.success("AWB Copied to Clipboard");
      setTimeout(() => setCopiedAwb(false), 2000);
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-5xl">
      {/* Header */}
      <div>
        <Button asChild variant="ghost" size="sm" className="rounded-xl text-xs text-muted-foreground mb-3 -ml-2">
          <Link href="/admin/orders">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Back to Orders List
          </Link>
        </Button>

        <PageHeader
          title={`Order #${order.orderNumber}`}
          description={`Placed on ${order.date || order.createdAt} by ${order.deliveryAddress.recipientName}`}
        >
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} size="lg" />

            {/* View & Print Tax Invoice */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInvoiceModalOpen(true)}
              className="rounded-xl text-xs font-semibold h-9 gap-1.5"
            >
              <Receipt className="h-4 w-4 text-primary" />
              Tax Invoice
            </Button>

            {/* View & Print Shipping Label */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShippingLabelOpen(true)}
              className="rounded-xl text-xs font-semibold h-9 gap-1.5"
            >
              <FileText className="h-4 w-4 text-primary" />
              Shipping Label
            </Button>

            {/* Manage Dispatch / Status */}
            <Button
              onClick={() => setDialogOpen(true)}
              size="sm"
              className="rounded-xl text-xs font-semibold h-9 gap-1.5"
            >
              <Edit2 className="h-4 w-4" />
              Manage Dispatch
            </Button>
          </div>
        </PageHeader>
      </div>

      {/* Fulfillment Timeline Progress */}
      <Card className="p-6 sm:p-8 rounded-3xl border-border/80 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Live Fulfillment Pipeline
        </h3>
        <OrderTimeline timeline={order.timeline} currentStatus={order.status} />
      </Card>

      {/* Courier & Dispatch Manifest Card */}
      {(courier || awb || order.shippingLabelNumber) && (
        <Card className="rounded-3xl border-border/80 p-6 shadow-2xs space-y-4 bg-muted/20">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Logistics & Dispatch Manifest
              </h3>
            </div>
            <Badge variant="outline" className="font-mono text-[10px] uppercase">
              {courier || "PawConnect Express"}
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">AWB Tracking Code</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-foreground">{awb || "Pending Generation"}</span>
                {awb && (
                  <button
                    type="button"
                    onClick={handleCopyAwb}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Copy AWB"
                  >
                    {copiedAwb ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Shipping Label Ref</span>
              <p className="font-mono font-bold text-foreground">
                {order.shippingLabelNumber || `SL-PC-${order.id}-001`}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Weight & Dimensions</span>
              <p className="font-medium text-foreground">
                {order.packageWeightKg || 0.5} kg • {order.packageDimensions || "25x20x15 cm"}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Est. Delivery</span>
              <p className="font-medium text-foreground">
                {order.estimatedDeliveryDate || "In 3-4 days"}
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
                  <span className="font-semibold text-muted-foreground">Delivery / Handover Note: </span>
                  &ldquo;{order.dispatchNotes}&rdquo;
                </p>
              )}
            </div>
          ) : order.dispatchNotes ? (
            <div className="pt-2 border-t border-border/40 text-xs">
              <span className="text-muted-foreground font-semibold">Dispatch Remarks: </span>
              <span className="text-foreground">{order.dispatchNotes}</span>
            </div>
          ) : null}
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Purchased Products */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="rounded-3xl border-border/80 p-6 space-y-4 shadow-2xs">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Item Price Snapshots ({order.items.length})
            </h3>

            <div className="divide-y divide-border/60">
              {order.items.map((item) => (
                <div key={item.productId} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative h-14 w-14 rounded-2xl overflow-hidden bg-secondary shrink-0 border border-border">
                      <Image
                        src={
                          item.image ||
                          "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&auto=format&fit=crop&q=80"
                        }
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-foreground text-xs sm:text-sm truncate">
                        {item.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Quantity: <span className="font-semibold text-foreground">{item.quantity}</span> • Unit Price: {formatMoney(item.price)}
                      </p>
                    </div>
                  </div>

                  <span className="font-bold text-foreground text-sm shrink-0">
                    {formatMoney(item.lineTotal)}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="border-t border-border/60 pt-4 space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatMoney(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Promotional Discount</span>
                  <span>-{formatMoney(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Courier Delivery</span>
                <span>{order.deliveryFee === 0 ? "FREE" : formatMoney(order.deliveryFee)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-sm font-bold text-foreground">
                <span>Total Billed Amount</span>
                <span>{formatMoney(order.total)}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Delivery & Payment Details */}
        <div className="lg:col-span-4 space-y-6">
          {/* Destination Address */}
          <Card className="rounded-3xl border-border/80 p-5 space-y-3 shadow-2xs text-xs">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Destination Delivery Address
            </span>
            <div className="space-y-0.5">
              <p className="font-bold text-foreground text-sm">{order.deliveryAddress.recipientName}</p>
              <p className="text-muted-foreground">{order.deliveryAddress.street}</p>
              <p className="text-muted-foreground">
                {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipCode}
              </p>
              <p className="text-muted-foreground pt-1">{order.deliveryAddress.phone}</p>
            </div>
          </Card>

          {/* Payment Snapshot */}
          <Card className="rounded-3xl border-border/80 p-5 space-y-3 shadow-2xs text-xs">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-primary" />
              Payment Verification
            </span>
            <div className="flex items-center justify-between pt-1">
              <div className="space-y-0.5">
                <p className="font-bold text-foreground">
                  {order.paymentMethod}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Payment Status: {order.paymentStatus.toUpperCase()}
                </p>
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] font-bold ${
                  order.paymentStatus === "paid"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                }`}
              >
                {order.paymentStatus === "paid" ? "Paid & Captured" : "Payment Pending"}
              </Badge>
            </div>
          </Card>
        </div>
      </div>

      {/* Order Dispatch & Status Dialog */}
      <OrderStatusDialog
        order={order}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpdateStatus={handleUpdateStatus}
        loading={isUpdating}
      />

      {/* Official Shipping Label Modal */}
      <ShippingLabelModal
        order={order}
        open={shippingLabelOpen}
        onOpenChange={setShippingLabelOpen}
      />

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
