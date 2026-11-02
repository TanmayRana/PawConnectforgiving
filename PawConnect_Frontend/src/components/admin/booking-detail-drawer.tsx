"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatMoney } from "@/lib/utils/money";
import { InvoiceModal } from "@/components/shared/invoice-modal";
import {
  CalendarDays,
  Clock,
  User,
  PawPrint,
  Stethoscope,
  Building2,
  Phone,
  Mail,
  CheckCircle2,
  PlayCircle,
  XCircle,
  Receipt,
  FileText,
} from "lucide-react";
import type { AdminGlobalBooking } from "@/lib/mock/admin";
import type { ProfessionalAppointmentStatus } from "@/lib/mock/professionals";

interface BookingDetailDrawerProps {
  booking: AdminGlobalBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (id: string, status: ProfessionalAppointmentStatus) => Promise<void> | void;
  loading?: boolean;
}

export function BookingDetailDrawer({
  booking,
  open,
  onOpenChange,
  onUpdateStatus,
  loading = false,
}: BookingDetailDrawerProps) {
  const [invoiceModalOpen, setInvoiceModalOpen] = React.useState(false);
  if (!booking) return null;

  const handleStatusChange = async (status: ProfessionalAppointmentStatus) => {
    await onUpdateStatus(booking.id, status);
  };

  const typeColorMap = {
    veterinary: "bg-primary/10 text-primary border-primary/20",
    grooming: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    training: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col sm:max-w-lg p-0 bg-card">
        <SheetHeader className="p-6 border-b border-border/70 text-left space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs font-bold text-muted-foreground">
              {booking.bookingNumber}
            </span>
            <div className="flex items-center gap-2">
              <Badge className={typeColorMap[booking.type] + " capitalize text-[10px]"}>
                {booking.type}
              </Badge>
              <StatusBadge status={booking.status} size="sm" />
            </div>
          </div>
          <SheetTitle className="text-base font-bold text-foreground">
            {booking.serviceTitle}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Scheduled session oversight and practitioner dispatch records.
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable details */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Schedule Banner */}
          <div className="p-4 rounded-2xl bg-secondary/40 border border-border/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">{booking.date}</p>
                <p className="text-muted-foreground flex items-center gap-1 text-xs">
                  <Clock className="h-3.5 w-3.5" />
                  {booking.time} ({booking.durationMinutes} min)
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Total Fee</span>
              <p className="text-base font-bold text-foreground">{formatMoney(booking.price)}</p>
              <Badge
                variant="outline"
                className="text-[9px] capitalize bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
              >
                {booking.paymentStatus}
              </Badge>
            </div>
          </div>

          {/* Patient / Pet Card */}
          <div className="p-4 rounded-2xl border border-border/70 space-y-2">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
              <PawPrint className="h-3.5 w-3.5 text-primary" />
              Pet Patient Profile
            </span>
            <div className="flex justify-between items-center pt-0.5">
              <div>
                <h4 className="font-bold text-foreground text-sm">{booking.petName}</h4>
                <p className="text-muted-foreground">
                  {booking.petBreed} • {booking.petSpecies}
                </p>
              </div>
              <Badge variant="outline" className="text-[11px] font-semibold">
                Registered Pet
              </Badge>
            </div>
          </div>

          {/* Pet Owner / Customer Card */}
          <div className="p-4 rounded-2xl border border-border/70 space-y-2">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" />
              Customer Information
            </span>
            <div className="space-y-1 pt-0.5">
              <p className="font-bold text-foreground text-sm">{booking.customerName}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-primary" />
                  {booking.customerPhone}
                </span>
                <span className="flex items-center gap-1.5 truncate">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  {booking.customerEmail}
                </span>
              </div>
            </div>
          </div>

          {/* Practitioner / Provider Card */}
          <div className="p-4 rounded-2xl border border-border/70 space-y-2">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
              <Stethoscope className="h-3.5 w-3.5 text-primary" />
              Assigned Professional
            </span>
            <div className="space-y-0.5 pt-0.5">
              <p className="font-bold text-foreground text-sm">{booking.providerName}</p>
              <p className="text-muted-foreground flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                {booking.providerClinic}
              </p>
            </div>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">
                Intake / Booking Notes
              </span>
              <p className="p-3.5 rounded-xl bg-secondary/30 border border-border/60 text-foreground/80 leading-relaxed">
                {booking.notes}
              </p>
            </div>
          )}

          {/* Status Mutation Actions */}
          <div className="space-y-2 pt-2 border-t border-border/60">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Administrative Status Transition
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={booking.status === "confirmed" ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusChange("confirmed")}
                disabled={loading}
                className="rounded-xl text-xs h-8.5 gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Confirm
              </Button>
              <Button
                variant={booking.status === "in-progress" ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusChange("in-progress")}
                disabled={loading}
                className="rounded-xl text-xs h-8.5 gap-1.5"
              >
                <PlayCircle className="h-3.5 w-3.5" />
                In Progress
              </Button>
              <Button
                variant={booking.status === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusChange("completed")}
                disabled={loading}
                className="rounded-xl text-xs h-8.5 gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Complete
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleStatusChange("cancelled")}
                disabled={loading}
                className="rounded-xl text-xs h-8.5 gap-1.5"
              >
                <XCircle className="h-3.5 w-3.5" />
                Cancel Session
              </Button>
            </div>
          </div>
        </div>

        <SheetFooter className="p-4 border-t border-border/70 flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInvoiceModalOpen(true)}
            className="w-full rounded-xl text-xs h-9 gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
          >
            <Receipt className="h-4 w-4" />
            <span>Official GST Tax Invoice</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full rounded-xl text-xs h-9"
          >
            Close Overview
          </Button>
        </SheetFooter>
      </SheetContent>

      {/* Official Universal GST Tax Invoice Modal */}
      <InvoiceModal
        open={invoiceModalOpen}
        onOpenChange={setInvoiceModalOpen}
        invoiceType={booking.type === "veterinary" ? "APPOINTMENT" : "SERVICE_BOOKING"}
        resourceId={booking.id}
      />
    </Sheet>
  );
}
