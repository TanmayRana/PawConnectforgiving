"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useAdminOrders,
  useUpdateAdminOrderStatus,
} from "@/lib/api/hooks";
import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { OrderStatusDialog } from "@/components/admin/order-status-dialog";
import { BulkOrderStatusDialog } from "@/components/admin/bulk-order-status-dialog";
import { ShippingLabelModal } from "@/components/admin/shipping-label-modal";
import { InvoiceModal } from "@/components/shared/invoice-modal";
import { ErrorState } from "@/components/shared/states";
import { RefreshIndicator } from "@/components/ui/paw-spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatMoney } from "@/lib/utils/money";
import { toast } from "@/lib/utils/toast";
import {
  ShoppingCart,
  Eye,
  Edit2,
  FileText,
  Receipt,
  Truck,
  CheckCircle2,
  Printer,
  Layers,
  ClipboardCheck,
  MoreHorizontal,
  RotateCcw,
  X,
  Filter,
} from "lucide-react";
import type { CustomerOrder, OrderStatus } from "@/lib/mock/orders";
import type { UpdateOrderStatusOptions } from "@/lib/api/admin";

type StatusTab = "all" | OrderStatus;
type PaymentFilter = "all" | "paid" | "unpaid";
type CarrierFilter = "all" | "pawconnect" | "delhivery" | "bluedart" | "unassigned";
type DateFilter = "all" | "today" | "7days" | "30days";
type SortBy = "newest" | "oldest" | "amount_high" | "amount_low" | "items_high";

export function AdminOrdersClient() {
  const router = useRouter();
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [carrierFilter, setCarrierFilter] = useState<CarrierFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("newest");

  // Selection & Modal States
  const [editingOrder, setEditingOrder] = useState<CustomerOrder | null>(null);
  const [shippingLabelOrder, setShippingLabelOrder] = useState<CustomerOrder | null>(null);
  const [shippingLabelMode, setShippingLabelMode] = useState<"label" | "packing_slip">("label");
  const [invoiceOrder, setInvoiceOrder] = useState<CustomerOrder | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [bulkShippingModalOpen, setBulkShippingModalOpen] = useState(false);
  const [bulkShippingMode, setBulkShippingMode] = useState<"label" | "packing_slip">("label");
  const [bulkStatusDialogOpen, setBulkStatusDialogOpen] = useState(false);

  const { data: orders = [], isLoading, isFetching, isError, refetch } = useAdminOrders();
  const { mutateAsync: updateOrderStatus } = useUpdateAdminOrderStatus();

  // Status Tab Counts
  const statusCounts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      confirmed: orders.filter((o) => o.status === "confirmed").length,
      packed: orders.filter((o) => o.status === "packed").length,
      shipped: orders.filter((o) => o.status === "shipped").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    };
  }, [orders]);

  // Master Filter & Sort Pipeline
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Status Tab Filter
    if (statusTab !== "all") {
      result = result.filter((o) => o.status === statusTab);
    }

    // Payment Filter
    if (paymentFilter === "paid") {
      result = result.filter((o) => o.paymentStatus === "paid");
    } else if (paymentFilter === "unpaid") {
      result = result.filter((o) => o.paymentStatus !== "paid");
    }

    // Carrier Filter
    if (carrierFilter === "pawconnect") {
      result = result.filter((o) => o.courierPartner?.toLowerCase().includes("pawconnect"));
    } else if (carrierFilter === "delhivery") {
      result = result.filter((o) => o.courierPartner?.toLowerCase().includes("delhivery"));
    } else if (carrierFilter === "bluedart") {
      result = result.filter((o) => o.courierPartner?.toLowerCase().includes("bluedart"));
    } else if (carrierFilter === "unassigned") {
      result = result.filter((o) => !o.awbNumber && !o.trackingNumber);
    }

    // Date Filter
    if (dateFilter !== "all") {
      const now = new Date();
      result = result.filter((o) => {
        const orderDate = new Date(o.date || o.createdAt || 0);
        if (dateFilter === "today") {
          return orderDate.toDateString() === now.toDateString();
        }
        if (dateFilter === "7days") {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          return orderDate >= sevenDaysAgo;
        }
        if (dateFilter === "30days") {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          return orderDate >= thirtyDaysAgo;
        }
        return true;
      });
    }

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.deliveryAddress.recipientName.toLowerCase().includes(q) ||
          o.deliveryAddress.city.toLowerCase().includes(q) ||
          (o.courierPartner && o.courierPartner.toLowerCase().includes(q)) ||
          (o.trackingNumber && o.trackingNumber.toLowerCase().includes(q)) ||
          (o.awbNumber && o.awbNumber.toLowerCase().includes(q))
      );
    }

    // Sorting
    result.sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || 0).getTime();
      const dateB = new Date(b.date || b.createdAt || 0).getTime();
      if (sortBy === "oldest") return dateA - dateB;
      if (sortBy === "amount_high") return b.total - a.total;
      if (sortBy === "amount_low") return a.total - b.total;
      if (sortBy === "items_high") {
        const unitsA = (a.items || []).reduce((s, it) => s + (it.quantity || 1), 0);
        const unitsB = (b.items || []).reduce((s, it) => s + (it.quantity || 1), 0);
        return unitsB - unitsA;
      }
      return dateB - dateA; // default newest first
    });

    return result;
  }, [orders, statusTab, paymentFilter, carrierFilter, dateFilter, sortBy, searchQuery]);

  const hasActiveFilters =
    paymentFilter !== "all" ||
    carrierFilter !== "all" ||
    dateFilter !== "all" ||
    sortBy !== "newest" ||
    searchQuery.trim() !== "";

  const handleResetFilters = () => {
    setPaymentFilter("all");
    setCarrierFilter("all");
    setDateFilter("all");
    setSortBy("newest");
    setSearchQuery("");
  };

  const handleUpdateStatus = async (
    orderId: string,
    status: OrderStatus,
    options?: UpdateOrderStatusOptions | string
  ) => {
    try {
      const payload = typeof options === "string" ? { note: options } : options || {};
      await updateOrderStatus({ orderId, status, ...payload });
      toast.success("Order Dispatch Updated", {
        description: `Order successfully updated to '${status}'.`,
      });
      setEditingOrder(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update order status.";
      toast.error("Update Failed", { description: msg });
    }
  };

  const selectedOrders = useMemo(
    () => orders.filter((o) => selectedOrderIds.has(o.id)),
    [orders, selectedOrderIds]
  );

  const paidSelectedCount = useMemo(
    () => selectedOrders.filter((o) => o.paymentStatus === "paid").length,
    [selectedOrders]
  );
  const unpaidSelectedCount = selectedOrders.length - paidSelectedCount;

  const isAllSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((o) => selectedOrderIds.has(o.id));
  const isSomeSelected =
    filteredOrders.some((o) => selectedOrderIds.has(o.id)) && !isAllSelected;

  const columns: Column<CustomerOrder>[] = [
    {
      key: "select",
      header: (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={isAllSelected ? true : isSomeSelected ? "indeterminate" : false}
            onCheckedChange={(checked) => {
              setSelectedOrderIds((prev) => {
                const next = new Set(prev);
                if (checked) {
                  filteredOrders.forEach((o) => next.add(o.id));
                } else {
                  filteredOrders.forEach((o) => next.delete(o.id));
                }
                return next;
              });
            }}
            aria-label="Select all orders on page"
          />
        </div>
      ),
      className: "w-10 px-2 text-center",
      headerClassName: "w-10 px-2 text-center",
      render: (o) => (
        <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selectedOrderIds.has(o.id)}
            onCheckedChange={(checked) => {
              setSelectedOrderIds((prev) => {
                const next = new Set(prev);
                if (checked) {
                  next.add(o.id);
                } else {
                  next.delete(o.id);
                }
                return next;
              });
            }}
            aria-label={`Select order ${o.orderNumber}`}
          />
        </div>
      ),
    },
    {
      key: "order",
      header: "Order & Date",
      render: (o) => (
        <div className="space-y-0.5 min-w-[120px]">
          <Link
            href={`/admin/orders/${o.id}`}
            className="font-mono font-bold text-foreground text-xs hover:text-primary transition-colors block truncate"
          >
            {o.orderNumber}
          </Link>
          <span className="text-[11px] text-muted-foreground block">
            {o.date || o.createdAt ? new Date(o.date || o.createdAt).toLocaleDateString() : "Recent"}
          </span>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Recipient / Destination",
      render: (o) => (
        <div className="space-y-0.5 text-xs max-w-[160px]">
          <span className="font-semibold text-foreground block truncate">
            {o.deliveryAddress.recipientName}
          </span>
          <span className="text-[11px] text-muted-foreground block truncate">
            {o.deliveryAddress.city}, {o.deliveryAddress.state} {o.deliveryAddress.zipCode}
          </span>
        </div>
      ),
    },
    {
      key: "items",
      header: "Items & Content",
      render: (o) => {
        const firstItem = o.items[0];
        const extraCount = o.items.length - 1;

        if (!firstItem) {
          return <span className="text-xs text-muted-foreground italic">No items</span>;
        }

        return (
          <Popover>
            <PopoverTrigger
              className="group flex items-center gap-2 text-left max-w-[170px] rounded-xl p-1 -m-1 hover:bg-secondary/60 transition-colors cursor-pointer"
              title="Click to preview order items"
            >
              <div className="relative h-8 w-8 rounded-lg overflow-hidden border border-border bg-secondary/50 shrink-0 shadow-xs">
                <Image
                  src={
                    firstItem.image ||
                    firstItem.productImageUrl ||
                    "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&auto=format&fit=crop&q=80"
                  }
                  alt={firstItem.name}
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                  {firstItem.quantity}× {firstItem.name}
                </p>
                {extraCount > 0 ? (
                  <span className="text-[10px] font-semibold text-primary underline underline-offset-2">
                    +{extraCount} more
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground block truncate">
                    {firstItem.sku || "SKU-Verified"}
                  </span>
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3 shadow-xl rounded-2xl bg-card border border-border z-50">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <span className="text-xs font-bold text-foreground">
                    Order Contents ({o.items.reduce((sum, it) => sum + (it.quantity || 1), 0)} Units • {o.items.length} {o.items.length === 1 ? "Item" : "Items"})
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {o.orderNumber}
                  </Badge>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {o.items.map((it, idx) => (
                    <div
                      key={`${it.productId}-${idx}`}
                      className="flex items-center gap-2.5 text-xs p-1.5 rounded-xl bg-secondary/30"
                    >
                      <div className="relative h-10 w-10 rounded-lg overflow-hidden border border-border bg-background shrink-0">
                        <Image
                          src={
                            it.image ||
                            it.productImageUrl ||
                            "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&auto=format&fit=crop&q=80"
                          }
                          alt={it.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate">{it.name}</p>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-0.5">
                          <span>
                            {it.quantity} × {formatMoney(it.price)}
                          </span>
                          <span className="font-bold text-foreground">
                            {formatMoney(it.lineTotal || it.price * it.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs font-bold">
                  <span className="text-muted-foreground">Order Total</span>
                  <span className="text-foreground">{formatMoney(o.total)}</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        );
      },
    },
    {
      key: "total",
      header: "Payment & Total",
      render: (o) => {
        const isPaid = o.paymentStatus === "paid";
        return (
          <div className="space-y-0.5 text-xs">
            <span className="font-bold text-foreground block">{formatMoney(o.total)}</span>
            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className={`text-[9px] font-bold py-0 px-1.5 ${
                  isPaid
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                }`}
              >
                {isPaid ? "PAID" : "UNPAID"}
              </Badge>
              <span className="text-[10px] text-muted-foreground">{o.items.length} items</span>
            </div>
          </div>
        );
      },
    },
    {
      key: "logistics",
      header: "Courier & AWB",
      render: (o) => {
        const awb = o.awbNumber || o.trackingNumber;
        const courier = o.courierPartner || (o.status === "shipped" || o.status === "delivered" ? "PawConnect Express" : null);

        if (!courier && !awb) {
          return (
            <span className="text-xs text-muted-foreground italic">
              Unassigned
            </span>
          );
        }

        return (
          <div className="space-y-0.5 max-w-[140px]">
            <div className="flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-xs font-semibold text-foreground truncate">
                {courier || "Express"}
              </span>
            </div>
            {awb && (
              <span className="font-mono text-[10px] text-muted-foreground block truncate">
                {awb}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (o) => <StatusBadge status={o.status} size="sm" />,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right w-36 px-2",
      headerClassName: "text-right w-36 px-2",
      render: (o) => (
        <div className="flex items-center justify-end gap-1">
          {/* Primary Action Button: Dispatch / Manage */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingOrder(o)}
            className="rounded-xl text-xs h-7.5 px-2.5 gap-1.5 font-semibold text-foreground hover:border-primary/50 hover:bg-primary/5 shadow-2xs"
            title="Update Fulfillment & Courier Tracking"
          >
            <Edit2 className="h-3 w-3 text-primary" />
            <span>Dispatch</span>
          </Button>

          {/* Quick 4x6 Label Print Trigger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setShippingLabelMode("label");
              setShippingLabelOrder(o);
            }}
            className="h-7.5 w-7.5 rounded-xl text-muted-foreground hover:text-primary hover:bg-secondary"
            title="Print Shipping Label (4×6 Thermal)"
          >
            <Printer className="h-3.5 w-3.5" />
          </Button>

          {/* Quick Invoice Trigger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setInvoiceOrder(o)}
            className="h-7.5 w-7.5 rounded-xl text-muted-foreground hover:text-primary hover:bg-secondary"
            title="Official GST Tax Invoice"
          >
            <Receipt className="h-3.5 w-3.5" />
          </Button>

          {/* More Actions Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex items-center justify-center h-7.5 w-7.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              title="More Order Actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 p-1.5 shadow-xl rounded-2xl bg-card border border-border z-50"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider px-2 py-1">
                  Order #{o.orderNumber}
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    setShippingLabelMode("label");
                    setShippingLabelOrder(o);
                  }}
                  className="text-xs cursor-pointer rounded-lg gap-2"
                >
                  <Printer className="h-3.5 w-3.5 text-primary" />
                  <span>Print Shipping Label (4×6)</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setShippingLabelMode("packing_slip");
                    setShippingLabelOrder(o);
                  }}
                  className="text-xs cursor-pointer rounded-lg gap-2"
                >
                  <ClipboardCheck className="h-3.5 w-3.5 text-primary" />
                  <span>Print Packing Slip (A4)</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setInvoiceOrder(o)}
                  className="text-xs cursor-pointer rounded-lg gap-2"
                >
                  <Receipt className="h-3.5 w-3.5 text-primary" />
                  <span>View GST Tax Invoice</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="my-1 border-border/50" />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => setEditingOrder(o)}
                  className="text-xs cursor-pointer rounded-lg gap-2"
                >
                  <Edit2 className="h-3.5 w-3.5 text-primary" />
                  <span>Edit Status & Courier</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push(`/admin/orders/${o.id}`)}
                  className="text-xs cursor-pointer rounded-lg gap-2"
                >
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>View Order Details</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  if (isError) {
    return (
      <div className="py-12">
        <ErrorState
          title="Could not load orders"
          description="Encountered an issue retrieving customer purchase receipts."
          action={
            <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-20">
      <PageHeader
        title="Storefront Orders Fulfillment & Dispatch"
        description="Fulfillment queue and courier dispatch console for customer purchases, AWB tracking, and shift labels."
      >
        <RefreshIndicator isRefreshing={isFetching && !isLoading} label="Refreshing orders..." />
      </PageHeader>

      {/* Primary Status Tabs */}
      <Tabs
        value={statusTab}
        onValueChange={(val) => setStatusTab(val as StatusTab)}
        className="w-full"
      >
        <TabsList className="bg-secondary/60 p-1 rounded-2xl h-10 w-full sm:w-auto overflow-x-auto justify-start">
          <TabsTrigger value="all" className="rounded-xl text-xs px-3.5">
            All ({statusCounts.all})
          </TabsTrigger>
          <TabsTrigger value="pending" className="rounded-xl text-xs px-3">
            Pending ({statusCounts.pending})
          </TabsTrigger>
          <TabsTrigger value="confirmed" className="rounded-xl text-xs px-3">
            Confirmed ({statusCounts.confirmed})
          </TabsTrigger>
          <TabsTrigger value="packed" className="rounded-xl text-xs px-3">
            Packed ({statusCounts.packed})
          </TabsTrigger>
          <TabsTrigger value="shipped" className="rounded-xl text-xs px-3">
            Shipped ({statusCounts.shipped})
          </TabsTrigger>
          <TabsTrigger value="delivered" className="rounded-xl text-xs px-3">
            Delivered ({statusCounts.delivered})
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="rounded-xl text-xs px-3">
            Cancelled ({statusCounts.cancelled})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Comprehensive Secondary Filter Console */}
      <div className="bg-card border border-border/70 rounded-2xl p-3 shadow-xs space-y-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="w-full lg:w-72">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search order #, AWB, customer, city..."
              className="w-full"
            />
          </div>

          {/* Quick Filter Selects */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Payment Filter */}
            <Select value={paymentFilter} onValueChange={(val) => setPaymentFilter(val as PaymentFilter)}>
              <SelectTrigger className="h-9 rounded-xl text-xs w-[130px] bg-background">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Payments</SelectItem>
                <SelectItem value="paid" className="text-xs">Paid Only</SelectItem>
                <SelectItem value="unpaid" className="text-xs">Unpaid Only</SelectItem>
              </SelectContent>
            </Select>

            {/* Carrier Filter */}
            <Select value={carrierFilter} onValueChange={(val) => setCarrierFilter(val as CarrierFilter)}>
              <SelectTrigger className="h-9 rounded-xl text-xs w-[145px] bg-background">
                <SelectValue placeholder="Carrier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Carriers</SelectItem>
                <SelectItem value="pawconnect" className="text-xs">PawConnect Express</SelectItem>
                <SelectItem value="delhivery" className="text-xs">Delhivery</SelectItem>
                <SelectItem value="bluedart" className="text-xs">BlueDart</SelectItem>
                <SelectItem value="unassigned" className="text-xs">Unassigned AWB</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range Preset */}
            <Select value={dateFilter} onValueChange={(val) => setDateFilter(val as DateFilter)}>
              <SelectTrigger className="h-9 rounded-xl text-xs w-[125px] bg-background">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Time</SelectItem>
                <SelectItem value="today" className="text-xs">Today</SelectItem>
                <SelectItem value="7days" className="text-xs">Last 7 Days</SelectItem>
                <SelectItem value="30days" className="text-xs">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortBy)}>
              <SelectTrigger className="h-9 rounded-xl text-xs w-[140px] bg-background">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest" className="text-xs">Newest First</SelectItem>
                <SelectItem value="oldest" className="text-xs">Oldest First</SelectItem>
                <SelectItem value="amount_high" className="text-xs">Highest Amount</SelectItem>
                <SelectItem value="amount_low" className="text-xs">Lowest Amount</SelectItem>
                <SelectItem value="items_high" className="text-xs">Most Items</SelectItem>
              </SelectContent>
            </Select>

            {/* Reset All Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 px-2.5 rounded-xl text-xs text-muted-foreground hover:text-foreground gap-1.5"
                title="Reset all active filters"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </Button>
            )}
          </div>
        </div>

        {/* Active Filter Chips Bar */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/50 text-xs">
            <span className="text-[11px] font-semibold text-muted-foreground mr-1">
              Active Filters ({filteredOrders.length} matching):
            </span>
            {paymentFilter !== "all" && (
              <Badge variant="secondary" className="gap-1 text-xs py-0.5 px-2 rounded-lg">
                Payment: {paymentFilter.toUpperCase()}
                <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => setPaymentFilter("all")} />
              </Badge>
            )}
            {carrierFilter !== "all" && (
              <Badge variant="secondary" className="gap-1 text-xs py-0.5 px-2 rounded-lg">
                Carrier: {carrierFilter}
                <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => setCarrierFilter("all")} />
              </Badge>
            )}
            {dateFilter !== "all" && (
              <Badge variant="secondary" className="gap-1 text-xs py-0.5 px-2 rounded-lg">
                Date: {dateFilter}
                <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => setDateFilter("all")} />
              </Badge>
            )}
            {sortBy !== "newest" && (
              <Badge variant="secondary" className="gap-1 text-xs py-0.5 px-2 rounded-lg">
                Sort: {sortBy}
                <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => setSortBy("newest")} />
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="secondary" className="gap-1 text-xs py-0.5 px-2 rounded-lg">
                Search: &quot;{searchQuery}&quot;
                <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => setSearchQuery("")} />
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Orders DataTable */}
      <DataTable
        columns={columns}
        data={filteredOrders}
        keyExtractor={(o) => o.id}
        loading={isLoading}
        emptyTitle="No orders match your filter"
        emptyDescription="Try selecting another status tab or search phrase."
        emptyIcon={<ShoppingCart className="h-8 w-8 text-muted-foreground" />}
      />

      {/* Sticky Bulk Action Toolbar */}
      {selectedOrders.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-foreground/95 backdrop-blur-md text-background shadow-2xl rounded-2xl px-5 py-3 flex flex-wrap items-center gap-3 border border-border/20 animate-in fade-in slide-in-from-bottom-4 duration-200 max-w-[95vw]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">
              <strong className="text-primary font-bold">{selectedOrders.length}</strong> selected
            </span>
            <Badge variant="outline" className="text-[10px] bg-background/10 text-background/90 border-background/20 font-mono">
              {paidSelectedCount} Paid • {unpaidSelectedCount} Unpaid
            </Badge>
          </div>

          <div className="h-4 w-px bg-background/20 hidden sm:block" />

          {/* Bulk Print: 4x6 Thermal Labels */}
          <Button
            size="sm"
            onClick={() => {
              setBulkShippingMode("label");
              setBulkShippingModalOpen(true);
            }}
            className="rounded-xl text-xs font-semibold h-8 px-3.5 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
            title="Batch Print 4×6 inch Thermal Shift Labels"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Labels ({selectedOrders.length})</span>
          </Button>

          {/* Bulk Print: A4 Packing Slips */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setBulkShippingMode("packing_slip");
              setBulkShippingModalOpen(true);
            }}
            className="rounded-xl text-xs font-semibold h-8 px-3 gap-1.5 bg-background/10 text-background hover:bg-background/20 border-background/20"
            title="Batch Print Warehouse Packing Slips & Bills of Supply"
          >
            <ClipboardCheck className="h-3.5 w-3.5" />
            <span>Packing Slips ({selectedOrders.length})</span>
          </Button>

          {/* Bulk Status Change */}
          <Button
            size="sm"
            onClick={() => setBulkStatusDialogOpen(true)}
            className="rounded-xl text-xs font-semibold h-8 px-3.5 gap-1.5 bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm"
            title="Bulk Change Order Status"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Change Status</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedOrderIds(new Set())}
            className="rounded-xl text-xs h-8 px-2.5 text-background/80 hover:text-background hover:bg-background/10"
          >
            Clear
          </Button>
        </div>
      )}

      {/* Bulk Status Change Dialog */}
      <BulkOrderStatusDialog
        orders={selectedOrders}
        open={bulkStatusDialogOpen}
        onOpenChange={setBulkStatusDialogOpen}
        onSuccess={() => setSelectedOrderIds(new Set())}
      />

      {/* Dispatch & Single Status Update Dialog */}
      <OrderStatusDialog
        order={editingOrder}
        open={Boolean(editingOrder)}
        onOpenChange={(op) => !op && setEditingOrder(null)}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* Single Printable Shipping Label ("Shift Label") Modal */}
      <ShippingLabelModal
        order={shippingLabelOrder}
        open={Boolean(shippingLabelOrder)}
        onOpenChange={(op) => !op && setShippingLabelOrder(null)}
        initialMode={shippingLabelMode}
      />

      {/* Bulk Shipping Labels & Packing Slips Modal */}
      <ShippingLabelModal
        orders={selectedOrders}
        open={bulkShippingModalOpen}
        onOpenChange={setBulkShippingModalOpen}
        initialMode={bulkShippingMode}
      />

      {/* Printable GST Tax Invoice Modal */}
      <InvoiceModal
        open={Boolean(invoiceOrder)}
        onOpenChange={(op) => !op && setInvoiceOrder(null)}
        invoiceType="ORDER"
        resourceId={invoiceOrder?.id || null}
      />
    </div>
  );
}
