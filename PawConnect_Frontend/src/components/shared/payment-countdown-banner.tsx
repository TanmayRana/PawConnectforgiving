"use client";

import React, { useState, useEffect, useRef } from "react";
import { Clock, AlertTriangle, RefreshCw, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils/money";
import { cn } from "@/lib/utils";

export interface PaymentCountdownBannerProps {
  expiresAt?: string | Date | null;
  remainingSecondsInitial?: number | null;
  onExpired?: () => void;
  onRetryPayment?: () => void;
  isRetrying?: boolean;
  amount?: number | null;
  orderId?: string | number | null;
  className?: string;
  compact?: boolean;
  viewOrderHref?: string;
}

export function PaymentCountdownBanner({
  expiresAt,
  remainingSecondsInitial,
  onExpired,
  onRetryPayment,
  isRetrying = false,
  amount,
  className,
  compact = false,
}: PaymentCountdownBannerProps) {
  const calculateRemainingSeconds = (): number => {
    if (expiresAt) {
      const targetTime = new Date(expiresAt).getTime();
      const now = Date.now();
      return Math.max(0, Math.floor((targetTime - now) / 1000));
    }
    if (typeof remainingSecondsInitial === "number") {
      return Math.max(0, remainingSecondsInitial);
    }
    return 0;
  };

  const [remainingSeconds, setRemainingSeconds] = useState<number>(calculateRemainingSeconds);
  const hasTriggeredExpired = useRef<boolean>(false);

  useEffect(() => {
    setRemainingSeconds(calculateRemainingSeconds());
    hasTriggeredExpired.current = false;
  }, [expiresAt, remainingSecondsInitial]);

  useEffect(() => {
    const timer = setInterval(() => {
      const nextRemaining = calculateRemainingSeconds();
      setRemainingSeconds(nextRemaining);

      if (nextRemaining === 0 && !hasTriggeredExpired.current) {
        hasTriggeredExpired.current = true;
        onExpired?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const isExpired = remainingSeconds <= 0;

  if (compact) {
    if (isExpired) {
      return (
        <Badge
          variant="outline"
          className={cn(
            "gap-1 border-destructive/40 bg-destructive/10 text-destructive text-xs font-semibold py-1 px-2.5 rounded-lg",
            className
          )}
        >
          <AlertTriangle className="h-3 w-3 shrink-0" />
          <span>Payment Window Expired</span>
        </Badge>
      );
    }

    return (
      <div className={cn("inline-flex items-center gap-2", className)}>
        <Badge
          variant="outline"
          className="gap-1.5 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono font-bold text-xs py-1 px-2.5 rounded-lg animate-pulse"
        >
          <Clock className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>Pay within {formattedTime}</span>
        </Badge>
        {onRetryPayment && (
          <Button
            type="button"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRetryPayment();
            }}
            disabled={isRetrying}
            className="h-7 text-xs font-semibold rounded-lg px-2.5 gap-1 shadow-2xs"
          >
            {isRetrying ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            Retry
          </Button>
        )}
      </div>
    );
  }

  // Full Banner Mode
  if (isExpired) {
    return (
      <div
        className={cn(
          "rounded-3xl border border-destructive/30 bg-destructive/5 p-5 sm:p-6 text-foreground transition-all duration-200 shadow-2xs",
          className
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-destructive/15 text-destructive mt-0.5">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-destructive">
                Payment Window Expired — Order Automatically Cancelled
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                The 15-minute re-payment window has elapsed. Unpaid items have been returned to inventory to ensure fair availability. Please initiate a fresh checkout to place your order.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-3xl border border-amber-500/40 bg-amber-500/10 dark:bg-amber-950/20 p-5 sm:p-6 text-foreground transition-all duration-200 shadow-2xs",
        className
      )}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-400 mt-0.5">
            <Clock className="h-5 w-5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-base font-bold text-amber-900 dark:text-amber-200">
                Payment Pending — Complete Within
              </h4>
              <Badge
                variant="outline"
                className="font-mono text-sm font-extrabold tracking-wider border-amber-600/50 bg-amber-600/20 text-amber-900 dark:text-amber-100 px-2.5 py-0.5 rounded-lg"
              >
                {formattedTime}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-amber-900/80 dark:text-amber-300/80 leading-relaxed max-w-2xl">
              Your items are reserved for you, but payment was not finalized. You can safely retry payment before the timer reaches 00:00 without losing your reserved items or creating duplicate orders.
            </p>
          </div>
        </div>

        {onRetryPayment && (
          <div className="flex items-center gap-3 shrink-0 self-stretch sm:self-auto">
            <Button
              type="button"
              onClick={onRetryPayment}
              disabled={isRetrying}
              className="w-full sm:w-auto h-11 px-5 rounded-2xl font-bold gap-2 text-sm shadow-md"
            >
              {isRetrying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting to Razorpay...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  <span>
                    Retry Payment Now {amount ? `(${formatMoney(amount)})` : ""}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
