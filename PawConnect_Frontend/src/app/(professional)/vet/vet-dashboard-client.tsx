"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  useVetProfile,
  useVetAppointments,
  useProfessionalAvailability,
  useUpdateVetAppointmentStatus,
} from "@/lib/api/hooks";
import { PageHeader } from "@/components/shared/page-header";
import { SectionHeader } from "@/components/shared/section-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LoadingState, EmptyState } from "@/components/shared/states";
import { RefreshIndicator } from "@/components/ui/paw-spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/lib/utils/toast";
import {
  CalendarDays,
  CalendarCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Stethoscope,
  ChevronRight,
  ShieldCheck,
  PlayCircle,
  Activity,
  User,
  Phone,
  FileText,
  Calendar,
} from "lucide-react";
import type { ProfessionalAppointmentStatus } from "@/lib/mock/professionals";

const FALLBACK_PET_IMAGE =
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&auto=format&fit=crop&q=80";

type VetTab = "today" | "upcoming" | "in-progress" | "completed" | "all";

export function VetDashboardClient() {
  const { data: profile } = useVetProfile();
  const { data: appointments = [], isLoading, isFetching } = useVetAppointments();
  const { data: availability } = useProfessionalAvailability("vet");
  const { mutateAsync: updateStatus, isPending: isUpdatingStatus } =
    useUpdateVetAppointmentStatus();

  // Active schedule tab state
  const [activeTab, setActiveTab] = useState<VetTab>("today");
  // Quick status update target state for confirmation dialog
  const [targetAction, setTargetAction] = useState<{
    appointmentId: string;
    appointmentNumber: string;
    status: ProfessionalAppointmentStatus;
  } | null>(null);

  // Compute dynamic date references
  const todayStr = useMemo(() => {
    // Check if any appointment matches the exact runtime date, else fallback to mock seed date
    const runtimeToday = new Date().toISOString().split("T")[0];
    const hasRuntimeToday = appointments.some((a) => a.date === runtimeToday);
    return hasRuntimeToday ? runtimeToday : "2026-10-08";
  }, [appointments]);

  // Derived filtered lists
  const todayAppointments = useMemo(
    () => appointments.filter((a) => a.date === todayStr),
    [appointments, todayStr]
  );

  const upcomingAppointments = useMemo(
    () => appointments.filter((a) => a.date > todayStr && a.status !== "cancelled"),
    [appointments, todayStr]
  );

  const inProgressAppointments = useMemo(
    () => appointments.filter((a) => a.status === "in-progress"),
    [appointments]
  );

  const completedAppointments = useMemo(
    () => appointments.filter((a) => a.status === "completed"),
    [appointments]
  );

  // Tab-selected list
  const displayedAppointments = useMemo(() => {
    switch (activeTab) {
      case "today":
        return todayAppointments;
      case "upcoming":
        return upcomingAppointments;
      case "in-progress":
        return inProgressAppointments;
      case "completed":
        return completedAppointments;
      case "all":
      default:
        return [...appointments].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }
  }, [
    activeTab,
    todayAppointments,
    upcomingAppointments,
    inProgressAppointments,
    completedAppointments,
    appointments,
  ]);

  const activeDaysCount =
    availability?.weeklySchedule.filter((d) => d.active).length || 0;

  const handleConfirmStatusChange = async () => {
    if (!targetAction) return;
    try {
      await updateStatus({
        id: targetAction.appointmentId,
        status: targetAction.status,
      });
      toast.success("Consultation Status Updated", {
        description: `Appointment ${targetAction.appointmentNumber} updated to ${targetAction.status}.`,
      });
      setTargetAction(null);
    } catch {
      toast.error("Status Update Failed", {
        description: "Could not update the appointment. Please try again.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 pb-16">
        <PageHeader
          title={`Welcome back, ${profile?.name || "Doctor"}`}
          description={`${profile?.clinic || "PawConnect Central Animal Hospital"} • Clinical Operations`}
        />
        <LoadingState variant="dashboard" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <PageHeader
        title={`Welcome back, ${profile?.name || "Dr. Vance"}`}
        description={`${profile?.clinic || "PawConnect Central Animal Hospital"} • Clinical Practice & Operations`}
      >
        <div className="flex items-center gap-2">
          <RefreshIndicator isRefreshing={isFetching && !isLoading} label="Syncing..." />
          {profile?.verificationStatus === "verified" ? (
            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-1">
              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
              Verified Practitioner
            </Badge>
          ) : (
            <StatusBadge status={profile?.verificationStatus || "pending"} />
          )}
        </div>
      </PageHeader>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Appointments"
          value={todayAppointments.length}
          description="Patients scheduled for today"
          icon={<CalendarDays className="h-5 w-5 text-primary" />}
        />
        <StatCard
          title="Upcoming Schedule"
          value={upcomingAppointments.length}
          description="Confirmed future consults"
          icon={<CalendarCheck className="h-5 w-5 text-sky-600" />}
        />
        <StatCard
          title="In-Exam Sessions"
          value={inProgressAppointments.length}
          description="Patients currently in consult"
          icon={<Activity className="h-5 w-5 text-amber-600" />}
        />
        <StatCard
          title="Completed Consults"
          value={completedAppointments.length}
          description="Discharged patient files"
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Appointments Schedule List with Tabs */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <SectionHeader
              title="Patient Consultations"
              description="Review scheduled clinical exams, follow-ups, and patient discharge statuses."
            />
            <Button asChild variant="outline" size="sm" className="rounded-xl text-xs h-8.5 gap-1 shrink-0">
              <Link href="/vet/appointments">
                All Records ({appointments.length})
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </div>

          {/* Schedule Filter Tabs */}
          <div className="overflow-x-auto pb-1 no-scrollbar">
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as VetTab)}
              className="w-auto"
            >
              <TabsList className="h-9 p-1 rounded-2xl bg-secondary/80">
                <TabsTrigger value="today" className="rounded-xl text-xs px-3 font-semibold">
                  Today ({todayAppointments.length})
                </TabsTrigger>
                <TabsTrigger value="upcoming" className="rounded-xl text-xs px-3 font-semibold">
                  Upcoming ({upcomingAppointments.length})
                </TabsTrigger>
                <TabsTrigger value="in-progress" className="rounded-xl text-xs px-3 font-semibold">
                  In Exam ({inProgressAppointments.length})
                </TabsTrigger>
                <TabsTrigger value="completed" className="rounded-xl text-xs px-3 font-semibold">
                  Completed ({completedAppointments.length})
                </TabsTrigger>
                <TabsTrigger value="all" className="rounded-xl text-xs px-3 font-semibold">
                  All ({appointments.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Appointments List */}
          {displayedAppointments.length === 0 ? (
            <EmptyState
              icon={<Stethoscope className="h-8 w-8 text-muted-foreground" />}
              title={
                activeTab === "today"
                  ? "No appointments scheduled for today"
                  : activeTab === "upcoming"
                  ? "No upcoming appointments scheduled"
                  : activeTab === "in-progress"
                  ? "No patient consultations currently in exam"
                  : "No appointments found in this view"
              }
              description="Upcoming appointments and client bookings will populate here automatically."
            />
          ) : (
            <div className="space-y-3">
              {displayedAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="rounded-3xl border border-border/80 bg-card p-4 sm:p-5 transition-[border-color,box-shadow] duration-200 hover:shadow-sm hover:border-primary/40 motion-reduce:transition-none flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left: Patient & Time Info */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Time badge */}
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex flex-col items-center justify-center shrink-0 text-primary">
                      <Clock className="h-4 w-4" />
                      <span className="text-[10px] font-bold mt-0.5">
                        {appt.time.split(" ")[0]}
                      </span>
                    </div>

                    {/* Pet Image */}
                    <div className="relative h-12 w-12 rounded-2xl overflow-hidden bg-secondary shrink-0 border border-border/60">
                      <Image
                        src={appt.pet?.photo || FALLBACK_PET_IMAGE}
                        alt={appt.pet?.name || "Patient"}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>

                    {/* Patient & Owner Details */}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-foreground text-sm truncate">
                          {appt.pet?.name}
                        </span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
                          {appt.pet?.species} • {appt.pet?.breed}
                        </Badge>
                        <StatusBadge status={appt.status} size="sm" />
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{appt.type}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Calendar className="h-3 w-3" />
                          {appt.date} ({appt.durationMinutes}m)
                        </span>
                      </div>

                      {/* Owner info */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3 text-primary" />
                          {appt.owner?.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {appt.owner?.phone}
                        </span>
                      </div>

                      {/* Reason preview */}
                      {appt.reason && (
                        <p className="text-[11px] text-muted-foreground/90 italic line-clamp-1 pt-0.5">
                          &ldquo;{appt.reason}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center justify-end shrink-0 gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-border/50">
                    {/* Quick status actions */}
                    {(appt.status === "upcoming" || appt.status === "confirmed") && (
                      <Button
                        size="sm"
                        onClick={() =>
                          setTargetAction({
                            appointmentId: appt.id,
                            appointmentNumber: appt.appointmentNumber,
                            status: "in-progress",
                          })
                        }
                        disabled={isUpdatingStatus}
                        className="rounded-xl text-xs font-semibold gap-1 h-8.5"
                      >
                        <PlayCircle className="h-3.5 w-3.5" />
                        Start Exam
                      </Button>
                    )}

                    {appt.status === "in-progress" && (
                      <Button
                        size="sm"
                        onClick={() =>
                          setTargetAction({
                            appointmentId: appt.id,
                            appointmentNumber: appt.appointmentNumber,
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
                      asChild
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs font-semibold h-8.5 gap-1"
                    >
                      <Link href={`/vet/appointments/${appt.id}`}>
                        Patient File
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Availability & Practitioner Info */}
        <div className="lg:col-span-4 space-y-6">
          {/* Duty Schedule Card */}
          <Card className="rounded-3xl border-border/80 p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Weekly Duty Schedule</h3>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs h-7 text-primary p-0 font-medium">
                <Link href="/vet/availability">Configure</Link>
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
                    <span className="text-muted-foreground/70 italic text-[11px]">Off Duty</span>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-1 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Active Bookable Duty:</span>
              <span className="font-bold text-foreground">{activeDaysCount} Days / Wk</span>
            </div>

            <Button asChild variant="outline" size="sm" className="w-full rounded-2xl text-xs h-9 font-medium">
              <Link href="/vet/availability">Manage Full Weekly Roster</Link>
            </Button>
          </Card>

          {/* Practitioner Profile Snapshot */}
          <Card className="rounded-3xl border-border/80 p-5 space-y-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 rounded-2xl overflow-hidden bg-secondary shrink-0 border border-border/60">
                {profile?.photo ? (
                  <Image
                    src={profile.photo}
                    alt={profile.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary">
                    <Stethoscope className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-foreground truncate">{profile?.name}</h4>
                <p className="text-[11px] text-muted-foreground truncate">{profile?.qualification}</p>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mt-0.5">
                  {profile?.clinic || "PawConnect Central Hospital"}
                </Badge>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
              {profile?.bio ||
                "Dedicated veterinary practitioner providing compassionate medical care, diagnostics, and routine wellness for pets."}
            </p>

            <Button asChild variant="ghost" size="sm" className="w-full rounded-2xl text-xs h-8 text-primary font-semibold">
              <Link href="/vet/profile">View Practitioner Profile</Link>
            </Button>
          </Card>

          {/* Clinical Standards & Triage Notice */}
          <Card className="rounded-3xl border-border/80 bg-surface/50 p-4 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <FileText className="h-3.5 w-3.5 text-primary" />
              <span>Veterinary Compliance Protocol</span>
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Ensure all clinical consultation notes, prescriptions, and immunization logs are saved immediately upon discharge to synchronize with the patient&apos;s digital health passport.
            </p>
          </Card>
        </div>
      </div>

      {/* Quick Action Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(targetAction)}
        onOpenChange={(op) => !op && setTargetAction(null)}
        title={`Advance Appointment to "${targetAction?.status}"?`}
        description={`Confirming will update appointment ${targetAction?.appointmentNumber} to status "${targetAction?.status}".`}
        confirmLabel="Confirm Status Change"
        onConfirm={handleConfirmStatusChange}
      />
    </div>
  );
}
