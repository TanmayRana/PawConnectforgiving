"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  CreditCard,
  ReceiptIndianRupee,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Clock,
  RotateCcw,
  XCircle,
  Copy,
  Check,
  ExternalLink,
  ShoppingBag,
  Stethoscope,
  Sparkles,
  Download,
  RefreshCw,
  Eye,
  AlertTriangle,
  User,
  Hash,
  Calendar,
  DollarSign,
  ArrowRight,
  FileText,
} from "lucide-react";
import { InvoiceModal } from "@/components/shared/invoice-modal";

import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  useAdminPayments,
  useAdminPaymentSummary,
  useAdminRefundPayment,
} from "@/lib/api/hooks";
import type {
  AdminPaymentRecord,
  AdminPaymentFilters,
} from "@/lib/api/payments";
import { formatMoney } from "@/lib/utils/money";
import { formatDateTime } from "@/lib/utils/date";
import { toast } from "@/lib/utils/toast";
import { cn } from "@/lib/utils";

type StatusTab = "ALL" | "PAID" | "PENDING" | "FAILED" | "REFUNDED";
type CategoryFilter = "ALL" | "ORDER" | "APPOINTMENT" | "SERVICE_BOOKING";

export function AdminPaymentsClient() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusTab>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Selected payment for Transaction Detail Sheet
  const [selectedPayment, setSelectedPayment] = useState<AdminPaymentRecord | null>(null);

  // Refund dialog state
  const [refundTarget, setRefundTarget] = useState<AdminPaymentRecord | null>(null);
  const [refundReason, setRefundReason] = useState("");

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Active Tax Invoice Modal Target
  const [invoiceModalTarget, setInvoiceModalTarget] = useState<{
    type: "ORDER" | "APPOINTMENT" | "SERVICE_BOOKING" | "PAYMENT";
    id: string | number;
  } | null>(null);

  const getInvoiceTarget = useCallback((p: AdminPaymentRecord) => {
    if (p.paymentFor === "ORDER" && p.referenceId) {
      return { type: "ORDER" as const, id: p.referenceId };
    }
    if (p.paymentFor === "APPOINTMENT" && p.referenceId) {
      return { type: "APPOINTMENT" as const, id: p.referenceId };
    }
    if (p.paymentFor === "SERVICE_BOOKING" && p.referenceId) {
      return { type: "SERVICE_BOOKING" as const, id: p.referenceId };
    }
    return { type: "PAYMENT" as const, id: p.id || p.razorpayPaymentId || p.paymentReference || "" };
  }, []);

  const queryFilters: AdminPaymentFilters = useMemo(
    () => ({
      page,
      size: pageSize,
      sort: "createdAt,desc",
      status: statusFilter !== "ALL" ? statusFilter : undefined,
      paymentFor: categoryFilter !== "ALL" ? categoryFilter : undefined,
      search: search.trim() ? search.trim() : undefined,
    }),
    [page, pageSize, statusFilter, categoryFilter, search]
  );

  const {
    data: paymentsPage,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useAdminPayments(queryFilters);

  const {
    data: summary,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useAdminPaymentSummary();

  const refundMutation = useAdminRefundPayment();

  const handleCopy = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success("Copied to Clipboard", { description: `${label}: ${text}` });
    setTimeout(() => {
      setCopiedId((current) => (current === text ? null : current));
    }, 2000);
  }, []);

  const handleRefresh = async () => {
    await Promise.all([refetch(), refetchSummary()]);
    toast.info("Refreshed", { description: "Payment ledger records updated." });
  };

  const handleOpenRefund = (record: AdminPaymentRecord) => {
    setRefundTarget(record);
    setRefundReason("Customer requested cancellation");
  };

  const handleConfirmRefund = async () => {
    if (!refundTarget) return;

    try {
      await refundMutation.mutateAsync({
        razorpayOrderId: refundTarget.razorpayOrderId,
        reason: refundReason.trim() || "Administrative refund executed",
      });

      toast.success("Refund Processed Successfully", {
        description: `Order ${refundTarget.razorpayOrderId} refunded for ${formatMoney(refundTarget.amount)}.`,
      });

      setRefundTarget(null);
      if (selectedPayment?.id === refundTarget.id) {
        setSelectedPayment((prev) =>
          prev ? { ...prev, status: "REFUNDED", refundReason } : null
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to execute refund via Razorpay.";
      toast.error("Refund Failed", { description: msg });
    }
  };

  const handleExportCsv = () => {
    const records = paymentsPage?.content || [];
    if (records.length === 0) {
      toast.info("No records to export.");
      return;
    }

    const headers = [
      "ID",
      "Payment Reference",
      "Razorpay Order ID",
      "Razorpay Payment ID",
      "Customer Name",
      "Customer Email",
      "Customer Phone",
      "Category",
      "Reference ID",
      "Reference Number",
      "Amount (INR)",
      "Currency",
      "Payment Method",
      "Status",
      "Signature Verified",
      "Created At",
    ];

    const rows = records.map((p) => [
      p.id,
      `"${p.paymentReference || ""}"`,
      `"${p.razorpayOrderId || ""}"`,
      `"${p.razorpayPaymentId || ""}"`,
      `"${p.customerName || ""}"`,
      `"${p.customerEmail || ""}"`,
      `"${p.customerPhone || ""}"`,
      p.paymentFor,
      p.referenceId || "",
      `"${p.referenceNumber || ""}"`,
      p.amount ?? ((p.amountInPaise || 0) / 100),
      p.currency || "INR",
      p.paymentMethod || "RAZORPAY",
      p.status || "PENDING",
      p.signatureVerified ? "YES" : "NO",
      `"${p.createdAt}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `pawconnect-payments-ledger-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Export Completed", {
      description: `Exported ${records.length} transactions.`,
    });
  };

  const columns: Column<AdminPaymentRecord>[] = [
    {
      key: "transaction",
      header: "Transaction / Gateway ID",
      render: (p) => {
        const primaryId = p.razorpayPaymentId || p.paymentReference;
        const isCopied = copiedId === primaryId;
        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-semibold text-foreground">
                {primaryId}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy(primaryId, "Payment ID");
                }}
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                title="Copy Payment ID"
              >
                {isCopied ? (
                  <Check className="h-3 w-3 text-emerald-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
              <span>{p.razorpayOrderId}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy(p.razorpayOrderId, "Order ID");
                }}
                className="hover:text-foreground transition-colors"
                title="Copy Razorpay Order ID"
              >
                <Copy className="h-2.5 w-2.5" />
              </button>
            </div>
          </div>
        );
      },
    },
    {
      key: "customer",
      header: "Customer",
      render: (p) => (
        <div className="space-y-0.5 text-xs max-w-[180px]">
          <span className="font-semibold text-foreground block truncate">
            {p.customerName}
          </span>
          <span className="text-[11px] text-muted-foreground block truncate">
            {p.customerEmail || "No email"}
          </span>
          {p.customerPhone && (
            <span className="text-[11px] text-muted-foreground block truncate">
              {p.customerPhone}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "paymentFor",
      header: "Channel & Reference",
      render: (p) => {
        const isOrder = p.paymentFor === "ORDER";
        const isAppt = p.paymentFor === "APPOINTMENT";

        return (
          <div className="space-y-1">
            {isOrder ? (
              <Badge
                variant="outline"
                className="gap-1 bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20 text-[10px] py-0 px-1.5"
              >
                <ShoppingBag className="h-3 w-3" /> Shop Order
              </Badge>
            ) : isAppt ? (
              <Badge
                variant="outline"
                className="gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 text-[10px] py-0 px-1.5"
              >
                <Stethoscope className="h-3 w-3" /> Vet Appt
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="gap-1 bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 text-[10px] py-0 px-1.5"
              >
                <Sparkles className="h-3 w-3" /> Pet Service
              </Badge>
            )}
            <div className="text-[11px] font-mono text-muted-foreground">
              {p.referenceNumber || `#${p.referenceId || p.id}`}
            </div>
          </div>
        );
      },
    },
    {
      key: "method",
      header: "Method & Security",
      render: (p) => (
        <div className="space-y-1 text-xs">
          <Badge
            variant="outline"
            className="text-[10px] font-mono uppercase bg-muted/60 py-0 px-1.5"
          >
            {p.paymentMethod || "RAZORPAY"}
          </Badge>
          <div>
            {p.signatureVerified ? (
              <span className="inline-flex items-center text-[10px] text-emerald-600 dark:text-emerald-400 font-medium gap-0.5">
                <ShieldCheck className="h-3 w-3 text-emerald-500" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center text-[10px] text-amber-600 dark:text-amber-400 font-medium gap-0.5">
                <ShieldAlert className="h-3 w-3 text-amber-500" /> Pending
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (p) => {
        const paise =
          p.amountInPaise != null
            ? p.amountInPaise
            : Math.round((p.amount ?? 0) * 100);
        return (
          <div className="space-y-0.5 text-xs">
            <span className="font-bold text-foreground block">
              {formatMoney(p.amount ?? paise / 100)}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono block">
              {paise.toLocaleString("en-IN")} paise
            </span>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (p) => {
        const st = (p.status || "PENDING").toUpperCase();
        if (st === "PAID" || st === "SUCCESS") {
          return (
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-semibold text-[11px] py-0.5 px-2"
            >
              PAID
            </Badge>
          );
        }
        if (st === "PENDING" || st === "CREATED") {
          return (
            <Badge
              variant="outline"
              className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 font-semibold text-[11px] py-0.5 px-2"
            >
              PENDING
            </Badge>
          );
        }
        if (st === "REFUNDED") {
          return (
            <Badge
              variant="outline"
              className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20 font-semibold text-[11px] py-0.5 px-2"
            >
              REFUNDED
            </Badge>
          );
        }
        return (
          <Badge
            variant="outline"
            className="bg-destructive/10 text-destructive border-destructive/20 font-semibold text-[11px] py-0.5 px-2"
          >
            FAILED
          </Badge>
        );
      },
    },
    {
      key: "date",
      header: "Created Timestamp",
      render: (p) => (
        <div className="text-xs text-muted-foreground font-mono">
          {formatDateTime(p.createdAt)}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (p) => {
        const canRefund = p.status === "PAID" || p.status === "SUCCESS";
        const isPaidOrRefunded =
          p.status === "PAID" || p.status === "SUCCESS" || p.status === "REFUNDED";
        return (
          <div className="flex items-center justify-end gap-1.5">
            {isPaidOrRefunded && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setInvoiceModalTarget(getInvoiceTarget(p));
                }}
                className="h-7 text-[11px] px-2 rounded-lg gap-1 border-primary/30 text-primary hover:bg-primary/10"
                title="View Official GST Tax Invoice"
              >
                <FileText className="h-3 w-3" /> Invoice
              </Button>
            )}
            {canRefund && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenRefund(p);
                }}
                className="h-7 text-[11px] px-2 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                title="Issue full refund"
              >
                <RotateCcw className="h-3 w-3 mr-1" /> Refund
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPayment(p);
              }}
              className="h-7 text-[11px] px-2 rounded-lg"
            >
              <Eye className="h-3.5 w-3.5 mr-1" /> Details
            </Button>
          </div>
        );
      },
    },
  ];

  const records = paymentsPage?.content || [];
  const totalElements = paymentsPage?.totalElements || 0;
  const totalPages = paymentsPage?.totalPages || 1;
  const isFirstPage = paymentsPage?.first ?? (page === 0);
  const isLastPage = paymentsPage?.last ?? (page >= totalPages - 1);

  return (
    <div className="space-y-6 pb-20">
      {/* Top Page Header */}
      <PageHeader
        title="Payment History & Financial Ledger"
        description="Unified audit ledger across Shop Orders, Vet Consultations, and Pet Care Services with HMAC-SHA256 signature verification and refund execution."
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="rounded-xl text-xs gap-1.5 h-9"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
            className="rounded-xl text-xs gap-1.5 h-9"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </PageHeader>

      {/* KPI Metric Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Captured Revenue"
          value={formatMoney(summary?.totalRevenue || 0)}
          description="Settled volume across all channels"
          loading={isSummaryLoading}
          icon={<ReceiptIndianRupee className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        />
        <StatCard
          title="Successful Transactions"
          value={summary?.successfulCount || 0}
          description="Verified gateway payments"
          loading={isSummaryLoading}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        />
        <StatCard
          title="Pending Checkouts"
          value={summary?.pendingCount || 0}
          description="Awaiting user authorization"
          loading={isSummaryLoading}
          icon={<Clock className="h-5 w-5 text-amber-500" />}
        />
        <StatCard
          title="Refunded Volume"
          value={formatMoney(summary?.totalRefundedAmount || 0)}
          description={`${summary?.refundedCount || 0} refunded transactions`}
          loading={isSummaryLoading}
          icon={<RotateCcw className="h-5 w-5 text-purple-500" />}
        />
        <StatCard
          title="Failed Checkouts"
          value={summary?.failedCount || 0}
          description="Declined or expired checkouts"
          loading={isSummaryLoading}
          icon={<XCircle className="h-5 w-5 text-destructive" />}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground mr-1">
              Status:
            </span>
            {(["ALL", "PAID", "PENDING", "FAILED", "REFUNDED"] as StatusTab[]).map(
              (st) => (
                <Button
                  key={st}
                  variant={statusFilter === st ? "primary" : "outline"}
                  size="sm"
                  onClick={() => {
                    setStatusFilter(st);
                    setPage(0);
                  }}
                  className="rounded-xl text-xs h-8 capitalize font-medium"
                >
                  {st.toLowerCase()}
                </Button>
              )
            )}
          </div>

          {/* Search Input */}
          <div className="w-full lg:w-80">
            <SearchBar
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(0);
              }}
              placeholder="Search Order ID, Pay ID, Customer..."
              className="w-full"
            />
          </div>
        </div>

        {/* Channel Categories */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/60">
          <span className="text-xs font-semibold text-muted-foreground mr-1">
            Channel:
          </span>
          {[
            { id: "ALL", label: "All Channels" },
            { id: "ORDER", label: "Shop Orders" },
            { id: "APPOINTMENT", label: "Vet Consultations" },
            { id: "SERVICE_BOOKING", label: "Pet Care Services" },
          ].map((cat) => (
            <Button
              key={cat.id}
              variant={categoryFilter === cat.id ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setCategoryFilter(cat.id as CategoryFilter);
                setPage(0);
              }}
              className="rounded-lg text-xs h-7"
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Ledger DataTable */}
      {isError ? (
        <ErrorState
          title="Could not load payment ledger"
          description="Failed to retrieve transaction records from the administrative payment service."
          action={
            <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
              Retry
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <DataTable
            columns={columns}
            data={records}
            loading={isLoading}
            onRowClick={(row) => setSelectedPayment(row)}
            keyExtractor={(p) => p.id}
            emptyTitle="No payment records found"
            emptyDescription="Try clearing your search query or switching filters."
            emptyIcon={<CreditCard className="h-8 w-8 text-muted-foreground" />}
          />

          {/* Pagination */}
          {totalElements > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
              <div className="text-xs text-muted-foreground">
                Showing {page * pageSize + 1} to{" "}
                {Math.min((page + 1) * pageSize, totalElements)} of {totalElements}{" "}
                transactions (Page {page + 1} of {totalPages})
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isFirstPage || isLoading}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="rounded-xl text-xs h-8"
                >
                  Previous
                </Button>
                <div className="text-xs font-mono px-2">
                  {page + 1} / {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isLastPage || isLoading}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-xl text-xs h-8"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Transaction Detail Sheet / Drawer ─────────────────────────────── */}
      <Sheet
        open={Boolean(selectedPayment)}
        onOpenChange={(open) => !open && setSelectedPayment(null)}
      >
        <SheetContent
          side="right"
          className="sm:max-w-lg md:max-w-xl overflow-y-auto p-6"
        >
          {selectedPayment && (
            <div className="space-y-6">
              <SheetHeader className="p-0 border-b border-border pb-4">
                <div className="flex items-center justify-between pr-6">
                  <Badge variant="outline" className="font-mono text-xs">
                    {selectedPayment.paymentReference || "PAY-" + selectedPayment.id}
                  </Badge>
                  <StatusBadge status={(selectedPayment.status || "pending").toLowerCase()} size="sm" />
                </div>
                <SheetTitle className="text-lg font-bold">
                  Transaction Audit Record
                </SheetTitle>
                <SheetDescription className="font-mono text-xs">
                  Gateway Order: {selectedPayment.razorpayOrderId}
                </SheetDescription>
              </SheetHeader>

              {/* Settlement Amount Banner */}
              <div className="rounded-2xl border border-border bg-muted/40 p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider block">
                    Amount Settled
                  </span>
                  <span className="text-2xl font-black text-foreground">
                    {formatMoney(
                      selectedPayment.amount ??
                        (selectedPayment.amountInPaise != null
                          ? selectedPayment.amountInPaise / 100
                          : 0)
                    )}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono block">
                    {(selectedPayment.amountInPaise != null
                      ? selectedPayment.amountInPaise
                      : Math.round((selectedPayment.amount ?? 0) * 100)
                    ).toLocaleString("en-IN")}{" "}
                    paise ({selectedPayment.currency || "INR"})
                  </span>
                </div>
                <div className="text-right space-y-1">
                  <Badge
                    variant="outline"
                    className="font-mono text-xs font-bold uppercase"
                  >
                    {selectedPayment.paymentMethod || "RAZORPAY"}
                  </Badge>
                  <div>
                    {selectedPayment.signatureVerified ? (
                      <span className="inline-flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold gap-1">
                        <ShieldCheck className="h-4 w-4" /> Signature Valid
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs text-amber-600 dark:text-amber-400 font-semibold gap-1">
                        <ShieldAlert className="h-4 w-4" /> Unverified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Lifecycle Timeline */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Payment Lifecycle Timeline
                </h4>
                <div className="rounded-2xl border border-border p-4 space-y-3 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        Payment Order Initialized
                      </p>
                      <p className="text-[11px] font-mono text-muted-foreground">
                        {formatDateTime(selectedPayment.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                        selectedPayment.signatureVerified
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-amber-500/10 text-amber-600"
                      )}
                    >
                      {selectedPayment.signatureVerified ? (
                        <ShieldCheck className="h-3.5 w-3.5" />
                      ) : (
                        <Clock className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {selectedPayment.signatureVerified
                          ? "HMAC-SHA256 Signature Verified"
                          : "Awaiting Gateway Signature Verification"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {selectedPayment.signatureVerified
                          ? "Cryptographic hash verified by Spring Boot PaymentService"
                          : "User has not submitted gateway signature response"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                        selectedPayment.status === "PAID" || selectedPayment.status === "SUCCESS"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : selectedPayment.status === "REFUNDED"
                          ? "bg-purple-500/10 text-purple-600"
                          : selectedPayment.status === "FAILED"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {selectedPayment.status === "REFUNDED" ? (
                        <RotateCcw className="h-3.5 w-3.5" />
                      ) : selectedPayment.status === "FAILED" ? (
                        <XCircle className="h-3.5 w-3.5" />
                      ) : selectedPayment.status === "PAID" || selectedPayment.status === "SUCCESS" ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Clock className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        Settlement Status: {selectedPayment.status}
                      </p>
                      <p className="text-[11px] font-mono text-muted-foreground">
                        {selectedPayment.capturedAt
                          ? `Captured at ${formatDateTime(selectedPayment.capturedAt)}`
                          : selectedPayment.updatedAt
                          ? `Updated at ${formatDateTime(selectedPayment.updatedAt)}`
                          : "Pending gateway reconciliation"}
                      </p>
                    </div>
                  </div>

                  {selectedPayment.status === "REFUNDED" && (
                    <div className="flex items-start gap-3 pt-1 border-t border-border/50">
                      <div className="h-6 w-6 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                        <RotateCcw className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="font-semibold text-purple-700 dark:text-purple-300">
                          Refund Processed
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Reason: {selectedPayment.refundReason || "Administrative refund"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Gateway Technical Metadata */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Gateway Cryptographic Parameters
                </h4>
                <div className="rounded-2xl border border-border bg-card p-4 space-y-2.5 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Razorpay Order ID:</span>
                    <div className="flex items-center gap-1.5 font-bold text-foreground">
                      <span>{selectedPayment.razorpayOrderId}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedPayment.razorpayOrderId, "Order ID")}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Razorpay Payment ID:</span>
                    <div className="flex items-center gap-1.5 font-bold text-foreground">
                      <span>{selectedPayment.razorpayPaymentId || "—"}</span>
                      {selectedPayment.razorpayPaymentId && (
                        <button
                          type="button"
                          onClick={() => handleCopy(selectedPayment.razorpayPaymentId!, "Payment ID")}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">HMAC Algorithm:</span>
                    <span className="text-foreground">HmacSHA256 (RFC 2104)</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Currency:</span>
                    <span className="text-foreground">{selectedPayment.currency}</span>
                  </div>

                  {selectedPayment.failureReason && (
                    <div className="pt-2 border-t border-border">
                      <span className="text-destructive font-semibold block">Failure Cause:</span>
                      <p className="text-[11px] text-destructive/90 font-sans mt-0.5">
                        {selectedPayment.failureReason}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer & Channel Destination */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Customer & Destination Reference
                </h4>
                <div className="rounded-2xl border border-border p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Customer Name:</span>
                    <span className="font-semibold text-foreground">
                      {selectedPayment.customerName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Customer Email:</span>
                    <span className="text-foreground font-mono">
                      {selectedPayment.customerEmail || "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Customer Phone:</span>
                    <span className="text-foreground font-mono">
                      {selectedPayment.customerPhone || "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-muted-foreground">Linked Channel:</span>
                    <span className="font-semibold text-foreground uppercase">
                      {selectedPayment.paymentFor}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Reference Number:</span>
                    <span className="font-mono font-bold text-foreground">
                      {selectedPayment.referenceNumber || `#${selectedPayment.referenceId}`}
                    </span>
                  </div>

                  {selectedPayment.paymentFor === "ORDER" && selectedPayment.referenceId && (
                    <div className="pt-2">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full rounded-xl text-xs gap-1.5"
                      >
                        <Link href={`/admin/orders/${selectedPayment.referenceId}`}>
                          <ExternalLink className="h-3.5 w-3.5" /> View Linked Order Details
                        </Link>
                      </Button>
                    </div>
                  )}

                  {(selectedPayment.status === "PAID" ||
                    selectedPayment.status === "SUCCESS" ||
                    selectedPayment.status === "REFUNDED") && (
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInvoiceModalTarget(getInvoiceTarget(selectedPayment))}
                        className="w-full rounded-xl text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/5 font-semibold h-9"
                      >
                        <FileText className="h-3.5 w-3.5" /> View Official GST Tax Invoice
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Administrative Refund Trigger */}
              {(selectedPayment.status === "PAID" || selectedPayment.status === "SUCCESS") && (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-xs text-destructive">
                        Issue Administrative Refund
                      </h5>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                        Directly refund {formatMoney(selectedPayment.amount ?? ((selectedPayment.amountInPaise || 0) / 100))} back to the customer&apos;s original payment method via Razorpay. This will also update the order status and replenish inventory if applicable.
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleOpenRefund(selectedPayment)}
                    className="w-full rounded-xl text-xs gap-1.5 h-9"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Execute Full Refund (
                    {formatMoney(selectedPayment.amount ?? ((selectedPayment.amountInPaise || 0) / 100))})
                  </Button>
                </div>
              )}

              <SheetFooter className="p-0 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedPayment(null)}
                  className="w-full rounded-xl"
                >
                  Close Drawer
                </Button>
              </SheetFooter>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ─── Refund Confirmation Dialog ────────────────────────────────────── */}
      <Dialog
        open={Boolean(refundTarget)}
        onOpenChange={(open) => !open && setRefundTarget(null)}
      >
        <DialogContent size="default" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <RotateCcw className="h-5 w-5" /> Execute Payment Refund
            </DialogTitle>
            <DialogDescription>
              This action will invoke the Razorpay Refund API to immediately return funds to the customer.
            </DialogDescription>
          </DialogHeader>

          {refundTarget && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl bg-muted/50 border border-border p-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Reference:</span>
                  <span className="font-mono font-bold text-foreground">
                    {refundTarget.razorpayOrderId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-semibold text-foreground">
                    {refundTarget.customerName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Refund Amount:</span>
                  <span className="font-bold text-destructive">
                    {formatMoney(refundTarget.amount ?? ((refundTarget.amountInPaise || 0) / 100))}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Reason for Refund
                </label>
                <Textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Customer cancelled order before dispatch"
                  rows={3}
                  className="text-xs rounded-xl"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              disabled={refundMutation.isPending}
              onClick={() => setRefundTarget(null)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={refundMutation.isPending}
              onClick={handleConfirmRefund}
              className="rounded-xl text-xs gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Confirm Full Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Printable Universal GST Tax Invoice Modal ────────────────────── */}
      <InvoiceModal
        open={Boolean(invoiceModalTarget)}
        onOpenChange={(open) => {
          if (!open) setInvoiceModalTarget(null);
        }}
        invoiceType={invoiceModalTarget?.type || "PAYMENT"}
        resourceId={invoiceModalTarget?.id ?? null}
      />
    </div>
  );
}
