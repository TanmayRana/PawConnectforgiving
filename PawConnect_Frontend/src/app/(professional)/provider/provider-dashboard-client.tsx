"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  useProviderProfile,
  useProviderBookings,
  useProviderServices,
  useProfessionalAvailability,
  useUpdateProviderBookingStatus,
} from "@/lib/api/hooks";
import { PageHeader } from "@/components/shared/page-header";
import { SectionHeader } from "@/components/shared/section-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { ProviderBookingModal } from "@/components/professional/provider-booking-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LoadingState, EmptyState } from "@/components/shared/states";
import { RefreshIndicator } from "@/components/ui/paw-spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatMoney } from "@/lib/utils/money";
import { toast } from "@/lib/utils/toast";
import {
  CalendarDays,
  CalendarCheck,
  Clock,
  ArrowRight,
  Scissors,
  ShoppingBag,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  PlayCircle,
  CheckCircle2,
  Activity,
  User,
  Phone,
  Calendar,
} from "lucide-react";
import type { ProviderBooking, ProfessionalAppointmentStatus } from "@/lib/mock/professionals";

const FALLBACK_PET_IMAGE =
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&auto=format&fit=crop&q=80";

type ProviderTab = "today" | "upcoming" | "in-progress" | "completed" | "all";

export function ProviderDashboardClient() {
  const { data: profile } = useProviderProfile();
  const { data: bookings = [], isLoading, isFetching } = useProviderBookings();
  const { data: services = [] } = useProviderServices();
  const { data: availability } = useProfessionalAvailability("provider");
  const { mutateAsync: updateStatus, isPending: isUpdatingStatus } =
    useUpdateProviderBookingStatus();

  const [activeTab, setActiveTab] = useState<ProviderTab>("today");
  const [selectedBooking, setSelectedBooking] = useState<ProviderBooking | null>(null);
  const [targetQuickAction, setTargetQuickAction] = useState<{
    bookingId: string;
    bookingNumber: string;
    status: ProfessionalAppointmentStatus;
  } | null>(null);

  // Compute dynamic date references
  const todayStr = useMemo(() => {
    const runtimeToday = new Date().toISOString().split("T")[0];
    const hasRuntimeToday = bookings.some((b) => b.date === runtimeToday);
    return hasRuntimeToday ? runtimeToday : "2026-10-08";
  }, [bookings]);

  const todayBookings = useMemo(
    () => bookings.filter((b) => b.date === todayStr),
    [bookings, todayStr]
  );

  const upcomingBookings = useMemo(
    () => bookings.filter((b) => b.date > todayStr && b.status !== "cancelled"),
    [bookings, todayStr]
  );

  const inProgressBookings = useMemo(
    () => bookings.filter((b) => b.status === "in-progress"),
    [bookings]
  );

  const completedBookings = useMemo(
    () => bookings.filter((b) => b.status === "completed"),
    [bookings]
  );

  const displayedBookings = useMemo(() => {
    switch (activeTab) {
      case "today":
        return todayBookings;
      case "upcoming":
        return upcomingBookings;
      case "in-progress":
        return inProgressBookings;
      case "completed":
        return completedBookings;
      case "all":
      default:
        return [...bookings].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }
  }, [
    activeTab,
    todayBookings,
    upcomingBookings,
    inProgressBookings,
    completedBookings,
    bookings,
  ]);

  const activeServices = services.filter((s) => s.active);
  const activeDaysCount =
    availability?.weeklySchedule.filter((d) => d.active).length || 0;

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
      setTargetQuickAction(null);
    } catch {
      toast.error("Update Failed", {
        description: "Could not update booking status. Please try again.",
      });
    }
  };

  const handleConfirmQuickAction = async () => {
    if (!targetQuickAction) return;
    await handleUpdateStatus(targetQuickAction.bookingId, targetQuickAction.status);
  };

  if (isLoading) {
    return (
      <div className="space-y-8 pb-16">
        <PageHeader
          title={`Welcome, ${profile?.name || "Care Provider"}`}
          description={`${profile?.businessName || "PawConnect Wellness"} • Provider Operations`}
        />
        <LoadingState variant="dashboard" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <PageHeader
        title={`Welcome, ${profile?.name || "Chloe"}`}
        description={`${profile?.businessName || "Posh Paws Luxury Spa & Academy"} • Provider Operations`}
      >
        <div className="flex items-center gap-2">
          <RefreshIndicator isRefreshing={isFetching && !isLoading} label="Syncing..." />
          {profile?.verificationStatus === "verified" ? (
            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-1">
              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
              Verified Care Professional
            </Badge>
          ) : (
            <StatusBadge status={profile?.verificationStatus || "pending"} />
          )}
        </div>
      </PageHeader>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Sessions"
          value={todayBookings.length}
          description="Grooming & training today"
          icon={<CalendarDays className="h-5 w-5 text-primary" />}
        />
        <StatCard
          title="Upcoming Bookings"
          value={upcomingBookings.length}
          description="Confirmed future sessions"
          icon={<CalendarCheck className="h-5 w-5 text-sky-600" />}
        />
        <StatCard
          title="In-Session Treatments"
          value={inProgressBookings.length}
          description="Pets currently in care"
          icon={<Activity className="h-5 w-5 text-amber-600" />}
        />
        <StatCard
          title="Active Services"
          value={`${activeServices.length} Active`}
          description={`${services.length} Total service packages`}
          icon={<ShoppingBag className="h-5 w-5 text-emerald-600" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Bookings Schedule */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <SectionHeader
              title="Care Sessions & Client Bookings"
              description="Manage arriving pet clients for luxury spa grooming, behavioral training, and wellness."
            />
            <Button asChild variant="outline" size="sm" className="rounded-xl text-xs h-8.5 gap-1 shrink-0">
              <Link href="/provider/bookings">
                All Bookings ({bookings.length})
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </div>

          {/* Schedule Filter Tabs */}
          <div className="overflow-x-auto pb-1 no-scrollbar">
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as ProviderTab)}
              className="w-auto"
            >
              <TabsList className="h-9 p-1 rounded-2xl bg-secondary/80">
                <TabsTrigger value="today" className="rounded-xl text-xs px-3 font-semibold">
                  Today ({todayBookings.length})
                </TabsTrigger>
                <TabsTrigger value="upcoming" className="rounded-xl text-xs px-3 font-semibold">
                  Upcoming ({upcomingBookings.length})
                </TabsTrigger>
                <TabsTrigger value="in-progress" className="rounded-xl text-xs px-3 font-semibold">
                  In Session ({inProgressBookings.length})
                </TabsTrigger>
                <TabsTrigger value="completed" className="rounded-xl text-xs px-3 font-semibold">
                  Completed ({completedBookings.length})
                </TabsTrigger>
                <TabsTrigger value="all" className="rounded-xl text-xs px-3 font-semibold">
                  All ({bookings.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Sessions List */}
          {displayedBookings.length === 0 ? (
            <EmptyState
              icon={<Scissors className="h-8 w-8 text-muted-foreground" />}
              title={
                activeTab === "today"
                  ? "No sessions scheduled for today"
                  : activeTab === "upcoming"
                  ? "No upcoming bookings scheduled"
                  : activeTab === "in-progress"
                  ? "No clients currently in an active session"
                  : "No bookings found in this view"
              }
              description="Client grooming and training bookings will populate here automatically."
            />
          ) : (
            <div className="space-y-3">
              {displayedBookings.map((b) => (
                <div
                  key={b.id}
                  className="rounded-3xl border border-border/80 bg-card p-4 sm:p-5 transition-[border-color,box-shadow] duration-200 hover:shadow-sm hover:border-primary/40 motion-reduce:transition-none flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left: Pet, Service & Client Info */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Time Badge */}
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex flex-col items-center justify-center shrink-0 text-primary">
                      <Clock className="h-4 w-4" />
                      <span className="text-[10px] font-bold mt-0.5">
                        {b.time.split(" ")[0]}
                      </span>
                    </div>

                    {/* Pet Image */}
                    <div className="relative h-12 w-12 rounded-2xl overflow-hidden bg-secondary shrink-0 border border-border/60">
                      <Image
                        src={b.pet?.photo || FALLBACK_PET_IMAGE}
                        alt={b.pet?.name || "Pet"}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-foreground text-sm truncate">
                          {b.pet?.name}
                        </span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
                          {b.pet?.species} • {b.pet?.breed}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 capitalize border-border/80 font-medium"
                        >
                          {b.serviceCategory}
                        </Badge>
                        <StatusBadge status={b.status} size="sm" />
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{b.serviceName}</span>
                        <span>•</span>
                        <span className="font-black text-foreground">{formatMoney(b.price)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Calendar className="h-3 w-3" />
                          {b.date} ({b.durationMinutes}m)
                        </span>
                      </div>

                      {/* Owner details */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3 text-primary" />
                          {b.owner?.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {b.owner?.phone}
                        </span>
                      </div>

                      {/* Notes snippet */}
                      {b.notes && (
                        <p className="text-[11px] text-muted-foreground/90 italic line-clamp-1 pt-0.5">
                          &ldquo;{b.notes}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Quick Actions */}
                  <div className="flex items-center justify-end shrink-0 gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-border/50">
                    {(b.status === "upcoming" || b.status === "confirmed") && (
                      <Button
                        size="sm"
                        onClick={() =>
                          setTargetQuickAction({
                            bookingId: b.id,
                            bookingNumber: b.bookingNumber,
                            status: "in-progress",
                          })
                        }
                        disabled={isUpdatingStatus}
                        className="rounded-xl text-xs font-semibold gap-1 h-8.5"
                      >
                        <PlayCircle className="h-3.5 w-3.5" />
                        Start Session
                      </Button>
                    )}

                    {b.status === "in-progress" && (
                      <Button
                        size="sm"
                        onClick={() =>
                          setTargetQuickAction({
                            bookingId: b.id,
                            bookingNumber: b.bookingNumber,
                            status: "completed",
                          })
                        }
                        disabled={isUpdatingStatus}
                        className="rounded-xl text-xs font-semibold gap-1 h-8.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Complete
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedBooking(b)}
                      className="rounded-xl text-xs font-semibold h-8.5 gap-1"
                    >
                      Session File
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Service Catalog & Availability */}
        <div className="lg:col-span-4 space-y-6">
          {/* Active Services Snapshot */}
          <Card className="rounded-3xl border-border/80 p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Service Catalog</h3>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs h-7 text-primary p-0 font-medium">
                <Link href="/provider/services">Manage</Link>
              </Button>
            </div>

            <div className="space-y-2.5 text-xs">
              {services.slice(0, 4).map((srv) => (
                <div
                  key={srv.id}
                  className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="font-semibold text-foreground truncate block">
                      {srv.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {srv.durationMinutes}m • {formatMoney(srv.price)}
                    </span>
                  </div>
                  {srv.active ? (
                    <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] px-1.5 py-0">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                      Inactive
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            <Button asChild variant="outline" size="sm" className="w-full rounded-2xl text-xs h-9 font-medium">
              <Link href="/provider/services">Configure Service Catalog</Link>
            </Button>
          </Card>

          {/* Working Hours & Availability */}
          <Card className="rounded-3xl border-border/80 p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Operating Hours</h3>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs h-7 text-primary p-0 font-medium">
                <Link href="/provider/availability">Configure</Link>
              </Button>
            </div>

            <div className="space-y-2 text-xs">
              {availability?.weeklySchedule.slice(0, 6).map((d) => (
                <div
                  key={d.day}
                  className="flex items-center justify-between py-1 border-b border-border/40 last:border-0"
                >
                  <span className="text-foreground font-medium">{d.day}</span>
                  {d.active ? (
                    <span className="text-muted-foreground font-mono">
                      {d.startTime} - {d.endTime}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/70 italic text-[11px]">Closed</span>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-1 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Weekly Bookable Days:</span>
              <span className="font-bold text-foreground">{activeDaysCount} Days</span>
            </div>

            <Button asChild variant="outline" size="sm" className="w-full rounded-2xl text-xs h-9 font-medium">
              <Link href="/provider/availability">Manage Provider Availability</Link>
            </Button>
          </Card>
        </div>
      </div>

      {/* Booking Details Modal */}
      <ProviderBookingModal
        booking={selectedBooking}
        open={Boolean(selectedBooking)}
        onOpenChange={(op) => !op && setSelectedBooking(null)}
        onUpdateStatus={handleUpdateStatus}
        isUpdating={isUpdatingStatus}
      />

      {/* Quick Action Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(targetQuickAction)}
        onOpenChange={(op) => !op && setTargetQuickAction(null)}
        title={`Advance Booking to "${targetQuickAction?.status}"?`}
        description={`Are you sure you want to change booking ${targetQuickAction?.bookingNumber} to "${targetQuickAction?.status}"?`}
        confirmLabel="Confirm Status Change"
        onConfirm={handleConfirmQuickAction}
      />
    </div>
  );
}
