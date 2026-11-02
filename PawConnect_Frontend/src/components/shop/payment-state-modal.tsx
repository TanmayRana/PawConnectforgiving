"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogBody,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, CheckCircle2, AlertCircle, Loader2, ShieldCheck, Banknote } from "lucide-react";
import { formatMoney } from "@/lib/utils/money";
import { cn } from "@/lib/utils";

interface PaymentStateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  onPaymentSuccess: (paymentMethod: string) => Promise<void> | void;
}

export function PaymentStateModal({
  open,
  onOpenChange,
  totalAmount,
  onPaymentSuccess,
}: PaymentStateModalProps) {
  const [selectedMethod, setSelectedMethod] = React.useState<"card" | "cod">("card");
  const [state, setState] = React.useState<"idle" | "processing" | "success" | "failed">("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleOpenChange = (newOpen: boolean) => {
    setState("idle");
    setErrorMessage(null);
    onOpenChange(newOpen);
  };

  const handleStartPayment = async () => {
    setState("processing");
    setErrorMessage(null);

    // Simulate dummy sandbox processing time
    await new Promise((r) => setTimeout(r, 1200));

    try {
      const methodName =
        selectedMethod === "card"
          ? "PawConnect Sandbox Test Card (•••• 4242)"
          : "Pay Upon Delivery (Test Dummy)";

      setState("success");
      await new Promise((r) => setTimeout(r, 600));
      await onPaymentSuccess(methodName);
    } catch {
      setState("failed");
      setErrorMessage("The test transaction could not be completed. Please retry.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={state === "processing" ? () => {} : handleOpenChange}>
      <DialogContent size="compact">
        <DialogHeader>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <ShieldCheck className="h-4 w-4" />
            <span>PawConnect Test Sandbox Checkout</span>
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            {state === "processing"
              ? "Authorizing Test Payment..."
              : state === "success"
              ? "Payment Successful!"
              : state === "failed"
              ? "Payment Failed"
              : "Complete Payment"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Simulation mode. No real credit card or bank credentials will be charged.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
        {/* ─── IDLE STATE ─── */}
        {state === "idle" && (
          <div className="space-y-5 pt-3">
            <div className="rounded-2xl bg-surface p-4 text-center border border-border/70">
              <span className="text-xs text-muted-foreground block mb-0.5">Total Amount Due</span>
              <span className="text-3xl font-extrabold text-foreground tabular-nums">
                {formatMoney(totalAmount)}
              </span>
            </div>

            {/* Payment method selector */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Select Dummy Payment Method
              </span>

              <div
                onClick={() => setSelectedMethod("card")}
                className={cn(
                  "flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-[background-color,border-color,box-shadow] duration-150 motion-reduce:transition-none",
                  selectedMethod === "card"
                    ? "border-primary bg-primary-soft/30 shadow-xs"
                    : "border-border/70 bg-white hover:bg-surface/60 dark:bg-card"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">PawConnect Test Card</p>
                    <p className="text-[11px] text-muted-foreground">•••• •••• •••• 4242 (Instant Approval)</p>
                  </div>
                </div>
                <div
                  className={cn(
                    "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                    selectedMethod === "card" ? "border-primary" : "border-muted-foreground/40"
                  )}
                >
                  {selectedMethod === "card" && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
              </div>

              <div
                onClick={() => setSelectedMethod("cod")}
                className={cn(
                  "flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-[background-color,border-color,box-shadow] duration-150 motion-reduce:transition-none",
                  selectedMethod === "cod"
                    ? "border-primary bg-primary-soft/30 shadow-xs"
                    : "border-border/70 bg-white hover:bg-surface/60 dark:bg-card"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                    <Banknote className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Pay Upon Delivery (Test)</p>
                    <p className="text-[11px] text-muted-foreground">No pre-payment required</p>
                  </div>
                </div>
                <div
                  className={cn(
                    "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                    selectedMethod === "cod" ? "border-primary" : "border-muted-foreground/40"
                  )}
                >
                  {selectedMethod === "cod" && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="button"
                onClick={handleStartPayment}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md"
              >
                Authorize & Place Order ({formatMoney(totalAmount)})
              </Button>
            </div>
          </div>
        )}

        {/* ─── PROCESSING STATE ─── */}
        {state === "processing" && (
          <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-foreground">Authorizing Sandbox Order...</p>
              <p className="text-xs text-muted-foreground">
                Connecting to in-house fulfillment queue. Please do not close this window.
              </p>
            </div>
          </div>
        )}

        {/* ─── SUCCESS STATE ─── */}
        {state === "success" && (
          <div className="flex flex-col items-center justify-center py-8 space-y-3 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 animate-in zoom-in-75" />
            <div className="space-y-1">
              <p className="text-base font-bold text-foreground">Payment Approved!</p>
              <p className="text-xs text-muted-foreground">Creating your order record...</p>
            </div>
          </div>
        )}

        {/* ─── FAILED STATE ─── */}
        {state === "failed" && (
          <div className="space-y-4 pt-3 text-center">
            <div className="flex flex-col items-center justify-center space-y-2">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="text-sm font-bold text-destructive">Payment Simulation Error</p>
              <p className="text-xs text-muted-foreground">{errorMessage}</p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl text-xs"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="w-full rounded-xl text-xs bg-primary text-primary-foreground font-bold"
                onClick={() => setState("idle")}
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
