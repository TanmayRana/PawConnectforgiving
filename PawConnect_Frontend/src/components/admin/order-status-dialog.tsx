"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogBody,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Truck,
  Sparkles,
  ShieldAlert,
  Scale,
  Box,
  Calendar,
} from "lucide-react";
import type { CustomerOrder, OrderStatus } from "@/lib/mock/orders";
import type { UpdateOrderStatusOptions } from "@/lib/api/admin";

interface OrderStatusDialogProps {
  order: CustomerOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (
    orderId: string,
    status: OrderStatus,
    options?: UpdateOrderStatusOptions | string
  ) => Promise<void> | void;
  loading?: boolean;
}

const COURIER_OPTIONS = [
  "Delhivery",
  "BlueDart",
  "DTDC",
  "Ekart Logistics",
  "India Post",
  "PawConnect Express",
];

export function OrderStatusDialog({
  order,
  open,
  onOpenChange,
  onUpdateStatus,
  loading = false,
}: OrderStatusDialogProps) {
  const [overrideStatus, setOverrideStatus] = useState<OrderStatus | null>(null);
  const [courierPartner, setCourierPartner] = useState("PawConnect Express");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [packageWeightKg, setPackageWeightKg] = useState("0.50");
  const [packageDimensions, setPackageDimensions] = useState("25x20x15 cm");
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState("");
  const [note, setNote] = useState("");
  const [rootError, setRootError] = useState<string | null>(null);

  useEffect(() => {
    if (order) {
      setOverrideStatus(null);
      setCourierPartner(order.courierPartner || "PawConnect Express");
      setTrackingNumber(order.trackingNumber || order.awbNumber || "");
      setPackageWeightKg(
        order.packageWeightKg !== undefined ? String(order.packageWeightKg) : "0.50"
      );
      setPackageDimensions(order.packageDimensions || "25x20x15 cm");
      setEstimatedDeliveryDate(
        order.estimatedDeliveryDate ||
          new Date(Date.now() + 4 * 86400000).toISOString().split("T")[0]
      );
      setNote(order.dispatchNotes || "");
      setRootError(null);
    }
  }, [order, open]);

  if (!order) return null;

  const currentStatus = overrideStatus ?? order.status;
  const isDispatchPhase = currentStatus === "packed" || currentStatus === "shipped";
  const isPaid = order.paymentStatus === "paid";
  const requiresPayment = ["packed", "shipped", "delivered"].includes(currentStatus);
  const isPaymentBlocked = requiresPayment && !isPaid;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setOverrideStatus(null);
      setRootError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleAutoGenerateAwb = () => {
    const randomAwb = `AWBPC${Date.now() % 100000000}`;
    setTrackingNumber(randomAwb);
  };

  const handleSubmit = async () => {
    setRootError(null);
    if (isPaymentBlocked) {
      setRootError("Payment Guard: Cannot pack or ship an unpaid order. Payment must be PAID first.");
      return;
    }

    try {
      await onUpdateStatus(order.id, currentStatus, {
        notes: note.trim() || undefined,
        remarks: note.trim() || undefined,
        courierPartner: isDispatchPhase ? courierPartner : undefined,
        trackingNumber: isDispatchPhase && trackingNumber.trim() ? trackingNumber.trim() : undefined,
        packageWeightKg: isDispatchPhase && packageWeightKg ? parseFloat(packageWeightKg) : undefined,
        packageDimensions: isDispatchPhase && packageDimensions ? packageDimensions.trim() : undefined,
        estimatedDeliveryDate: isDispatchPhase && estimatedDeliveryDate ? estimatedDeliveryDate : undefined,
        autoGenerateAwb: isDispatchPhase && !trackingNumber.trim(),
      });
      setOverrideStatus(null);
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update order status. Please try again.";
      setRootError(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="default" className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Manage Order Dispatch #{order.orderNumber}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Update fulfillment lifecycle state, configure courier dispatch, and record AWB manifest.
              </DialogDescription>
            </div>
            <Badge
              variant="outline"
              className={
                isPaid
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
              }
            >
              {isPaid ? "PAID" : "UNPAID"}
            </Badge>
          </div>
        </DialogHeader>

        <DialogBody className="space-y-4 max-h-[70vh] overflow-y-auto p-4 sm:p-6">
          {rootError && (
            <div className="flex items-start gap-2.5 rounded-2xl bg-destructive/10 p-3.5 text-xs text-destructive border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Dispatch Action Blocked</p>
                <p>{rootError}</p>
              </div>
            </div>
          )}

          {isPaymentBlocked && (
            <div className="flex items-start gap-2.5 rounded-2xl bg-amber-500/10 p-3.5 text-xs text-amber-700 dark:text-amber-400 border border-amber-500/20">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
              <div className="space-y-1">
                <p className="font-semibold">Warehouse Payment Guard Enforced</p>
                <p>
                  This order has not been paid. Transitioning to <strong>{currentStatus.toUpperCase()}</strong> is prohibited until payment is authorized and verified.
                </p>
              </div>
            </div>
          )}

          {/* Fulfillment Status Selector */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground text-xs">Fulfillment Lifecycle State *</label>
            <Select
              value={currentStatus}
              onValueChange={(val: OrderStatus) => setOverrideStatus(val)}
            >
              <SelectTrigger className="rounded-xl h-10 text-xs">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending (Awaiting Payment)</SelectItem>
                <SelectItem value="confirmed">Confirmed (Pending Packing)</SelectItem>
                <SelectItem value="packed">Packed & Labeled (Ready to Dispatch)</SelectItem>
                <SelectItem value="shipped">Shipped / In-Transit</SelectItem>
                <SelectItem value="delivered">Delivered to Recipient</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Logistics & Dispatch Fields (Rendered when PACKED or SHIPPED) */}
          {isDispatchPhase && (
            <div className="rounded-2xl border border-border/80 bg-muted/30 p-4 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                <Truck className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Courier Dispatch & Logistics Manifest
                </h4>
              </div>

              {/* Courier Partner Selection */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground text-xs">Courier Partner *</label>
                <Select
                  value={courierPartner}
                  onValueChange={(val) => setCourierPartner(val)}
                >
                  <SelectTrigger className="rounded-xl h-9 text-xs bg-background">
                    <SelectValue placeholder="Select Courier Partner" />
                  </SelectTrigger>
                  <SelectContent>
                    {COURIER_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* AWB / Tracking Code with Auto-Generate Button */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-foreground text-xs">
                    AWB / Tracking Number
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAutoGenerateAwb}
                    className="h-6 px-2 text-[11px] gap-1 text-primary hover:text-primary hover:bg-primary/10 rounded-lg"
                  >
                    <Sparkles className="h-3 w-3" />
                    Auto-Generate AWB
                  </Button>
                </div>
                <Input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. AWBPC98240182 (or leave blank to auto-generate)"
                  className="rounded-xl h-9 text-xs bg-background"
                />
              </div>

              {/* Package Weight & Dimensions */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground text-xs flex items-center gap-1">
                    <Scale className="h-3 w-3 text-muted-foreground" />
                    Weight (kg)
                  </label>
                  <Input
                    type="number"
                    step="0.05"
                    min="0.05"
                    value={packageWeightKg}
                    onChange={(e) => setPackageWeightKg(e.target.value)}
                    placeholder="0.50"
                    className="rounded-xl h-9 text-xs bg-background"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground text-xs flex items-center gap-1">
                    <Box className="h-3 w-3 text-muted-foreground" />
                    Dimensions (L×W×H)
                  </label>
                  <Input
                    value={packageDimensions}
                    onChange={(e) => setPackageDimensions(e.target.value)}
                    placeholder="25x20x15 cm"
                    className="rounded-xl h-9 text-xs bg-background"
                  />
                </div>
              </div>

              {/* Estimated Delivery Date */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground text-xs flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  Estimated Delivery Date
                </label>
                <Input
                  type="date"
                  value={estimatedDeliveryDate}
                  onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                  className="rounded-xl h-9 text-xs bg-background"
                />
              </div>
            </div>
          )}

          {/* Dispatch Notes / Proof of Delivery (POD) */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground text-xs flex items-center justify-between">
              <span>
                {currentStatus === "delivered"
                  ? "Delivery Confirmation / Proof of Delivery (POD) Note"
                  : "Warehouse Handoff / Dispatch Notes (Optional)"}
              </span>
              {currentStatus === "delivered" && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                  POD Signature & Timestamp
                </span>
              )}
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                currentStatus === "delivered"
                  ? "e.g. Handed over to recipient at front desk. Signed by Sayan. Package received in sealed condition."
                  : "e.g. Package inspected, tamper seal applied, handover scan completed at dock 4..."
              }
              rows={3}
              className="rounded-xl text-xs resize-none"
            />
            {currentStatus === "delivered" && (
              <p className="text-[11px] text-muted-foreground">
                This Proof of Delivery note and delivery timestamp will be permanently logged on the customer and admin tracking consoles.
              </p>
            )}
          </div>
        </DialogBody>

        <DialogFooter className="flex-col sm:flex-row gap-2 border-t border-border pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenChange(false)}
            className="rounded-xl text-xs h-9"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={loading || isPaymentBlocked}
            className="rounded-xl text-xs font-semibold h-9 px-5 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Saving Dispatch..." : "Save & Update Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
