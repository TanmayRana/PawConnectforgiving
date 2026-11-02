"use client";

import * as React from "react";
import { Check, Package, Truck, CheckCircle2, Ban, Clock } from "lucide-react";
import type { OrderTimelineStep, OrderStatus } from "@/lib/mock/orders";
import { cn } from "@/lib/utils";

interface OrderTimelineProps {
  timeline: OrderTimelineStep[];
  currentStatus: OrderStatus;
  className?: string;
}

export function OrderTimeline({
  timeline,
  currentStatus,
  className,
}: OrderTimelineProps) {
  if (currentStatus === "cancelled") {
    return (
      <div className={cn("p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive", className)}>
        <Ban className="h-5 w-5 shrink-0" />
        <div>
          <p className="text-sm font-bold">This Order Has Been Cancelled</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            The full amount has been refunded to your original payment method.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative flex flex-col sm:flex-row justify-between gap-6 sm:gap-2">
        {timeline.map((step, idx) => {
          const isDone = step.done;
          const isCurrent = step.current;

          return (
            <div
              key={step.status}
              className="relative flex items-start sm:items-center sm:flex-col sm:text-center flex-1 gap-3 sm:gap-2"
            >
              {/* Connector line for desktop */}
              {idx < timeline.length - 1 && (
                <div
                  className={cn(
                    "hidden sm:block absolute top-4 left-1/2 w-full h-0.5 z-0",
                    isDone && timeline[idx + 1]?.done
                      ? "bg-primary"
                      : "bg-border"
                  )}
                  style={{ width: "100%" }}
                />
              )}

              {/* Step Icon Badge */}
              <div
                className={cn(
                  "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-[color,background-color,border-color,box-shadow] duration-200 motion-reduce:transition-none",
                  isDone
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : isCurrent
                    ? "border-primary bg-background text-primary ring-4 ring-primary/20 animate-pulse"
                    : "border-border bg-surface text-muted-foreground/60"
                )}
              >
                {step.status === "pending" ? (
                  <Clock className="h-4 w-4" />
                ) : step.status === "confirmed" ? (
                  <Check className="h-4 w-4" />
                ) : step.status === "packed" ? (
                  <Package className="h-4 w-4" />
                ) : step.status === "shipped" ? (
                  <Truck className="h-4 w-4" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
              </div>

              {/* Step Content */}
              <div className="space-y-0.5 min-w-0">
                <p
                  className={cn(
                    "text-xs font-bold",
                    isDone || isCurrent ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </p>
                {step.timestamp && (
                  <p className="text-[11px] text-muted-foreground font-medium">
                    {step.timestamp}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground/80 leading-relaxed hidden sm:block">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
