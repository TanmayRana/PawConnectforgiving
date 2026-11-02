"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useVetAppointment, useUpdateVetAppointmentStatus } from "@/lib/api/hooks";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { PetProfileSummary } from "@/components/professional/pet-profile-summary";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LoadingState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/lib/utils/toast";
import { InvoiceModal } from "@/components/shared/invoice-modal";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Stethoscope,
  CheckCircle2,
  PlayCircle,
  XCircle,
  ArrowLeft,
  FileText,
  ShieldCheck,
} from "lucide-react";
import type { ProfessionalAppointmentStatus } from "@/lib/mock/professionals";

interface VetAppointmentDetailClientProps {
  appointmentId: string;
}

export function VetAppointmentDetailClient({
  appointmentId,
}: VetAppointmentDetailClientProps) {
  const { data: appointment, isLoading, isError, refetch } = useVetAppointment(appointmentId);
  const { mutateAsync: updateStatus, isPending: isUpdating } = useUpdateVetAppointmentStatus();

  const [targetStatus, setTargetStatus] = useState<ProfessionalAppointmentStatus | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="py-8">
        <LoadingState variant="detail" message="Retrieving patient appointment file..." />
      </div>
    );
  }

  if (isError || !appointment) {
    return (
      <div className="py-12">
        <ErrorState
          title="Appointment Record Not Found"
          description="Could not locate this clinical appointment reference."
          action={
            <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
              Retry
            </Button>
          }
        />
        <div className="text-center mt-6">
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/vet/appointments">Back to Appointments</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleConfirmStatusChange = async () => {
    if (!targetStatus) return;
    try {
      await updateStatus({
        id: appointment.id,
        status: targetStatus,
      });
      toast.success("Appointment Status Updated", {
        description: `Marked as ${targetStatus}. Patient file synchronized.`,
      });
      setTargetStatus(null);
    } catch {
      toast.error("Status Update Failed", {
        description: "Could not modify appointment status. Please try again.",
      });
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Top Page Header */}
      <PageHeader
        title={`Appointment ${appointment.appointmentNumber}`}
        description={`${appointment.type} • Scheduled for ${appointment.date} at ${appointment.time}`}
      >
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsInvoiceOpen(true)}
            className="rounded-xl text-xs h-8.5 gap-1.5 border-primary/30 text-primary hover:bg-primary/10 font-medium"
            title="View & Print Clinical Tax Invoice"
          >
            <FileText className="h-3.5 w-3.5" />
            Tax Invoice / Bill
          </Button>
          <StatusBadge status={appointment.status} size="lg" />
          <Button asChild variant="outline" size="sm" className="rounded-xl text-xs h-8.5 gap-1.5">
            <Link href="/vet/appointments">
              <ArrowLeft className="h-3.5 w-3.5" />
              All Appointments
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* Primary Status Banner & Operations Controls */}
      <Card className="rounded-3xl border-border/80 p-6 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {appointment.type}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1 font-semibold text-foreground">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  {appointment.date}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-semibold text-foreground">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  {appointment.time} ({appointment.durationMinutes} min consult window)
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {appointment.status === "upcoming" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTargetStatus("confirmed")}
                disabled={isUpdating}
                className="rounded-xl text-xs font-semibold gap-1.5 h-9"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Confirm Appointment
              </Button>
            )}

            {(appointment.status === "upcoming" || appointment.status === "confirmed") && (
              <Button
                size="sm"
                onClick={() => setTargetStatus("in-progress")}
                disabled={isUpdating}
                className="rounded-xl text-xs font-semibold gap-1.5 h-9"
              >
                <PlayCircle className="h-4 w-4" />
                Begin Consultation
              </Button>
            )}

            {appointment.status === "in-progress" && (
              <Button
                size="sm"
                onClick={() => setTargetStatus("completed")}
                disabled={isUpdating}
                className="rounded-xl text-xs font-semibold gap-1.5 h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="h-4 w-4" />
                Complete & Discharge
              </Button>
            )}

            {appointment.status !== "completed" && appointment.status !== "cancelled" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setTargetStatus("cancelled")}
                disabled={isUpdating}
                className="rounded-xl text-xs text-destructive hover:bg-destructive/10 gap-1.5 h-9 font-medium"
              >
                <XCircle className="h-4 w-4" />
                Cancel Visit
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsInvoiceOpen(true)}
              className="rounded-xl text-xs font-semibold gap-1.5 h-9 border-primary/30 text-primary hover:bg-primary/10"
              title="Print Clinical GST Tax Invoice"
            >
              <FileText className="h-4 w-4" />
              Print Bill / Invoice
            </Button>
          </div>
        </div>

        {/* Reason for Visit */}
        <div className="rounded-2xl border border-border/70 bg-surface/50 p-4 space-y-1.5 text-xs">
          <span className="font-bold text-foreground flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-primary" />
            Patient Reason for Consultation:
          </span>
          <p className="text-muted-foreground leading-relaxed pl-5.5">
            &ldquo;{appointment.reason}&rdquo;
          </p>
        </div>

        {appointment.notes && (
          <div className="rounded-2xl border border-border/70 bg-secondary/30 p-4 space-y-1.5 text-xs">
            <span className="font-bold text-foreground">Doctor&apos;s Pre-Consultation / Discharge Notes:</span>
            <p className="text-muted-foreground leading-relaxed">
              {appointment.notes}
            </p>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Pet Profile Summary */}
        <div className="lg:col-span-8 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider text-muted-foreground mb-3">
              Patient Medical & Biological File
            </h3>
            <PetProfileSummary pet={appointment.pet} />
          </div>
        </div>

        {/* Right Column: Owner Information */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-3xl border-border/80 p-5 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 pb-3 border-b border-border/60">
              <User className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Client Contact Record</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-muted-foreground text-[11px] block">Pet Parent Name</span>
                <span className="font-bold text-foreground text-sm">{appointment.owner.name}</span>
              </div>

              <div>
                <span className="text-muted-foreground text-[11px] block">Telephone</span>
                <div className="flex items-center gap-1.5 font-medium text-foreground mt-0.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{appointment.owner.phone}</span>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground text-[11px] block">Email Address</span>
                <div className="flex items-center gap-1.5 font-medium text-foreground mt-0.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{appointment.owner.email}</span>
                </div>
              </div>

              {appointment.owner.preferredContact && (
                <div className="pt-2 border-t border-border/60">
                  <span className="text-muted-foreground text-[11px] block">Communication Preference</span>
                  <span className="font-medium text-foreground">{appointment.owner.preferredContact}</span>
                </div>
              )}
            </div>

            <div className="pt-2 text-[11px] text-muted-foreground border-t border-border/50 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>HIPAA / Veterinary Client Patient Confidentiality</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(targetStatus)}
        onOpenChange={(op) => !op && setTargetStatus(null)}
        title={`Update Appointment to "${targetStatus}"?`}
        description={`Confirming this update will advance ${appointment.appointmentNumber} to "${targetStatus}" and update the patient's schedule.`}
        confirmLabel="Confirm Status Change"
        variant={targetStatus === "cancelled" ? "destructive" : "default"}
        onConfirm={handleConfirmStatusChange}
      />

      {/* Printable Clinical GST Tax Invoice Modal */}
      <InvoiceModal
        open={isInvoiceOpen}
        onOpenChange={setIsInvoiceOpen}
        invoiceType="APPOINTMENT"
        resourceId={appointment.id}
      />
    </div>
  );
}
