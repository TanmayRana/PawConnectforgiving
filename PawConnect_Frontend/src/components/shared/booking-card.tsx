"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import type { CustomerBooking } from "@/lib/mock/bookings";
import {
  Calendar,
  Clock,
  MapPin,
  Stethoscope,
  Scissors,
  Award,
  ArrowRight,
  RefreshCw,
  XCircle,
  PawPrint,
  FileText,
} from "lucide-react";
import { InvoiceModal } from "@/components/shared/invoice-modal";

interface BookingCardProps {
  booking: CustomerBooking;
  onCancel?: (booking: CustomerBooking) => void;
  onReschedule?: (booking: CustomerBooking) => void;
  className?: string;
}

export function BookingCard({
  booking,
  onCancel,
  onReschedule,
  className,
}: BookingCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isInvoiceOpen, setIsInvoiceOpen] = React.useState(false);

  const isPaid = ["paid", "success", "refunded"].includes(
    (booking.paymentStatus || "").toLowerCase()
  );

  const isVeterinary = booking.type === "veterinary";
  const isGrooming = booking.type === "grooming";

  const detailHref = isVeterinary
    ? `/app/bookings/appointments/${booking.id}`
    : `/app/bookings/${booking.id}`;

  return (
    <motion.div
      whileHover={shouldReduceMotion ? undefined : { y: -4 }}
      transition={{ duration: 0.2 }}
      className={`rounded-[28px] border border-border/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-md dark:bg-card flex flex-col justify-between ${className || ""}`}
    >
      <div>
        {/* Top Header: Booking Ref & Status */}
        <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface text-foreground">
              {isVeterinary ? (
                <Stethoscope className="h-4 w-4 text-primary" />
              ) : isGrooming ? (
                <Scissors className="h-4 w-4 text-amber-600" />
              ) : (
                <Award className="h-4 w-4 text-sky-600" />
              )}
            </span>
            <span className="text-xs font-bold font-mono tracking-wide text-foreground">
              {booking.appointmentNumber}
            </span>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        {/* Service & Provider Details */}
        <div className="mt-3.5 space-y-1">
          <h3 className="text-base font-bold text-foreground leading-snug">
            {booking.serviceTitle}
          </h3>
          <p className="text-xs text-muted-foreground">
            with <span className="font-semibold text-foreground">{booking.providerName}</span> •{" "}
            {booking.providerClinicOrBusiness}
          </p>
        </div>

        {/* Pet & Appointment Date Row */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface/60 p-3 text-xs">
          {/* Pet info */}
          <div className="flex items-center gap-2.5">
            <div className="relative h-9 w-9 overflow-hidden rounded-full border border-border/60 shrink-0 bg-primary/10 flex items-center justify-center">
              {booking.petPhoto ? (
                <Image
                  src={booking.petPhoto}
                  alt={booking.petName}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              ) : (
                <span className="font-bold text-xs text-primary">
                  {booking.petName ? booking.petName.charAt(0).toUpperCase() : <PawPrint className="h-4 w-4" />}
                </span>
              )}
            </div>
            <div>
              <p className="font-bold text-foreground">{booking.petName}</p>
              <p className="text-[11px] text-muted-foreground">{booking.petBreed}</p>
            </div>
          </div>

          {/* Time & Date */}
          <div className="flex flex-col sm:items-end text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>{booking.date}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
              <Clock className="h-3 w-3" />
              <span>{booking.time} ({booking.durationMinutes} min)</span>
            </div>
          </div>
        </div>

        {/* Location footnote */}
        <div className="mt-3 flex items-start gap-1.5 text-[11px] text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
          <span className="line-clamp-1">{booking.location}</span>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-5 pt-3.5 border-t border-border/60 flex items-center justify-between gap-2">
        <div className="text-xs">
          <span className="text-muted-foreground">Fee: </span>
          <span className="font-bold text-foreground">₹{booking.price.toFixed(2)}</span>
          <span
            className={`ml-1.5 text-[10px] font-semibold uppercase ${
              booking.paymentStatus === "paid"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-amber-600 dark:text-amber-400"
            }`}
          >
            ({booking.paymentStatus === "paid" ? "Paid" : "Pending"})
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {isPaid && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsInvoiceOpen(true);
              }}
              className="rounded-full text-xs h-8 px-2.5 gap-1 font-medium"
              title="View & Print Official GST Tax Invoice"
            >
              <FileText className="h-3 w-3" />
              <span>Bill</span>
            </Button>
          )}

          {booking.status === "scheduled" && onCancel && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onCancel(booking)}
              className="rounded-full text-xs h-8 px-2.5 text-muted-foreground hover:text-destructive"
            >
              <XCircle className="h-3.5 w-3.5 mr-1" />
              <span>Cancel</span>
            </Button>
          )}

          {booking.status === "scheduled" && onReschedule && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReschedule(booking)}
              className="rounded-full text-xs h-8 px-2.5"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              <span>Reschedule</span>
            </Button>
          )}

          <Button asChild size="sm" className="rounded-full text-xs h-8 px-3">
            <Link href={detailHref} className="flex items-center gap-1">
              <span>{booking.paymentStatus === "paid" ? "Details" : "Pay with Razorpay"}</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Printable GST Tax Invoice / Clinical Bill of Supply Modal */}
      <InvoiceModal
        open={isInvoiceOpen}
        onOpenChange={setIsInvoiceOpen}
        invoiceType={booking.type === "veterinary" ? "APPOINTMENT" : "SERVICE_BOOKING"}
        resourceId={booking.id}
      />
    </motion.div>
  );
}
