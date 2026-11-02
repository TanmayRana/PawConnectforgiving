"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { BookingCard } from "@/components/shared/booking-card";
import { SearchBar } from "@/components/shared/search-bar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  LoadingState,
  ErrorState,
} from "@/components/shared/states";
import { useBookings } from "@/lib/api/hooks";
import { RefreshIndicator } from "@/components/ui/paw-spinner";
import {
  Plus,
  CalendarDays,
  Stethoscope,
  Scissors,
  Award,
  Filter,
  RotateCcw,
} from "lucide-react";

type ServiceFilter = "all" | "veterinary" | "grooming" | "training";
type StatusFilter = "all" | "upcoming" | "completed" | "cancelled";

export function BookingsClient() {
  const {
    data: bookings = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useBookings();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [serviceFilter, setServiceFilter] =
    React.useState<ServiceFilter>("all");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");

  const counts = React.useMemo(() => {
    const all = bookings.length;
    const upcoming = bookings.filter((b) => {
      const s = (b.status || "").toLowerCase();
      return (
        s === "scheduled" ||
        s === "confirmed" ||
        s === "in-progress" ||
        s === "in_progress" ||
        s === "pending" ||
        s === "upcoming"
      );
    }).length;
    const completed = bookings.filter(
      (b) => (b.status || "").toLowerCase() === "completed",
    ).length;
    const cancelled = bookings.filter((b) => {
      const s = (b.status || "").toLowerCase();
      return s === "cancelled" || s === "no-show" || s === "no_show";
    }).length;
    return { all, upcoming, completed, cancelled };
  }, [bookings]);

  const filteredBookings = React.useMemo(() => {
    return bookings.filter((b) => {
      // 1. Service filter
      const matchesService =
        serviceFilter === "all" || b.type?.toLowerCase() === serviceFilter;

      // 2. Status filter
      const s = (b.status || "").toLowerCase();
      let matchesStatus = true;
      if (statusFilter === "upcoming") {
        matchesStatus =
          s === "scheduled" ||
          s === "confirmed" ||
          s === "in-progress" ||
          s === "in_progress" ||
          s === "pending" ||
          s === "upcoming";
      } else if (statusFilter === "completed") {
        matchesStatus = s === "completed";
      } else if (statusFilter === "cancelled") {
        matchesStatus = s === "cancelled" || s === "no-show" || s === "no_show";
      }

      // 3. Search query
      let matchesSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        matchesSearch =
          (b.appointmentNumber?.toLowerCase().includes(q) ?? false) ||
          (b.providerName?.toLowerCase().includes(q) ?? false) ||
          (b.providerClinicOrBusiness?.toLowerCase().includes(q) ?? false) ||
          (b.serviceTitle?.toLowerCase().includes(q) ?? false) ||
          (b.petName?.toLowerCase().includes(q) ?? false) ||
          (b.petBreed?.toLowerCase().includes(q) ?? false);
      }

      return matchesService && matchesStatus && matchesSearch;
    });
  }, [bookings, serviceFilter, statusFilter, searchQuery]);

  const hasActiveFilters =
    serviceFilter !== "all" ||
    statusFilter !== "all" ||
    searchQuery.trim().length > 0;

  const handleResetFilters = () => {
    setServiceFilter("all");
    setStatusFilter("all");
    setSearchQuery("");
  };

  if (error) {
    return (
      <ErrorState
        title="Could Not Load Bookings"
        description="There was a temporary problem fetching your appointments."
        action={
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <PageHeader
            title="Care Bookings & Appointments"
            description="Manage your upcoming clinical visits, spa sessions, and training routines."
          />
          <RefreshIndicator
            isRefreshing={isFetching && !isLoading}
            label="Refreshing..."
          />
        </div>
        <Button
          asChild
          className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shrink-0"
        >
          <Link href="/app/services/veterinary">
            <Plus className="w-4 h-4" />
            Book Care
          </Link>
        </Button>
      </div>

      {/* Filter Matrix */}
      <div className="bg-card p-5 rounded-3xl border border-border/80 shadow-xs space-y-4">
        {/* Top Row: Status Tabs & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Tabs
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as StatusFilter)}
            className="w-full md:w-auto"
          >
            <TabsList className="h-10 p-1 rounded-2xl bg-secondary/80 w-full sm:w-auto grid grid-cols-4 sm:flex sm:flex-wrap">
              <TabsTrigger
                value="all"
                className="rounded-xl text-xs px-3 font-semibold gap-1.5"
              >
                <span>All</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-background/80 text-foreground font-mono">
                  {counts.all}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="upcoming"
                className="rounded-xl text-xs px-3 font-semibold gap-1.5"
              >
                <span>Upcoming</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-background/80 text-foreground font-mono">
                  {counts.upcoming}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="rounded-xl text-xs px-3 font-semibold gap-1.5"
              >
                <span>Completed</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-background/80 text-foreground font-mono">
                  {counts.completed}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="cancelled"
                className="rounded-xl text-xs px-3 font-semibold gap-1.5"
              >
                <span>Cancelled</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-background/80 text-foreground font-mono">
                  {counts.cancelled}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="w-full md:w-72">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by pet, provider, service..."
            />
          </div>
        </div>

        {/* Bottom Row: Service Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-3 border-t border-border/60">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            Service:
          </span>
          {[
            { id: "all", label: "All Services", icon: CalendarDays },
            { id: "veterinary", label: "Veterinary", icon: Stethoscope },
            { id: "grooming", label: "Grooming", icon: Scissors },
            { id: "training", label: "Training", icon: Award },
          ].map((item) => {
            const Icon = item.icon;
            const active = serviceFilter === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setServiceFilter(item.id as ServiceFilter)}
                className={`text-xs px-3.5 py-1.5 rounded-xl font-medium transition-[color,background-color,border-color,box-shadow] duration-150 motion-reduce:transition-none flex items-center gap-1.5 shrink-0 ${
                  active
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "bg-secondary/60 text-secondary-foreground hover:bg-secondary border border-border/50"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 ml-auto shrink-0 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Bookings Count */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing{" "}
          <strong className="text-foreground">{filteredBookings.length}</strong>{" "}
          of {bookings.length} bookings
        </span>
      </div>

      {/* Bookings Content */}
      {isLoading ? (
        <div className="py-4">
          <LoadingState variant="cards" count={6} />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-card rounded-3xl p-12 border border-border/80 text-center">
          <EmptyState
            title="No Bookings Match Your Criteria"
            description={
              bookings.length === 0
                ? "You haven't scheduled any pet care appointments yet."
                : hasActiveFilters
                  ? "No appointments match your active service, status, or search filters."
                  : "Try switching service or status filters to see other appointments."
            }
            action={
              hasActiveFilters ? (
                <Button
                  onClick={handleResetFilters}
                  variant="outline"
                  className="rounded-xl"
                >
                  Clear All Filters
                </Button>
              ) : (
                <Button
                  asChild
                  className="rounded-xl bg-paw-coral hover:bg-paw-coral-dark text-white"
                >
                  <Link href="/app/services/veterinary">
                    Explore Care Services
                  </Link>
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}
