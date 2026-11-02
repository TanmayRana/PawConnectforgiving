"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogBody,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatMoney } from "@/lib/utils/money";
import {
  Calendar,
  Clock,
  Phone,
  Mail,
  User,
  PawPrint,
  CheckCircle2,
  PlayCircle,
  XCircle,
  FileText,
} from "lucide-react";
import { InvoiceModal } from "@/components/shared/invoice-modal";
import type {
  ProviderBooking,
  ProfessionalAppointmentStatus,
} from "@/lib/mock/professionals";

const FALLBACK_PET_IMAGE =
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&auto=format&fit=crop&q=80";

interface ProviderBookingModalProps {
  booking: ProviderBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (id: string, status: ProfessionalAppointmentStatus) => Promise<void> | void;
  isUpdating?: boolean;
}

export function ProviderBookingModal({
  booking,
  open,
  onOpenChange,
  onUpdateStatus,
  isUpdating = false,
}: ProviderBookingModalProps) {
  const [confirmStatus, setConfirmStatus] = useState<ProfessionalAppointmentStatus | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  if (!booking) return null;

  const handleConfirmStatusChange = async () => {
    if (confirmStatus) {
      try {
        await onUpdateStatus(booking.id, confirmStatus);
        setConfirmStatus(null);
      } catch {
        // Retain state so user can retry
      }
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent size="wide">
          <DialogHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-foreground">
                    {booking.bookingNumber}
                  </span>
                  <StatusBadge status={booking.status} />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {booking.serviceName} • {booking.serviceCategory === "grooming" ? "Grooming & Spa" : "Canine Training"}
                </p>
              </div>

              <div className="text-right">
                <span className="text-base font-black text-foreground">
                  {formatMoney(booking.price)}
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  {booking.durationMinutes} min session
                </span>
              </div>
            </div>
            <DialogTitle className="sr-only">Booking Details</DialogTitle>
          </DialogHeader>

          <DialogBody className="space-y-5">
            {/* Appointment Schedule Details */}
            <div className="rounded-2xl border border-border/70 bg-surface/50 p-4 grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Appointment Date</span>
                  <span className="font-semibold text-foreground">{booking.date}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Scheduled Time</span>
                  <span className="font-semibold text-foreground">{booking.time}</span>
                </div>
              </div>
            </div>

            {/* Pet Information Summary */}
            <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <PawPrint className="h-3.5 w-3.5 text-primary" />
                <span>Pet Patient Profile</span>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-secondary shrink-0 border border-border/60">
                  <Image
                    src={booking.pet?.photo || FALLBACK_PET_IMAGE}
                    alt={booking.pet?.name || "Pet"}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div className="space-y-0.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground text-sm">
                      {booking.pet.name}
                    </span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {booking.pet.species}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    {booking.pet.breed} • {booking.pet.age} yrs • {booking.pet.gender} • {booking.pet.weight} kg
                  </p>
                </div>
              </div>
            </div>

            {/* Owner Contact Information */}
            <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <User className="h-3.5 w-3.5 text-primary" />
                <span>Client Contact</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 text-foreground">
                  <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="font-medium">{booking.owner.name}</span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>{booking.owner.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-foreground sm:col-span-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>{booking.owner.email}</span>
                </div>
              </div>
            </div>

            {/* Booking Notes */}
            {booking.notes && (
              <div className="rounded-2xl border border-border/70 bg-secondary/30 p-4 text-xs space-y-1">
                <span className="font-bold text-foreground block">Session Notes:</span>
                <p className="text-muted-foreground leading-relaxed">&ldquo;{booking.notes}&rdquo;</p>
              </div>
            )}

          </DialogBody>

          <DialogFooter className="flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Actions:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsInvoiceOpen(true)}
                className="rounded-xl text-xs gap-1.5 h-8.5 border-primary/30 text-primary hover:bg-primary/10 font-medium"
                title="Print Official Service Tax Invoice"
              >
                <FileText className="h-3.5 w-3.5" />
                Print Bill / Invoice
              </Button>
              {booking.status === "upcoming" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmStatus("confirmed")}
                  disabled={isUpdating}
                  className="rounded-xl text-xs gap-1.5 h-8.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Confirm Booking
                </Button>
              )}

              {(booking.status === "upcoming" || booking.status === "confirmed") && (
                <Button
                  size="sm"
                  onClick={() => setConfirmStatus("in-progress")}
                  disabled={isUpdating}
                  className="rounded-xl text-xs gap-1.5 h-8.5"
                >
                  <PlayCircle className="h-3.5 w-3.5" />
                  Start Session
                </Button>
              )}

              {booking.status === "in-progress" && (
                <Button
                  size="sm"
                  onClick={() => setConfirmStatus("completed")}
                  disabled={isUpdating}
                  className="rounded-xl text-xs gap-1.5 h-8.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Mark Completed
                </Button>
              )}

              {booking.status !== "completed" && booking.status !== "cancelled" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmStatus("cancelled")}
                  disabled={isUpdating}
                  className="rounded-xl text-xs text-destructive hover:bg-destructive/10 gap-1.5 h-8.5"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Cancel Booking
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(confirmStatus)}
        onOpenChange={(op) => !op && setConfirmStatus(null)}
        title={`Update status to "${confirmStatus}"?`}
        description={`Are you sure you want to change the status of ${booking.bookingNumber} to ${confirmStatus}? Client notifications will update automatically.`}
        confirmLabel="Confirm Update"
        variant={confirmStatus === "cancelled" ? "destructive" : "default"}
        onConfirm={handleConfirmStatusChange}
      />

      {/* Printable Service GST Tax Invoice Modal */}
      <InvoiceModal
        open={isInvoiceOpen}
        onOpenChange={setIsInvoiceOpen}
        invoiceType="SERVICE_BOOKING"
        resourceId={booking.id}
      />
    </>
  );
}
