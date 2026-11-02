"use client";

import React from "react";
import { createPortal } from "react-dom";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Printer,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  Barcode,
  ClipboardCheck,
  CheckSquare,
} from "lucide-react";
import {
  useShippingLabel,
  useBulkShippingLabels,
} from "@/lib/api/hooks";
import type { ShippingLabelResponse } from "@/lib/api/admin";
import type { CustomerOrder } from "@/lib/mock/orders";
import { formatMoney } from "@/lib/utils/money";
import { toast } from "@/lib/utils/toast";

export interface ShippingLabelModalProps {
  order?: CustomerOrder | null;
  orders?: CustomerOrder[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: "label" | "packing_slip";
}

/**
 * High-contrast CSS barcode representation
 * Generates alternating vertical bars patterned after standard Code 128 barcodes.
 */
function VisualBarcode({ value }: { value: string }) {
  const bars = React.useMemo(() => {
    const seed = value.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 17);
    const pattern: number[] = [];
    for (let i = 0; i < 48; i++) {
      pattern.push(((seed * (i + 1)) % 3) + 1);
    }
    return pattern;
  }, [value]);

  return (
    <div className="flex flex-col items-center justify-center p-0.5 bg-white">
      <div className="flex items-center justify-center gap-0.5 h-9 w-full max-w-[240px]">
        {bars.map((w, idx) => (
          <div
            key={idx}
            className="bg-black shrink-0"
            style={{
              width: `${w}px`,
              height: idx % 7 === 0 ? "100%" : "85%",
            }}
          />
        ))}
      </div>
      <span className="font-mono text-[10px] tracking-[0.2em] font-bold text-neutral-900 mt-0.5">
        *{value.toUpperCase()}*
      </span>
    </div>
  );
}

interface ShippingLabelSheetContentProps {
  activeMode: "label" | "packing_slip";
  order: CustomerOrder;
  awb: string;
  courier: string;
  invoice: string;
  labelNumber: string;
  weight: number;
  dimensions: string;
  recipientName: string;
  recipientPhone: string;
  recipientPin: string;
  recipientFullAddress: string;
  declaredValue: number;
}

function ShippingLabelSheetContent({
  activeMode,
  order,
  awb,
  courier,
  invoice,
  labelNumber,
  weight,
  dimensions,
  recipientName,
  recipientPhone,
  recipientPin,
  recipientFullAddress,
  declaredValue,
}: ShippingLabelSheetContentProps) {
  const orderItems = order.items || [];
  const distinctCount = orderItems.length;
  const totalUnits = orderItems.reduce((acc, it) => acc + (it.quantity || 1), 0);
  const labelItems = activeMode === "label" ? orderItems.slice(0, 3) : orderItems;
  const extraItemsCount = orderItems.length - labelItems.length;

  return (
    <div
      className={`shipping-label-sheet-content bg-white text-black border-2 border-black rounded-lg mx-auto ${
        activeMode === "label"
          ? "max-w-xl p-2 space-y-1.5 text-xs"
          : "max-w-3xl p-3 sm:p-4 space-y-3 text-xs"
      }`}
    >
      {activeMode === "label" ? (
        <>
          {/* TOP HEADER */}
          <div className="border-b-2 border-black pb-1 flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base tracking-tight text-black uppercase">
                  {courier}
                </span>
                <span className="bg-black text-white text-[8px] font-bold px-1.5 py-0.5 uppercase tracking-wider rounded">
                  EXPRESS
                </span>
              </div>
              <p className="text-[9px] text-neutral-600 leading-tight">
                PawConnect Central Logistics & Fulfillment Network
              </p>
            </div>

            <div className="text-right shrink-0">
              <div className="border-2 border-black px-1.5 py-0.5 bg-black text-white font-black text-[10px] uppercase tracking-wider">
                PREPAID
              </div>
              <span className="text-[7.5px] font-bold text-neutral-800 block mt-0.5">
                DO NOT COLLECT CASH
              </span>
            </div>
          </div>

          {/* PRIMARY AWB BARCODE */}
          <div className="border-b-2 border-black pb-1">
            <VisualBarcode value={awb} />
            <div className="flex justify-between items-center text-[9px] text-neutral-600 px-0.5 mt-0.5 font-mono">
              <span>
                AWB: <strong className="text-black">{awb}</strong>
              </span>
              <span>
                LABEL: <strong className="text-black">{labelNumber}</strong>
              </span>
              <span>
                ROUTING: <strong className="text-black">CCU-HUB-04</strong>
              </span>
            </div>
          </div>

          {/* SHIP TO & RETURN TO BOXES (Strict 8-col / 4-col side-by-side, no mobile stacking in 4x6 print) */}
          <div className="grid grid-cols-12 border-b-2 border-black divide-x-2 divide-black">
            {/* DELIVER TO (SHIP TO) - 8 Cols */}
            <div className="col-span-8 p-1.5 space-y-0.5">
              <span className="text-[8.5px] uppercase font-black tracking-wider text-neutral-500 block">
                DELIVER TO / SHIP TO:
              </span>
              <p className="font-black text-xs text-black uppercase leading-tight truncate">{recipientName}</p>
              <p className="text-[10px] text-neutral-800 leading-snug line-clamp-2">{recipientFullAddress}</p>
              <p className="text-[10px] font-semibold text-neutral-900">
                Phone: <span className="font-mono">{recipientPhone}</span>
              </p>
              <div className="flex items-baseline gap-1 pt-0.5">
                <span className="text-[8.5px] font-bold uppercase text-neutral-600">PIN:</span>
                <span className="font-black text-lg tracking-widest text-black font-mono">
                  {recipientPin}
                </span>
              </div>
            </div>

            {/* RETURN / SHIPPED BY - 4 Cols */}
            <div className="col-span-4 p-1.5 space-y-0.5 bg-neutral-50 text-[8.5px]">
              <span className="uppercase font-black tracking-wider text-neutral-500 block text-[8px]">
                RETURN / SHIPPED BY:
              </span>
              <p className="font-bold text-[9px] text-black">PawConnect Central FC</p>
              <p className="text-neutral-600 leading-tight">
                Sector V, Kolkata, WB - 700091
              </p>
              <p className="text-neutral-600 pt-0.5">
                GSTIN: <strong className="text-black font-mono">19AABCP1234C1Z5</strong>
              </p>
              <p className="text-neutral-600">
                Ph: <strong className="text-black font-mono">+91-33-4000-1234</strong>
              </p>
            </div>
          </div>

          {/* PACKAGE & ORDER METADATA GRID */}
          <div className="grid grid-cols-5 border-b-2 border-black divide-x-2 divide-black text-[8.5px] text-center bg-neutral-100/60">
            <div className="p-0.5">
              <span className="text-neutral-500 block text-[7.5px]">ORDER NO</span>
              <span className="font-bold text-black font-mono truncate block">{order.orderNumber}</span>
            </div>
            <div className="p-0.5">
              <span className="text-neutral-500 block text-[7.5px]">INVOICE NO</span>
              <span className="font-bold text-black font-mono truncate block">{invoice}</span>
            </div>
            <div className="p-0.5">
              <span className="text-neutral-500 block text-[7.5px]">PIECES</span>
              <span className="font-bold text-black font-mono">
                {totalUnits} {totalUnits === 1 ? "Unit" : "Units"}
              </span>
            </div>
            <div className="p-0.5">
              <span className="text-neutral-500 block text-[7.5px]">WEIGHT</span>
              <span className="font-bold text-black font-mono">{weight} kg</span>
            </div>
            <div className="p-0.5">
              <span className="text-neutral-500 block text-[7.5px]">DIMENSIONS</span>
              <span className="font-bold text-black font-mono truncate block">{dimensions}</span>
            </div>
          </div>

          {/* CONTENTS TABLE */}
          <div className="border-b-2 border-black pb-1">
            <div className="flex justify-between items-center mb-0.5 text-[8.5px]">
              <span className="font-black uppercase tracking-wider text-neutral-600">
                PACKAGE CONTENTS (
                {distinctCount === totalUnits
                  ? `${totalUnits} ${totalUnits === 1 ? "ITEM" : "ITEMS"}`
                  : `${totalUnits} UNITS • ${distinctCount} ITEMS`}
                )
              </span>
              <span className="font-bold text-neutral-800 font-mono">
                DECLARED: {formatMoney(declaredValue)}
              </span>
            </div>

            <table className="w-full text-[8.5px] border-collapse">
              <thead>
                <tr className="border-b border-neutral-300 text-neutral-500 text-left font-medium">
                  <th className="py-0.5">SKU / Item</th>
                  <th className="py-0.5 text-center w-8">Qty</th>
                  <th className="py-0.5 text-right w-16">Unit Price</th>
                  <th className="py-0.5 text-right w-16">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {labelItems.map((it, idx) => {
                  const uPrice = it.price || 0;
                  const lTotal = it.lineTotal || uPrice * (it.quantity || 1);
                  return (
                    <tr key={idx}>
                      <td className="py-0.5 pr-1 truncate max-w-[190px]">
                        <span className="font-mono text-neutral-500 mr-1">
                          SKU-PC{String(it.productId || idx + 1).padStart(4, "0")}
                        </span>
                        <strong className="text-neutral-900">{it.name}</strong>
                      </td>
                      <td className="py-0.5 text-center font-bold text-black font-mono">
                        {it.quantity}
                      </td>
                      <td className="py-0.5 text-right font-mono text-neutral-700">
                        {formatMoney(uPrice)}
                      </td>
                      <td className="py-0.5 text-right font-mono font-bold text-neutral-900">
                        {formatMoney(lTotal)}
                      </td>
                    </tr>
                  );
                })}
                {extraItemsCount > 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-0.5 text-[8px] text-neutral-500 italic text-center font-mono"
                    >
                      + {extraItemsCount} more item{extraItemsCount > 1 ? "s" : ""} (verified inside package)
                    </td>
                  </tr>
                )}
                {orderItems.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-0.5 text-[8px] text-neutral-500 italic text-center">
                      Standard Pet Care Order Fulfillment
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* FOOTER DISCLAIMER */}
          <div className="flex items-center justify-between text-[7.5px] text-neutral-500 pt-0.5 font-mono">
            <span>
              Shift Label Generated:{" "}
              {order.date || order.createdAt
                ? new Date(order.date || order.createdAt).toLocaleDateString()
                : new Date().toLocaleDateString()}
            </span>
            <span>Computer-generated manifest; no physical signature required.</span>
          </div>
        </>
      ) : (
        /* INNER PACKING SLIP / BILL OF SUPPLY */
        <div className="space-y-4">
          {/* PACKING SLIP HEADER */}
          <div className="border-b-2 border-black pb-3 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-black uppercase">
                  PAWCONNECT PACKING SLIP
                </span>
                <span className="bg-neutral-800 text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider rounded">
                  BILL OF SUPPLY
                </span>
              </div>
              <p className="text-[11px] text-neutral-600 mt-0.5">
                Central Fulfillment Center • Salt Lake Sector V, Kolkata, WB 700091
              </p>
              <p className="text-[10px] text-neutral-500 font-mono">
                GSTIN: 19AABCP1234C1Z5 • Support: hello@pawconnect.com
              </p>
            </div>

            <div className="text-right">
              <div className="font-mono text-sm font-black text-black">
                ORDER #{order.orderNumber}
              </div>
              <div className="text-[11px] text-neutral-700 font-mono font-bold">
                INVOICE: {invoice}
              </div>
              <div className="text-[10px] text-neutral-500 mt-0.5">
                Date:{" "}
                {order.date || order.createdAt
                  ? new Date(order.date || order.createdAt).toLocaleDateString("en-IN", {
                      dateStyle: "medium",
                    })
                  : new Date().toLocaleDateString("en-IN", { dateStyle: "medium" })}
              </div>
            </div>
          </div>

          {/* SHIP TO & LOGISTICS SUMMARY */}
          <div className="rounded-lg border-2 border-black p-3 bg-neutral-50 text-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                Deliver To / Consignee:
              </span>
              <strong className="text-black text-sm block mt-0.5">{recipientName}</strong>
              <span className="text-neutral-700 block leading-snug">{recipientFullAddress}</span>
              <span className="text-neutral-900 font-semibold text-xs block mt-1">
                Phone: <span className="font-mono">{recipientPhone}</span> • PIN:{" "}
                <span className="font-mono font-bold">{recipientPin}</span>
              </span>
            </div>

            <div className="text-left sm:text-right font-mono text-xs space-y-1 sm:border-l sm:pl-3 border-neutral-300">
              <div>
                <span className="text-neutral-500">Logistics Carrier: </span>
                <strong className="text-black">{courier}</strong>
              </div>
              <div>
                <span className="text-neutral-500">AWB Tracking: </span>
                <strong className="text-black font-bold">{awb}</strong>
              </div>
              <div>
                <span className="text-neutral-500">Package Details: </span>
                <strong>
                  {weight} kg • {dimensions}
                </strong>
              </div>
              <div>
                <span className="text-neutral-500">Payment Status: </span>
                <strong className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300">
                  PREPAID / VERIFIED
                </strong>
              </div>
            </div>
          </div>

          {/* WAREHOUSE PICK & PACK CHECKLIST WITH COMPLETE ITEM PRICING */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-black pb-1.5 border-b-2 border-black">
              <span>
                Order Items Verification ({totalUnits} {totalUnits === 1 ? "Unit" : "Units"} •{" "}
                {distinctCount} {distinctCount === 1 ? "Item" : "Items"})
              </span>
              <span className="text-[10px] font-normal text-neutral-600 lowercase font-mono">
                Mandatory Bill of Supply & QC Checklist
              </span>
            </div>

            <table className="w-full text-xs border-collapse mt-1">
              <thead>
                <tr className="border-b-2 border-black bg-neutral-100 text-neutral-700 text-left font-bold text-[10px] uppercase">
                  <th className="py-2 px-2 w-8 text-center">QC</th>
                  <th className="py-2 px-2">Item SKU & Description</th>
                  <th className="py-2 px-2 text-center w-16">Qty Ordered</th>
                  <th className="py-2 px-2 text-center w-16">Qty Packed</th>
                  <th className="py-2 px-2 text-right w-24">Unit Price</th>
                  <th className="py-2 px-2 text-right w-24">Line Total</th>
                  <th className="py-2 px-2 text-center w-20">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {orderItems.map((it, idx) => {
                  const unitPrice = it.price || 0;
                  const itemLineTotal = it.lineTotal || unitPrice * (it.quantity || 1);
                  return (
                    <tr key={idx} className="hover:bg-neutral-50/50">
                      <td className="py-2 px-2 text-center">
                        <span className="inline-block w-4 h-4 border-2 border-black rounded-xs"></span>
                      </td>
                      <td className="py-2 px-2">
                        <span className="font-mono text-[10px] text-neutral-500 mr-1.5 block">
                          SKU-PC{String(it.productId || idx + 1).padStart(4, "0")}
                        </span>
                        <strong className="text-black text-xs">{it.name}</strong>
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-black text-xs">
                        {it.quantity}
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-neutral-700 text-xs">
                        [ {it.quantity} ]
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-neutral-800">
                        {formatMoney(unitPrice)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-bold text-black">
                        {formatMoney(itemLineTotal)}
                      </td>
                      <td className="py-2 px-2 text-center text-[10px] text-emerald-700 font-bold">
                        ✓ Verified
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* FINANCIAL SUMMARY & PRODUCT COUNT CARD */}
          <div className="border-2 border-black rounded-lg p-3.5 bg-neutral-50 text-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Left: Product Counts & Supply Note */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500 block">
                Fulfillment & Product Count:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2 rounded border border-neutral-300">
                  <span className="text-neutral-500 text-[10px] block">Unique Line Items:</span>
                  <strong className="text-black font-mono text-base">{distinctCount}</strong>
                </div>
                <div className="bg-white p-2 rounded border border-neutral-300">
                  <span className="text-neutral-500 text-[10px] block">Total Units / Qty:</span>
                  <strong className="text-black font-mono text-base">{totalUnits}</strong>
                </div>
              </div>
              <p className="text-[10px] text-neutral-600 pt-0.5 leading-snug">
                Bill of Supply issued under Section 31(3)(c) of CGST Act, 2017. E-commerce logistics
                accompanying delivery manifest.
              </p>
            </div>

            {/* Right: Price & Tax Breakdown */}
            <div className="space-y-1.5 font-mono text-xs border-t sm:border-t-0 sm:border-l-2 sm:pl-4 border-neutral-300">
              <div className="flex justify-between text-neutral-700">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-black">
                  {formatMoney(order.subtotal || declaredValue)}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount Applied:</span>
                  <span>-{formatMoney(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-700">
                <span>Shipping & Handling:</span>
                <span className="font-semibold text-black">
                  {order.deliveryFee > 0 ? formatMoney(order.deliveryFee) : "FREE"}
                </span>
              </div>
              <div className="flex justify-between text-neutral-500 text-[10px]">
                <span>Taxes & GST (18% Included):</span>
                <span>{formatMoney(order.total ? (order.total * 0.18) / 1.18 : 0)}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-black text-black border-t-2 border-black pt-1.5 mt-1 font-sans">
                <span className="uppercase tracking-tight">Grand Total:</span>
                <span className="font-mono text-lg font-black text-black">
                  {formatMoney(order.total || declaredValue)}
                </span>
              </div>
              <div className="text-right pt-0.5">
                <span className="inline-block bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded font-sans uppercase tracking-wider">
                  PAID IN FULL • PREPAID VERIFIED
                </span>
              </div>
            </div>
          </div>

          {/* QUALITY CHECK & SIGN-OFF BOX */}
          <div className="border-t-2 border-black pt-2">
            <div className="grid grid-cols-2 gap-4">
              {/* Safety Standards Checklist */}
              <div className="space-y-1 text-[10px] text-neutral-700">
                <strong className="text-black uppercase block text-[10px] tracking-wider">
                  Warehouse QA Inspection Standards:
                </strong>
                <div className="flex items-center gap-1.5">
                  <CheckSquare className="h-3 w-3 text-black shrink-0" />
                  <span>All items inspected for seal integrity & damage</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckSquare className="h-3 w-3 text-black shrink-0" />
                  <span>Expiry dates verified (minimum 6 months validity)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckSquare className="h-3 w-3 text-black shrink-0" />
                  <span>Bubble wrap and protective cushioning applied</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckSquare className="h-3 w-3 text-black shrink-0" />
                  <span>Packing slip checklist inserted prior to carton sealing</span>
                </div>
              </div>

              {/* Sign-off Stamps */}
              <div className="border border-neutral-300 rounded p-2 text-[10px] space-y-1">
                <div className="flex justify-between border-b border-neutral-200 pb-1">
                  <span className="text-neutral-500">QC Inspector ID:</span>
                  <span className="font-mono font-bold">WH-KOL-QC09</span>
                </div>
                <div className="flex justify-between border-b border-neutral-200 pb-1">
                  <span className="text-neutral-500">Carton Tamper Seal:</span>
                  <span className="font-mono font-bold">TS-8849-OK</span>
                </div>
                <div className="pt-1.5 text-right">
                  <span className="text-[9px] text-neutral-400 block">Authorized Sign-off:</span>
                  <span className="font-mono font-bold text-neutral-800 tracking-wider">
                    [ PawConnect QA Certified ]
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RETURN POLICY DISCLAIMER */}
          <div className="border-t border-neutral-200 pt-2 text-[9px] text-neutral-500 leading-relaxed font-mono flex items-center justify-between">
            <span>
              PawConnect 7-Day Hassle-Free Returns & Replacements • support@pawconnect.care
            </span>
            <span>Package Quality Check Complete</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function ShippingLabelModal({
  order,
  orders,
  open,
  onOpenChange,
  initialMode = "label",
}: ShippingLabelModalProps) {
  const [mounted, setMounted] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [activeMode, setActiveMode] = React.useState<"label" | "packing_slip">(initialMode);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (open && initialMode) {
      setActiveMode(initialMode);
    }
  }, [open, initialMode]);

  // Determine whether this is a bulk operation or single order
  const isBatch = Boolean(orders && orders.length > 0);
  const selectedOrders: CustomerOrder[] = React.useMemo(() => {
    if (orders && orders.length > 0) return orders;
    if (order) return [order];
    return [];
  }, [orders, order]);

  // Single order query
  const singleOrderId = !isBatch && order ? order.id : null;
  const {
    data: singleLabelData,
    isLoading: isSingleLoading,
    isError: isSingleError,
  } = useShippingLabel(singleOrderId, open && !isBatch);

  // Batch query
  const batchOrderIds = React.useMemo(() => {
    return isBatch ? selectedOrders.map((o) => o.id) : [];
  }, [isBatch, selectedOrders]);

  const {
    data: bulkLabelsData = [],
    isLoading: isBulkLoading,
    isError: isBulkError,
  } = useBulkShippingLabels(batchOrderIds, open && isBatch);

  const isLoading = isBatch ? isBulkLoading : isSingleLoading;
  const isError = isBatch ? isBulkError : isSingleError;

  const totalUnitsAcrossSelected = React.useMemo(() => {
    return selectedOrders.reduce((sum, ord) => {
      const items = ord.items || [];
      return sum + items.reduce((iSum, it) => iSum + (it.quantity || 1), 0);
    }, 0);
  }, [selectedOrders]);

  // Manage body class for print styling isolation
  React.useEffect(() => {
    if (open && selectedOrders.length > 0) {
      document.body.classList.add("pawconnect-print-shipping-active");
    } else {
      document.body.classList.remove("pawconnect-print-shipping-active");
    }
    return () => {
      document.body.classList.remove("pawconnect-print-shipping-active");
    };
  }, [open, selectedOrders.length]);

  if (!open || selectedOrders.length === 0) return null;

  const resolveSheetProps = (
    ord: CustomerOrder,
    lData?: ShippingLabelResponse
  ): ShippingLabelSheetContentProps => {
    const awb =
      lData?.awbNumber ||
      ord.awbNumber ||
      ord.trackingNumber ||
      `AWBPC${ord.id}992`;

    const courier =
      lData?.courierPartner ||
      ord.courierPartner ||
      ord.carrier ||
      "PawConnect Express";

    const invoice =
      lData?.invoiceNumber ||
      ord.invoiceNumber ||
      `INV-ORD-${ord.id}`;

    const labelNumber =
      lData?.shippingLabelNumber ||
      ord.shippingLabelNumber ||
      `SL-PC-${ord.id}-001`;

    const weight =
      lData?.packageWeightKg !== undefined
        ? lData.packageWeightKg
        : ord.packageWeightKg || 0.5;

    const dimensions =
      lData?.packageDimensions ||
      ord.packageDimensions ||
      "25x20x15 cm";

    const addr = ord.deliveryAddress || ({} as Partial<typeof ord.deliveryAddress>);
    const recipientName =
      lData?.recipientName || addr?.recipientName || "Valued Customer";
    const recipientPhone =
      lData?.phone || addr?.phone || "+91-9876543210";
    const recipientPin =
      lData?.postalCode || addr?.zipCode || "700001";
    const recipientFullAddress =
      lData?.fullAddress ||
      [
        addr?.street,
        addr?.unit,
        addr?.city,
        addr?.state,
        addr?.zipCode,
      ]
        .filter(Boolean)
        .join(", ") || "Delivery Address on File";

    const declaredValue =
      lData?.declaredValue !== undefined
        ? lData.declaredValue
        : ord.total;

    return {
      activeMode,
      order: ord,
      awb,
      courier,
      invoice,
      labelNumber,
      weight,
      dimensions,
      recipientName,
      recipientPhone,
      recipientPin,
      recipientFullAddress,
      declaredValue,
    };
  };

  const allSheets = selectedOrders.map((ord) => {
    const numericId = Number(String(ord.id).replace(/\D/g, ""));
    const matchingData = isBatch
      ? bulkLabelsData.find((b) => b.orderId === numericId || b.orderNumber === ord.orderNumber)
      : singleLabelData;
    return {
      order: ord,
      sheetProps: resolveSheetProps(ord, matchingData),
    };
  });

  const firstAwb = allSheets[0]?.sheetProps.awb;


  const handlePrint = (modeOverride?: "label" | "packing_slip") => {
    const targetMode = modeOverride || activeMode;
    const originalTitle = document.title;
    if (isBatch) {
      document.title =
        targetMode === "label"
          ? `Batch-Shipping-Labels-${selectedOrders.length}-Orders`
          : `Batch-Packing-Slips-Bill-Of-Supply-${selectedOrders.length}-Orders`;
    } else {
      document.title =
        targetMode === "label"
          ? `Shipping-Label-${firstAwb || selectedOrders[0]?.orderNumber}`
          : `Packing-Slip-Bill-Of-Supply-${selectedOrders[0]?.orderNumber}`;
    }

    if (modeOverride && modeOverride !== activeMode) {
      setActiveMode(modeOverride);
    }

    // Force body class and visible overflow before launching print dialog
    document.body.classList.add("pawconnect-print-shipping-active");
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "visible";

    const cleanupPrint = () => {
      document.title = originalTitle;
      document.body.style.overflow = originalOverflow;
      if (!open) {
        document.body.classList.remove("pawconnect-print-shipping-active");
      }
      window.removeEventListener("afterprint", cleanupPrint);
    };

    window.addEventListener("afterprint", cleanupPrint);

    setTimeout(() => {
      window.print();
      setTimeout(cleanupPrint, 1500);
    }, 50);
  };

  const handleCopyAwb = () => {
    if (firstAwb) {
      navigator.clipboard.writeText(firstAwb);
      setCopied(true);
      toast.success("AWB Copied", { description: firstAwb });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      {/* Print Specific CSS to print 4x6 labels continuous with clean page breaks */}
      <style jsx global>{`
        @media print {
          @page {
            size: ${activeMode === "label" ? "100mm 150mm" : "A4 portrait"};
            margin: ${activeMode === "label" ? "2mm" : "8mm 10mm"};
          }

          body.pawconnect-print-shipping-active {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            background: #ffffff !important;
            color: #000000 !important;
          }

          /* Hide all page content except the dedicated shipping portal */
          body.pawconnect-print-shipping-active > *:not(#pawconnect-print-shipping-portal) {
            display: none !important;
          }

          /* Display the print portal in normal document flow so paged media breaks work */
          body.pawconnect-print-shipping-active #pawconnect-print-shipping-portal {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: ${activeMode === "label" ? "100mm" : "210mm"} !important;
            margin: 0 auto !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
          }

          .shipping-label-sheet-content {
            border-radius: 4px !important;
            box-shadow: none !important;
            padding: ${activeMode === "label" ? "6px 8px" : "16px"} !important;
            max-width: 100% !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            -webkit-column-break-inside: avoid !important;
            ${activeMode === "label" ? "max-height: 145mm !important; overflow: hidden !important;" : ""}
          }

          .shipping-label-print-page {
            display: block !important;
            width: 100% !important;
            max-width: ${activeMode === "label" ? "100mm" : "210mm"} !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            -webkit-column-break-inside: avoid !important;
            ${activeMode === "label" ? "max-height: 146mm !important; overflow: hidden !important;" : ""}
          }

          .shipping-label-print-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }

          #pawconnect-print-shipping-portal table {
            width: 100% !important;
            border-collapse: collapse !important;
          }

          #pawconnect-print-shipping-portal thead {
            display: table-header-group !important;
          }

          #pawconnect-print-shipping-portal tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          #pawconnect-print-shipping-portal * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }
        }

        @media screen {
          #pawconnect-print-shipping-portal {
            display: none !important;
          }
        }
      `}</style>

      {/* 1. DIRECT BODY PORTAL FOR PRINTING */}
      {mounted && open && selectedOrders.length > 0 && createPortal(
        <div id="pawconnect-print-shipping-portal">
          {allSheets.map(({ order: ord, sheetProps }, idx) => (
            <div
              key={ord.id}
              className="shipping-label-print-page"
              style={{
                pageBreakAfter: idx === allSheets.length - 1 ? "avoid" : "always",
                breakAfter: idx === allSheets.length - 1 ? "avoid" : "page",
              }}
            >
              <ShippingLabelSheetContent {...sheetProps} />
            </div>
          ))}
        </div>,
        document.body
      )}

      {/* 2. ON-SCREEN MODAL DIALOG */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent size="wide" className="max-w-4xl">
          <DialogHeader className="no-print">
            <div className="flex items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  {isBatch ? (
                    <>
                      {activeMode === "label"
                        ? 'Bulk Shipping Labels ("Shift Labels")'
                        : "Bulk Packing Slips & Bills of Supply"}
                      <Badge variant="secondary" className="font-semibold text-xs">
                        {selectedOrders.length} {selectedOrders.length === 1 ? "Order" : "Orders"} Selected
                        {" • "}
                        {totalUnitsAcrossSelected} {totalUnitsAcrossSelected === 1 ? "Unit" : "Units"}
                      </Badge>
                    </>
                  ) : (
                    <>
                      {activeMode === "label"
                        ? "Official Shipping Label (Shift Label)"
                        : "Packing Slip & Bill of Supply"}
                      <Badge variant="outline" className="font-mono text-[10px] uppercase">
                        Order #{selectedOrders[0]?.orderNumber}
                      </Badge>
                      <Badge variant="secondary" className="font-semibold text-xs">
                        {totalUnitsAcrossSelected} {totalUnitsAcrossSelected === 1 ? "Unit" : "Units"}
                      </Badge>
                    </>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {activeMode === "label"
                    ? "Continuous 4×6 inch thermal barcode sticky labels ready for batch printing and courier dispatch handoff."
                    : "Standard A4 format Bill of Supply with itemized pricing, GST summary, QC verification checklist, and inspection sign-off."}
                </DialogDescription>
              </div>

              {!isBatch && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyAwb}
                  className="rounded-xl text-xs h-8 gap-1.5 shrink-0"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>Copy AWB</span>
                </Button>
              )}
            </div>

            {/* Warehouse Dispatch Mode Toggle */}
            <div className="pt-3">
              <Tabs
                value={activeMode}
                onValueChange={(v) => setActiveMode(v as "label" | "packing_slip")}
                className="w-full"
              >
                <TabsList className="grid grid-cols-2 h-10 p-1 rounded-2xl bg-secondary/80">
                  <TabsTrigger
                    value="label"
                    className="rounded-xl text-xs font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground"
                  >
                    <Barcode className="h-3.5 w-3.5" />
                    Outer Shipping Label (4×6 Barcode)
                  </TabsTrigger>
                  <TabsTrigger
                    value="packing_slip"
                    className="rounded-xl text-xs font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground"
                  >
                    <ClipboardCheck className="h-3.5 w-3.5" />
                    Inner Packing Slip / Bill of Supply
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </DialogHeader>

          <DialogBody className="space-y-6 max-h-[75vh] overflow-y-auto p-4 sm:p-6">
            {isLoading && (
              <div className="flex items-center justify-center p-8 text-xs text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>
                  {isBatch
                    ? `Loading logistics manifest and batch labels for ${selectedOrders.length} orders...`
                    : "Loading latest courier manifest and label payload..."}
                </span>
              </div>
            )}

            {isError && (
              <div className="flex items-center gap-2.5 rounded-2xl bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Notice: Generating label snapshots from local order cache.</span>
              </div>
            )}

            {/* ON-SCREEN PREVIEWS */}
            <div className="space-y-6">
              {allSheets.map(({ order: ord, sheetProps }, idx) => (
                <div key={ord.id} className="space-y-2">
                  {isBatch && (
                    <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-1 pb-1 border-b border-border/40">
                      <span className="flex items-center gap-1.5 text-foreground">
                        <Barcode className="h-3.5 w-3.5 text-primary" />
                        Order {idx + 1} of {allSheets.length}: <strong>{ord.orderNumber}</strong>
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        AWB: {sheetProps.awb}
                      </span>
                    </div>
                  )}
                  <ShippingLabelSheetContent {...sheetProps} />
                </div>
              ))}
            </div>
          </DialogBody>

          <DialogFooter className="flex-col sm:flex-row items-center justify-between gap-3 no-print border-t border-border pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground w-full sm:w-auto">
              <span>Paper Format:</span>
              <Badge variant="outline" className="font-mono text-[10px] bg-secondary/40">
                {activeMode === "label" ? "4×6 Inch (100×150mm) Thermal" : "A4 Portrait (210×297mm)"}
              </Badge>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="rounded-xl text-xs h-9"
              >
                Close
              </Button>

              {/* Quick direct switch and print */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const target = activeMode === "label" ? "packing_slip" : "label";
                  setActiveMode(target);
                  handlePrint(target);
                }}
                className="rounded-xl text-xs h-9 gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>
                  {activeMode === "label"
                    ? `Print Slip (A4)`
                    : `Print Label (4×6)`}
                </span>
              </Button>

              {/* Primary Print Button */}
              <Button
                size="sm"
                onClick={() => handlePrint(activeMode)}
                className="rounded-xl text-xs font-semibold h-9 px-5 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              >
                <Printer className="h-4 w-4" />
                {activeMode === "label"
                  ? isBatch
                    ? `Print ${selectedOrders.length} Shipping ${selectedOrders.length === 1 ? "Label" : "Labels"} (4×6)`
                    : `Print Shipping Label (4×6)`
                  : isBatch
                  ? `Print ${selectedOrders.length} Packing ${selectedOrders.length === 1 ? "Slip" : "Slips"} (A4)`
                  : `Print Packing Slip (Bill of Supply)`}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
