"use client";

import React, { useState, useMemo } from "react";
import {
  useAdminBookings,
  useUpdateAdminBookingStatus,
} from "@/lib/api/hooks";
import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { BookingDetailDrawer } from "@/components/admin/booking-detail-drawer";
import { InvoiceModal } from "@/components/shared/invoice-modal";
import { LoadingState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatMoney } from "@/lib/utils/money";
import { toast } from "@/lib/utils/toast";
import {
  CalendarDays,
  Clock,
  Eye,
  Receipt,
  FileText,
} from "lucide-react";
import type { AdminGlobalBooking } from "@/lib/mock/admin";
import type { ProfessionalAppointmentStatus } from "@/lib/mock/professionals";

type DisciplineTab = "all" | "veterinary" | "grooming" | "training";

export function AdminBookingsClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [disciplineTab, setDisciplineTab] = useState<DisciplineTab>("all");
  const [selectedBooking, setSelectedBooking] = useState<AdminGlobalBooking | null>(null);
  const [invoiceBooking, setInvoiceBooking] = useState<AdminGlobalBooking | null>(null);

  const { data: bookings = [], isLoading, isError, refetch } = useAdminBookings();
  const { mutateAsync: updateStatus, isPending: isUpdating } = useUpdateAdminBookingStatus();

  const filteredBookings = useMemo(() => {
    let result = [...bookings];

    if (disciplineTab !== "all") {
      result = result.filter((b) => b.type === disciplineTab);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.bookingNumber.toLowerCase().includes(q) ||
          b.customerName.toLowerCase().includes(q) ||
          b.petName.toLowerCase().includes(q) ||
          b.providerName.toLowerCase().includes(q) ||
          b.serviceTitle.toLowerCase().includes(q)
      );
    }

    return result;
  }, [bookings, disciplineTab, searchQuery]);

  const handleUpdateStatus = async (id: string, status: ProfessionalAppointmentStatus) => {
    try {
      await updateStatus({ id, status });
      toast.success("Booking Status Updated", {
        description: `Session set to '${status}'.`,
      });
      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking({ ...selectedBooking, status });
      }
    } catch {
      toast.error("Update Failed");
    }
  };

  const typeColorMap = {
    veterinary: "bg-primary/10 text-primary border-primary/20",
    grooming: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    training: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
  };

  const columns: Column<AdminGlobalBooking>[] = [
    {
      key: "booking",
      header: "Booking # & Service",
      render: (b) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-foreground text-xs">{b.bookingNumber}</span>
            <Badge className={typeColorMap[b.type] + " text-[9px] capitalize py-0 px-1.5"}>
              {b.type}
            </Badge>
          </div>
          <span className="text-xs font-medium text-foreground block truncate max-w-[200px]">
            {b.serviceTitle}
          </span>
        </div>
      ),
    },
    {
      key: "patient",
      header: "Patient / Pet",
      render: (b) => (
        <div className="space-y-0.5 text-xs">
          <span className="font-bold text-foreground block">{b.petName}</span>
          <span className="text-[11px] text-muted-foreground block">
            {b.petBreed} • {b.petSpecies}
          </span>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Pet Parent",
      render: (b) => (
        <div className="space-y-0.5 text-xs">
          <span className="font-medium text-foreground block truncate">{b.customerName}</span>
          <span className="text-[11px] text-muted-foreground block truncate">{b.customerPhone}</span>
        </div>
      ),
    },
    {
      key: "provider",
      header: "Care Provider",
      render: (b) => (
        <div className="space-y-0.5 text-xs">
          <span className="font-semibold text-foreground block truncate">{b.providerName}</span>
          <span className="text-[11px] text-muted-foreground block truncate">{b.providerClinic}</span>
        </div>
      ),
    },
    {
      key: "schedule",
      header: "Schedule & Fee",
      render: (b) => (
        <div className="space-y-0.5 text-xs">
          <span className="font-semibold text-foreground block">{b.date}</span>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {b.time} • {formatMoney(b.price)}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Session Status",
      render: (b) => <StatusBadge status={b.status} size="sm" />,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (b) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInvoiceBooking(b)}
            className="rounded-xl text-xs h-8 px-2.5 gap-1 text-foreground hover:text-primary hover:border-primary/40"
            title="View Official GST Tax Invoice"
          >
            <Receipt className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">Invoice</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedBooking(b)}
            className="rounded-xl text-xs h-8 gap-1"
          >
            <Eye className="h-3.5 w-3.5" />
            Details
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="py-6">
        <LoadingState variant="table" count={6} message="Loading platform bookings registry..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12">
        <ErrorState
          title="Could not load bookings"
          description="Encountered an issue retrieving bookings across practices."
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
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Global Bookings Registry"
        description="Unified platform schedule covering veterinary clinic consults, grooming treatments, and behavior training."
      />

      {/* Filter Tabs by Discipline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs
          value={disciplineTab}
          onValueChange={(val) => setDisciplineTab(val as DisciplineTab)}
          className="w-full sm:w-auto"
        >
          <TabsList className="bg-secondary/60 p-1 rounded-2xl h-10">
            <TabsTrigger value="all" className="rounded-xl text-xs px-3">
              All Disciplines ({bookings.length})
            </TabsTrigger>
            <TabsTrigger value="veterinary" className="rounded-xl text-xs px-3">
              Veterinary
            </TabsTrigger>
            <TabsTrigger value="grooming" className="rounded-xl text-xs px-3">
              Grooming
            </TabsTrigger>
            <TabsTrigger value="training" className="rounded-xl text-xs px-3">
              Training
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search */}
        <div className="w-full sm:w-72">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search booking #, pet, client..."
            className="w-full"
          />
        </div>
      </div>

      {/* Bookings DataTable */}
      <DataTable
        columns={columns}
        data={filteredBookings}
        keyExtractor={(b) => b.id}
        emptyTitle="No bookings found"
        emptyDescription="Try clearing filters or search query."
        emptyIcon={<CalendarDays className="h-8 w-8 text-muted-foreground" />}
      />

      {/* Contextual Detail Drawer */}
      <BookingDetailDrawer
        booking={selectedBooking}
        open={Boolean(selectedBooking)}
        onOpenChange={(op) => !op && setSelectedBooking(null)}
        onUpdateStatus={handleUpdateStatus}
        loading={isUpdating}
      />

      {/* Official Universal GST Tax Invoice Modal */}
      <InvoiceModal
        open={Boolean(invoiceBooking)}
        onOpenChange={(op) => !op && setInvoiceBooking(null)}
        invoiceType={invoiceBooking?.type === "veterinary" ? "APPOINTMENT" : "SERVICE_BOOKING"}
        resourceId={invoiceBooking?.id || null}
      />
    </div>
  );
}
