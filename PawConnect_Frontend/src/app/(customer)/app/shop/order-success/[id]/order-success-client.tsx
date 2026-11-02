"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { useOrder } from "@/lib/api/hooks";
import { formatMoney } from "@/lib/utils/money";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/shared/states";
import {
  CheckCircle2,
  Package,
  Truck,
  ShoppingBag,
  MapPin,
} from "lucide-react";

interface OrderSuccessClientProps {
  orderId: string;
}

const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&auto=format&fit=crop&q=80";

export function OrderSuccessClient({ orderId }: OrderSuccessClientProps) {
  const { data: order, isLoading } = useOrder(orderId);

  if (isLoading) {
    return (
      <div className="py-8">
        <LoadingState variant="detail" message="Retrieving order confirmation..." />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <h2 className="text-xl font-bold text-foreground">Order Not Found</h2>
        <p className="text-sm text-muted-foreground">
          We could not locate this order reference. It may have been cleared or the ID is incorrect.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/app/orders">View My Orders</Link>
          </Button>
          <Button asChild className="rounded-xl">
            <Link href="/app/shop">Return to Shop</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 sm:py-12 space-y-8">
      {/* Success Hero Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="rounded-[32px] border border-border/80 bg-card p-6 sm:p-10 text-center space-y-5 shadow-sm"
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 ring-8 ring-emerald-500/10">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-semibold text-xs">
            Payment Verified & Confirmed
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Thank you for your order!
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Your in-house order has been received by our central fulfillment hub and is currently being packed with care.
          </p>
        </div>

        {/* Order Details Strip */}
        <div className="rounded-2xl border border-border/70 bg-surface/50 p-4 text-xs flex flex-wrap items-center justify-around gap-4 text-left">
          <div>
            <span className="text-muted-foreground block text-[11px]">Order Number</span>
            <span className="font-mono font-bold text-foreground text-sm">
              {order.orderNumber}
            </span>
          </div>

          <div>
            <span className="text-muted-foreground block text-[11px]">Total Paid</span>
            <span className="font-bold text-foreground text-sm">
              {formatMoney(order.total)}
            </span>
          </div>

          <div>
            <span className="text-muted-foreground block text-[11px]">Estimated Delivery</span>
            <span className="font-semibold text-foreground text-sm flex items-center gap-1">
              <Truck className="h-3.5 w-3.5 text-primary" />
              {order.estimatedDelivery}
            </span>
          </div>
        </div>

        {/* Delivery Address & Items Snapshot */}
        <div className="text-left space-y-4 pt-2">
          <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/50 p-4">
            <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-foreground">
                Shipping to {order.deliveryAddress.recipientName} ({order.deliveryAddress.label})
              </p>
              <p className="text-muted-foreground">
                {order.deliveryAddress.street}, {order.deliveryAddress.city},{" "}
                {order.deliveryAddress.state} {order.deliveryAddress.zipCode}
              </p>
              <p className="text-muted-foreground">Phone: {order.deliveryAddress.phone}</p>
            </div>
          </div>

          {/* Items Preview */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Ordered Items ({order.itemCount})
            </span>
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div
                  key={`${item.productId}-${idx}`}
                  className="flex items-center justify-between text-xs py-2 border-b border-border/40 last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative h-11 w-11 rounded-xl overflow-hidden bg-surface shrink-0 border border-border/60">
                      <Image
                        src={item.image || FALLBACK_PRODUCT_IMAGE}
                        alt={item.name}
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate">
                        {item.name}
                      </p>
                      <p className="text-muted-foreground text-[11px]">
                        Qty: {item.quantity} × {formatMoney(item.price)}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-foreground shrink-0">
                    {formatMoney(item.lineTotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto rounded-2xl font-bold shadow-xs text-xs h-11 gap-2"
          >
            <Link href={`/app/orders/${order.id}`}>
              <Package className="h-4 w-4" />
              View Order Details & Status
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full sm:w-auto rounded-2xl font-semibold text-xs h-11 gap-2"
          >
            <Link href="/app/shop">
              <ShoppingBag className="h-4 w-4" />
              Continue Shopping
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
