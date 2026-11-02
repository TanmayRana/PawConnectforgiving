"use client";

import React, { useRef } from "react";
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
import { Separator } from "@/components/ui/separator";
import {
  Printer,
  AlertCircle,
  Loader2,
  FileText,
  CreditCard,
  Building,
  User,
  PawPrint,
} from "lucide-react";
import { useInvoice, type InvoiceResponse } from "@/lib/api/hooks";
import { formatMoney } from "@/lib/utils/money";

interface InvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceType: "ORDER" | "APPOINTMENT" | "SERVICE_BOOKING" | "PAYMENT";
  resourceId: string | number | null;
}

/**
 * Reusable Invoice Sheet Component
 * Rendered both inside the on-screen DialogBody and in the dedicated print portal.
 */
function InvoiceSheetContent({
  invoice,
  isRefunded,
}: {
  invoice: InvoiceResponse;
  isRefunded: boolean;
}) {
  return (
    <div className="bg-white text-black border border-neutral-300 rounded-lg p-6 sm:p-8 text-xs shadow-sm font-sans space-y-4">
      {/* 1. TOP HEADER */}
      <div className="border-b-2 border-neutral-900 pb-4 flex flex-col sm:flex-row justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-black text-2xl tracking-tight text-neutral-950">
              PawConnect
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-neutral-900 text-white px-2 py-0.5 rounded">
              TAX INVOICE
            </span>
          </div>
          <p className="font-bold text-xs text-neutral-800">{invoice.issuerName}</p>
          <p className="text-[11px] text-neutral-600">{invoice.issuerSubHeader}</p>
          <p className="text-[10px] text-neutral-500 max-w-sm">{invoice.issuerAddress}</p>
          <div className="flex flex-wrap gap-x-4 text-[10px] text-neutral-600 pt-1">
            <span>
              GSTIN: <strong className="text-black font-mono">{invoice.issuerGstin}</strong>
            </span>
            <span>
              Support: <strong className="text-black font-mono">{invoice.issuerPhone}</strong>
            </span>
          </div>
        </div>

        <div className="sm:text-right space-y-1 sm:self-start">
          <div className="border-2 border-neutral-900 px-3 py-1.5 inline-block text-left sm:text-right bg-neutral-50">
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">INVOICE NO</span>
            <span className="font-mono font-black text-sm text-neutral-950 block">
              {invoice.invoiceNumber}
            </span>
          </div>
          <div className="text-[11px] text-neutral-600 pt-1">
            <span>Date: </span>
            <strong className="text-neutral-900">
              {invoice.invoiceDate
                ? new Date(invoice.invoiceDate).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : new Date().toLocaleDateString("en-IN")}
            </strong>
          </div>
          <div className="text-[11px] text-neutral-600">
            <span>Ref / Order #: </span>
            <strong className="font-mono text-neutral-900">{invoice.referenceNumber}</strong>
          </div>

          {/* Paid Stamp */}
          <div className="pt-2">
            <span
              className={`inline-block font-black text-xs uppercase tracking-widest px-3 py-1 border-2 rounded ${
                isRefunded
                  ? "border-purple-600 text-purple-700 bg-purple-50"
                  : "border-emerald-600 text-emerald-700 bg-emerald-50"
              }`}
            >
              {isRefunded ? "✓ REFUND COMPLETED" : "✓ PAYMENT RECEIVED"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. BILLED TO & SHIPPED TO / PATIENT GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-neutral-300 pb-4">
        {/* Billed To Box */}
        <div className="space-y-1 bg-neutral-50/70 p-3 rounded border border-neutral-200">
          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500 flex items-center gap-1">
            <User className="h-3 w-3" />
            Billed To (Customer):
          </span>
          <p className="font-bold text-xs text-neutral-950">{invoice.customerName}</p>
          {invoice.customerPhone && (
            <p className="text-[11px] text-neutral-700 font-mono">Phone: {invoice.customerPhone}</p>
          )}
          {invoice.customerEmail && (
            <p className="text-[11px] text-neutral-700">Email: {invoice.customerEmail}</p>
          )}
          <p className="text-[11px] text-neutral-600 leading-snug pt-0.5">{invoice.billingAddress}</p>
        </div>

        {/* Shipped To (Order) OR Patient / Appointment (Vet / Service) */}
        <div className="space-y-1 bg-neutral-50/70 p-3 rounded border border-neutral-200">
          {invoice.invoiceType === "ORDER" ? (
            <>
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500 flex items-center gap-1">
                <Building className="h-3 w-3" />
                Delivery / Shipping Destination:
              </span>
              <p className="text-[11px] text-neutral-800 leading-snug">
                {invoice.shippingAddress || invoice.billingAddress}
              </p>
              {invoice.courierPartner && (
                <p className="text-[11px] text-neutral-700 pt-1">
                  Dispatched via: <strong>{invoice.courierPartner}</strong>
                  {invoice.awbNumber && <span className="font-mono ml-1">({invoice.awbNumber})</span>}
                </p>
              )}
            </>
          ) : (
            <>
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500 flex items-center gap-1">
                <PawPrint className="h-3 w-3" />
                Patient & Scheduled Booking:
              </span>
              <p className="font-bold text-xs text-neutral-950">
                {invoice.petName || "Pet Patient"}
                {invoice.petSpecies && (
                  <span className="text-neutral-600 font-normal ml-1">
                    ({invoice.petSpecies}
                    {invoice.petBreed ? ` • ${invoice.petBreed}` : ""})
                  </span>
                )}
              </p>
              {invoice.scheduledDate && (
                <p className="text-[11px] text-neutral-700">
                  Appointment Date: <strong>{invoice.scheduledDate}</strong>
                </p>
              )}
              {invoice.scheduledTimeSlot && (
                <p className="text-[11px] text-neutral-700">
                  Slot: <strong className="font-mono">{invoice.scheduledTimeSlot}</strong>
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* 3. GATEWAY TRANSACTION BAR */}
      <div className="bg-neutral-100 p-2.5 rounded border border-neutral-300 flex flex-wrap items-center justify-between gap-3 text-[10px]">
        <div className="flex items-center gap-2">
          <CreditCard className="h-3.5 w-3.5 text-neutral-700" />
          <span>
            Mode: <strong className="text-black">{invoice.paymentMethod || "Razorpay Gateway"}</strong>
          </span>
        </div>
        {invoice.razorpayPaymentId && (
          <div>
            <span>
              Payment ID: <strong className="font-mono text-black">{invoice.razorpayPaymentId}</strong>
            </span>
          </div>
        )}
        {invoice.razorpayOrderId && (
          <div>
            <span>
              Order ID: <strong className="font-mono text-black">{invoice.razorpayOrderId}</strong>
            </span>
          </div>
        )}
        <div>
          <span>
            Status: <strong className="text-emerald-700">{invoice.paymentStatus}</strong>
          </span>
        </div>
      </div>

      {/* 4. ITEMIZED GST TABLE */}
      <div className="border border-neutral-300 rounded overflow-hidden">
        <table className="w-full text-left border-collapse text-[11px]">
          <thead className="bg-neutral-100 border-b border-neutral-300 text-neutral-700 font-bold text-[10px] uppercase">
            <tr>
              <th className="p-2 w-8 text-center">#</th>
              <th className="p-2">Description of Goods / Services</th>
              <th className="p-2 text-center">HSN/SAC</th>
              <th className="p-2 text-center w-12">Qty</th>
              <th className="p-2 text-right">Unit Price</th>
              <th className="p-2 text-right">Taxable</th>
              <th className="p-2 text-right">CGST (9%)</th>
              <th className="p-2 text-right">SGST (9%)</th>
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 text-neutral-800">
            {invoice.items && invoice.items.length > 0 ? (
              invoice.items.map((it, idx) => (
                <tr key={idx} className="hover:bg-neutral-50/50">
                  <td className="p-2 text-center text-neutral-500 font-mono text-[10px]">
                    {it.serialNo || idx + 1}
                  </td>
                  <td className="p-2 font-medium text-neutral-900">{it.description}</td>
                  <td className="p-2 text-center font-mono text-[10px] text-neutral-600">
                    {it.hsnSacCode || "2309"}
                  </td>
                  <td className="p-2 text-center font-mono">{it.quantity}</td>
                  <td className="p-2 text-right font-mono">{formatMoney(it.unitPrice)}</td>
                  <td className="p-2 text-right font-mono">{formatMoney(it.taxableValue)}</td>
                  <td className="p-2 text-right font-mono text-neutral-600">{formatMoney(it.cgstAmount)}</td>
                  <td className="p-2 text-right font-mono text-neutral-600">{formatMoney(it.sgstAmount)}</td>
                  <td className="p-2 text-right font-mono font-bold text-neutral-950">
                    {formatMoney(it.lineTotal)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="p-4 text-center text-neutral-500">
                  Standard Retail Pet Care Service
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 5. SUMMARY & AMOUNT IN WORDS */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 border-b border-neutral-300 pb-4">
        {/* Left: Amount in Words */}
        <div className="sm:col-span-7 space-y-2">
          <div className="bg-neutral-50 p-3 rounded border border-neutral-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">
              Invoice Total in Words:
            </span>
            <p className="font-semibold text-neutral-900 text-xs italic">
              {invoice.amountInWords || `${formatMoney(invoice.totalAmount)} only`}
            </p>
          </div>

          <div className="text-[10px] text-neutral-500 space-y-0.5 pt-1">
            <p>• Standard GST rates applied in accordance with CGST and SGST Rules.</p>
            <p>• Reverse Charge: Not Applicable (N/A).</p>
          </div>
        </div>

        {/* Right: Calculations Breakdown */}
        <div className="sm:col-span-5 space-y-1 text-xs">
          <div className="flex justify-between text-neutral-600">
            <span>Subtotal (Excl. Tax):</span>
            <span className="font-mono">{formatMoney(invoice.taxableAmount || invoice.subtotal)}</span>
          </div>

          {invoice.discountAmount !== undefined && invoice.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-700 font-medium">
              <span>Discount / Promo:</span>
              <span className="font-mono">-{formatMoney(invoice.discountAmount)}</span>
            </div>
          )}

          {invoice.shippingFee !== undefined && invoice.shippingFee > 0 && (
            <div className="flex justify-between text-neutral-600">
              <span>Courier Delivery:</span>
              <span className="font-mono">{formatMoney(invoice.shippingFee)}</span>
            </div>
          )}

          <div className="flex justify-between text-neutral-600">
            <span>CGST (9.00%):</span>
            <span className="font-mono">{formatMoney(invoice.cgstAmount)}</span>
          </div>

          <div className="flex justify-between text-neutral-600">
            <span>SGST (9.00%):</span>
            <span className="font-mono">{formatMoney(invoice.sgstAmount)}</span>
          </div>

          <Separator className="my-1.5 bg-neutral-300" />

          <div className="flex justify-between font-black text-sm text-neutral-950 pt-0.5">
            <span>Total Amount (INR):</span>
            <span className="font-mono text-base">{formatMoney(invoice.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* 6. FOOTER DECLARATION & SIGNATORY */}
      <div className="pt-2 flex flex-col sm:flex-row justify-between items-end gap-6 text-[10px] text-neutral-500">
        <div className="space-y-1 max-w-sm">
          <p className="font-semibold text-neutral-700">Tax Invoice Declaration:</p>
          <p className="leading-tight">
            We declare that this invoice shows the actual price of the goods or services described and that all particulars are true and correct.
          </p>
          <p className="font-mono text-[9px] pt-1 text-neutral-400">
            Digitally generated by PawConnect Platform System. No physical signature required.
          </p>
        </div>

        <div className="text-center sm:text-right border-t sm:border-t-0 sm:border-l border-neutral-300 pt-2 sm:pt-0 sm:pl-6 w-full sm:w-auto">
          <div className="h-10 flex items-end justify-center sm:justify-end pb-1">
            <span className="font-serif italic text-neutral-800 text-xs tracking-wider">
              PawConnect Authorized Signatory
            </span>
          </div>
          <span className="font-bold text-neutral-900 block">PawConnect Retail India Pvt. Ltd.</span>
          <span className="text-[9px] text-neutral-500 block">Central Fulfillment & Clinical Ops</span>
        </div>
      </div>
    </div>
  );
}

export function InvoiceModal({
  open,
  onOpenChange,
  invoiceType,
  resourceId,
}: InvoiceModalProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (open) {
      document.body.classList.add("pawconnect-print-invoice-active");
    } else {
      document.body.classList.remove("pawconnect-print-invoice-active");
    }
    return () => {
      document.body.classList.remove("pawconnect-print-invoice-active");
    };
  }, [open]);

  const {
    data: invoice,
    isLoading,
    isError,
    error,
    refetch,
  } = useInvoice(invoiceType, resourceId, open);

  const handlePrint = () => {
    if (!invoice) return;
    const originalTitle = document.title;
    if (invoice.invoiceNumber) {
      document.title = `Tax-Invoice-${invoice.invoiceNumber}`;
    }

    document.body.classList.add("pawconnect-print-invoice-active");
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "visible";

    window.print();

    setTimeout(() => {
      document.title = originalTitle;
      document.body.style.overflow = originalOverflow;
    }, 1000);
  };

  const isRefunded = invoice?.paymentStatus?.toUpperCase() === "REFUNDED";

  const invoiceTypeTitle =
    invoiceType === "ORDER"
      ? "Product Purchase Tax Invoice"
      : invoiceType === "APPOINTMENT"
      ? "Veterinary Clinical Tax Invoice"
      : invoiceType === "SERVICE_BOOKING"
      ? "Pet Care Service Tax Invoice"
      : "Payment Bill & Receipt";

  if (!open) return null;

  return (
    <>
      {/* Print Specific CSS to isolate and format the A4 invoice sheet */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }

          body.pawconnect-print-invoice-active {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            background: #ffffff !important;
            color: #000000 !important;
          }

          /* Hide all page content except the dedicated print portal */
          body.pawconnect-print-invoice-active > *:not(#pawconnect-print-invoice-portal) {
            display: none !important;
          }

          /* Display the print portal cleanly in document flow */
          body.pawconnect-print-invoice-active #pawconnect-print-invoice-portal {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: 210mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
          }

          #pawconnect-print-invoice-portal * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }
        }

        /* Keep print portal hidden on screen */
        @media screen {
          #pawconnect-print-invoice-portal {
            display: none !important;
          }
        }
      `}</style>

      {/* 1. DEDICATED DIRECT BODY PORTAL FOR PRINTING */}
      {mounted && open && invoice && createPortal(
        <div id="pawconnect-print-invoice-portal">
          <InvoiceSheetContent invoice={invoice} isRefunded={isRefunded} />
        </div>,
        document.body
      )}

      {/* 2. ON-SCREEN MODAL DIALOG */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent size="wide" className="max-w-3xl">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  {invoiceTypeTitle}
                  {invoice && (
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {invoice.invoiceNumber}
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Official GST-compliant Tax Invoice / Bill of Supply for registered transactions.
                </DialogDescription>
              </div>

              {invoice && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`font-black text-xs tracking-wider uppercase px-2.5 py-0.5 ${
                      isRefunded
                        ? "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30"
                        : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                    }`}
                  >
                    {isRefunded ? "REFUNDED" : "PAID"}
                  </Badge>
                </div>
              )}
            </div>
          </DialogHeader>

          <DialogBody className="space-y-4 max-h-[78vh] overflow-y-auto p-4 sm:p-6">
            {isLoading && (
              <div className="flex flex-col items-center justify-center p-12 text-xs text-muted-foreground gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="font-semibold">Retrieving verified GST Tax Invoice from billing engine...</p>
              </div>
            )}

            {isError && (
              <div className="flex flex-col items-center justify-center p-8 space-y-3 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 text-center">
                <AlertCircle className="h-6 w-6" />
                <div className="space-y-1">
                  <p className="font-bold text-sm">Failed to Load Tax Invoice</p>
                  <p className="text-xs text-muted-foreground">
                    {error instanceof Error ? error.message : "The invoice could not be generated for this transaction."}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-xl text-xs">
                  Retry Loading
                </Button>
              </div>
            )}

            {invoice && (
              /* ON-SCREEN PREVIEW OF INVOICE */
              <InvoiceSheetContent invoice={invoice} isRefunded={isRefunded} />
            )}
          </DialogBody>

          <DialogFooter className="flex-col sm:flex-row gap-2 border-t border-border pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs h-9"
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              disabled={!invoice || isLoading}
              className="rounded-xl text-xs font-semibold h-9 px-5 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
