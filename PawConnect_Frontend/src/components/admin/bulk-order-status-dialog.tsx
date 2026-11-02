"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogBody,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Layers,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Truck,
  PackageCheck,
  Package,
} from "lucide-react";
import { useBulkUpdateAdminOrderStatus } from "@/lib/api/hooks";
import type { CustomerOrder, OrderStatus } from "@/lib/mock/orders";
import { toast } from "@/lib/utils/toast";

interface BulkOrderStatusDialogProps {
  orders: CustomerOrder[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AVAILABLE_STATUSES: {
  value: OrderStatus;
  label: string;
  description: string;
  requiresPayment: boolean;
}[] = [
  {
    value: "confirmed",
    label: "Confirmed",
    description: "Accept and confirm received customer orders",
    requiresPayment: false,
  },
  {
    value: "packed",
    label: "Packed (Ready for Dispatch)",
    description: "Items picked and packed at warehouse fulfillment center",
    requiresPayment: true,
  },
  {
    value: "shipped",
    label: "Shipped (Dispatched with Courier)",
    description: "Handed over to carrier partner with tracking",
    requiresPayment: true,
  },
  {
    value: "delivered",
    label: "Delivered (Completed)",
    description: "Package successfully handed to recipient",
    requiresPayment: true,
  },
  {
    value: "cancelled",
    label: "Cancelled",
    description: "Void orders and restore inventory stock",
    requiresPayment: false,
  },
];

export function BulkOrderStatusDialog({
  orders,
  open,
  onOpenChange,
  onSuccess,
}: BulkOrderStatusDialogProps) {
  const [targetStatus, setTargetStatus] = useState<OrderStatus>("packed");
  const [courierPartner, setCourierPartner] = useState("PawConnect Express");
  const [remarks, setRemarks] = useState("");

  const { mutateAsync: bulkUpdate, isPending } = useBulkUpdateAdminOrderStatus();

  const paidOrders = orders.filter((o) => o.paymentStatus === "paid");
  const unpaidOrders = orders.filter((o) => o.paymentStatus !== "paid");

  const selectedStatusConfig = AVAILABLE_STATUSES.find((s) => s.value === targetStatus);
  const requiresPayment = selectedStatusConfig?.requiresPayment ?? true;

  // If status requires payment, filter only paid orders to prevent backend validation exception
  const eligibleOrders = requiresPayment ? paidOrders : orders;
  const ineligibleOrders = requiresPayment ? unpaidOrders : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (eligibleOrders.length === 0) {
      toast.error("No Eligible Orders", {
        description: `Selected orders are unpaid and cannot be transitioned to '${targetStatus}'.`,
      });
      return;
    }

    try {
      const orderIds = eligibleOrders.map((o) => o.id);
      const res = await bulkUpdate({
        orderIds,
        status: targetStatus,
        courierPartner: targetStatus === "shipped" || targetStatus === "packed" ? courierPartner : undefined,
        remarks: remarks.trim() || `Bulk dispatch status updated to ${targetStatus}`,
      });

      if (res.updatedCount > 0) {
        toast.success("Bulk Status Update Complete", {
          description: `Successfully updated ${res.updatedCount} orders to '${targetStatus}'.${
            ineligibleOrders.length > 0
              ? ` (${ineligibleOrders.length} unpaid orders skipped)`
              : ""
          }`,
        });
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error("Bulk Update Incomplete", {
          description: res.skippedReasons[0] || "No orders were updated.",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to execute bulk update.";
      toast.error("Bulk Status Update Failed", { description: msg });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="default" className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Bulk Change Order Status
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Apply status progression and logistics notes to multiple orders at once.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4 py-2">
            {/* Selection Overview Banner */}
            <div className="rounded-xl border border-border bg-secondary/30 p-3 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="font-semibold text-foreground">
                  {orders.length} Total Orders Selected
                </span>
                <p className="text-[11px] text-muted-foreground">
                  {paidOrders.length} Paid (Eligible for dispatch) • {unpaidOrders.length} Unpaid
                </p>
              </div>
              <Badge variant="secondary" className="font-mono text-[11px]">
                {eligibleOrders.length} to update
              </Badge>
            </div>

            {/* Ineligible Warning if Unpaid Orders Selected for Dispatch */}
            {requiresPayment && unpaidOrders.length > 0 && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold block">
                    Financial Dispatch Guard Active
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    {unpaidOrders.length} of {orders.length} selected orders are unpaid. In compliance with store audit rules, unpaid orders cannot be packed or shipped and will be safely preserved.
                  </p>
                </div>
              </div>
            )}

            {/* Target Status Select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">New Fulfillment Status</Label>
              <Select
                value={targetStatus}
                onValueChange={(val) => setTargetStatus(val as OrderStatus)}
              >
                <SelectTrigger className="h-10 rounded-xl text-xs">
                  <SelectValue placeholder="Select target status" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_STATUSES.map((st) => (
                    <SelectItem key={st.value} value={st.value} className="text-xs">
                      <div className="py-0.5">
                        <span className="font-bold text-foreground block">{st.label}</span>
                        <span className="text-[10px] text-muted-foreground block">
                          {st.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Courier Partner (shown for packed/shipped) */}
            {(targetStatus === "packed" || targetStatus === "shipped") && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5 text-primary" />
                  Courier Partner
                </Label>
                <Select value={courierPartner} onValueChange={setCourierPartner}>
                  <SelectTrigger className="h-10 rounded-xl text-xs">
                    <SelectValue placeholder="Select carrier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PawConnect Express" className="text-xs">
                      PawConnect Express (Standard Central Dispatch)
                    </SelectItem>
                    <SelectItem value="Delhivery Logistics" className="text-xs">
                      Delhivery Surface & Express Air
                    </SelectItem>
                    <SelectItem value="BlueDart Express" className="text-xs">
                      BlueDart Priority Courier
                    </SelectItem>
                    <SelectItem value="Shadowfax Local" className="text-xs">
                      Shadowfax Same-Day / Hyperlocal
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Optional Dispatch Remarks */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Batch Dispatch Remarks (Optional)</Label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g., Handed over to morning transit vehicle at Kolkata FC"
                className="rounded-xl text-xs min-h-[64px]"
              />
            </div>
          </DialogBody>

          <DialogFooter className="border-t border-border pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs h-9"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending || eligibleOrders.length === 0}
              className="rounded-xl text-xs font-semibold h-9 px-5 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Updating {eligibleOrders.length} Orders...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Update {eligibleOrders.length} Orders to &apos;{selectedStatusConfig?.label}&apos;
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
