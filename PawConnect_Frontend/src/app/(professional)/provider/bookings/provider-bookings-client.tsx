"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { useProviderBookings, useUpdateProviderBookingStatus } from "@/lib/api/hooks";
import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { ProviderBookingModal } from "@/components/professional/provider-booking-modal";
import { LoadingState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatMoney } from "@/lib/utils/money";
import { toast } from "@/lib/utils/toast";
import {
  Calendar,
  Clock,
  Scissors,
  ChevronRight,
  FileText,
} from "lucide-react";
import { InvoiceModal } from "@/components/shared/invoice-modal";
import type {
  ProviderBooking,
  ProfessionalAppointmentStatus,
} from "@/lib/mock/professionals";

const FALLBACK_PET_IMAGE =
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&auto=format&fit=crop&q=80";

type StatusFilterTab = "all" | ProfessionalAppointmentStatus;
type CategoryFilter = "all" | "grooming" | "training";

export function ProviderBookingsClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<StatusFilterTab>("all");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [selectedBooking, setSelectedBooking] = useState<ProviderBooking | null>(null);
  const [invoiceBookingId, setInvoiceBookingId] = useState<string | null>(null);

  const { data: bookings = [], isLoading, isError, refetch } = useProviderBookings();
  const { mutateAsync: updateStatus, isPending: isUpdatingStatus } =
    useUpdateProviderBookingStatus();

  const filteredBookings = useMemo(() => {
    let result = [...bookings];

    // Status filter
    if (activeTab !== "all") {
      result = result.filter((b) => b.status === activeTab);
    }

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter((b) => b.serviceCategory === selectedCategory);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.bookingNumber.toLowerCase().includes(q) ||
          b.pet.name.toLowerCase().includes(q) ||
          b.pet.breed.toLowerCase().includes(q) ||
          b.owner.name.toLowerCase().includes(q) ||
          b.serviceName.toLowerCase().includes(q)
      );
    }

    // Sort by date descending
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return result;
  }, [bookings, activeTab, selectedCategory, searchQuery]);

  const handleUpdateStatus = async (
    id: string,
    status: ProfessionalAppointmentStatus
  ) => {
    try {
      await updateStatus({ id, status });
      toast.success("Booking Updated", {
        description: `Booking status changed to ${status}.`,
      });
      setSelectedBooking(null);
    } catch {
      toast.error("Update Failed", {
        description: "Could not update booking status.",
      });
    }
  };

  const columns: Column<ProviderBooking>[] = [
    {
      key: "bookingNumber",
      header: "Booking Reference",
      cell: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-foreground block">
            {row.bookingNumber}
          </span>
          <span className="text-[11px] text-muted-foreground line-clamp-1">
            {row.serviceName}
          </span>
        </div>
      ),
    },
    {
      key: "pet",
      header: "Pet Client",
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="relative h-9 w-9 rounded-xl overflow-hidden bg-secondary shrink-0 border border-border/60">
            <Image
              src={row.pet?.photo || FALLBACK_PET_IMAGE}
              alt={row.pet?.name || "Pet"}
              fill
              sizes="36px"
              className="object-cover"
            />
          </div>
          <div>
            <span className="text-xs font-bold text-foreground block">
              {row.pet.name}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {row.pet.species} • {row.pet.breed}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "owner",
      header: "Pet Parent",
      cell: (row) => (
        <div className="text-xs">
          <span className="font-medium text-foreground block">{row.owner.name}</span>
          <span className="text-muted-foreground text-[11px]">{row.owner.phone}</span>
        </div>
      ),
    },
    {
      key: "serviceCategory",
      header: "Type",
      cell: (row) => (
        <Badge
          variant="secondary"
          className="text-[10px] px-2 py-0.5 font-semibold capitalize"
        >
          {row.serviceCategory}
        </Badge>
      ),
    },
    {
      key: "schedule",
      header: "Session Schedule",
      cell: (row) => (
        <div className="text-xs">
          <div className="flex items-center gap-1 font-semibold text-foreground">
            <Calendar className="h-3 w-3 text-primary" />
            <span>{row.date}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
            <Clock className="h-3 w-3" />
            <span>{row.time} ({row.durationMinutes}m)</span>
          </div>
        </div>
      ),
    },
    {
      key: "price",
      header: "Price",
      cell: (row) => (
        <span className="text-xs font-bold text-foreground">
          {formatMoney(row.price)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setInvoiceBookingId(row.id);
            }}
            className="rounded-xl text-xs h-8 px-2.5 gap-1 font-medium border-primary/30 text-primary hover:bg-primary/10"
            title="View & Print Official Service Tax Invoice"
          >
            <FileText className="h-3.5 w-3.5" />
            Invoice
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedBooking(row)}
            className="rounded-xl text-xs h-8 px-2.5 gap-1 font-medium"
          >
            Manage
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Client Service Bookings"
        description="Review grooming spa appointments, positive training sessions, and client attendance."
      />

      {/* Filter Tabs & Category Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="overflow-x-auto pb-1 no-scrollbar">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as StatusFilterTab)}
            className="w-auto"
          >
            <TabsList className="h-10 p-1 rounded-2xl bg-secondary/80">
              <TabsTrigger value="all" className="rounded-xl text-xs px-3 font-semibold">
                All ({bookings.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="rounded-xl text-xs px-3 font-semibold">
                Upcoming
              </TabsTrigger>
              <TabsTrigger value="confirmed" className="rounded-xl text-xs px-3 font-semibold">
                Confirmed
              </TabsTrigger>
              <TabsTrigger value="in-progress" className="rounded-xl text-xs px-3 font-semibold">
                In Progress
              </TabsTrigger>
              <TabsTrigger value="completed" className="rounded-xl text-xs px-3 font-semibold">
                Completed
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="rounded-xl text-xs px-3 font-semibold">
                Cancelled
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Category Pills & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-border">
            {(["all", "grooming", "training"] as CategoryFilter[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition-colors ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-64">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search pet, owner, ref..."
            />
          </div>
        </div>
      </div>

      {/* DataTable / States */}
      {isLoading ? (
        <LoadingState variant="cards" count={6} columns={3} />
      ) : isError ? (
        <ErrorState
          title="Could not load bookings"
          description="Encountered an issue retrieving bookings data. Please retry."
          action={
            <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
              Retry
            </Button>
          }
        />
      ) : (
        <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-2xs">
          <DataTable
            columns={columns}
            data={filteredBookings}
            emptyTitle="No bookings found"
            emptyDescription={
              searchQuery
                ? `No records match "${searchQuery}". Try modifying your search criteria.`
                : activeTab === "all"
                ? "No client service bookings on record."
                : `No bookings currently in "${activeTab}" status.`
            }
            emptyIcon={<Scissors className="h-8 w-8 text-muted-foreground" />}
          />
        </div>
      )}

      {/* Details & Status Update Modal */}
      <ProviderBookingModal
        booking={selectedBooking}
        open={Boolean(selectedBooking)}
        onOpenChange={(op) => !op && setSelectedBooking(null)}
        onUpdateStatus={handleUpdateStatus}
        isUpdating={isUpdatingStatus}
      />

      {/* Printable Service GST Tax Invoice Modal */}
      <InvoiceModal
        open={Boolean(invoiceBookingId)}
        onOpenChange={(open) => !open && setInvoiceBookingId(null)}
        invoiceType="SERVICE_BOOKING"
        resourceId={invoiceBookingId}
      />
    </div>
  );
}
