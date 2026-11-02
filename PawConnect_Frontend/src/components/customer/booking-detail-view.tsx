"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Stethoscope,
  Scissors,
  Award,
  FileText,
  Heart,
  Ban,
  CheckCircle2,
  RefreshCw,
  CreditCard,
  Loader2,
  PawPrint,
  Navigation,
  ExternalLink,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { InvoiceModal } from "@/components/shared/invoice-modal";
import { LoadingState, ErrorState } from "@/components/shared/states";
import { useBooking, useCancelBooking, useRescheduleBooking } from "@/lib/api/hooks";
import { createPaymentOrder, launchRazorpayCheckout, recordPaymentFailure } from "@/lib/api/payments";
import { PaymentCountdownBanner } from "@/components/shared/payment-countdown-banner";
import { showSuccess, showError } from "@/lib/utils/toast";
import {
  LocationMap,
  searchAddress,
  type LocationCoordinates,
  type SearchResultItem,
} from "@/components/shared/location";

interface BookingDetailViewProps {
  id: string;
  isClinicalAppointment?: boolean;
}

export function BookingDetailView({
  id,
  isClinicalAppointment = false,
}: BookingDetailViewProps) {
  const queryClient = useQueryClient();
  const { data: booking, isLoading, error } = useBooking(id);
  const cancelMutation = useCancelBooking();
  const rescheduleMutation = useRescheduleBooking();

  const [currentTime] = React.useState(() => Date.now());
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = React.useState(false);
  const [isPayingBooking, setIsPayingBooking] = React.useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = React.useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = React.useState(false);

  const hasExactCoords = Boolean(
    booking &&
    booking.latitude != null &&
    booking.longitude != null &&
    (booking.latitude !== 0 || booking.longitude !== 0)
  );

  const [geocodedCoords, setGeocodedCoords] = React.useState<LocationCoordinates | null>(null);

  // If coordinates were not saved directly on the booking, attempt geocoding the clinic/facility address
  React.useEffect(() => {
    if (!booking || hasExactCoords) return;

    let isMounted = true;
    const addressToSearch = (booking.location || booking.providerClinicOrBusiness || "").trim();
    if (addressToSearch) {
      searchAddress(addressToSearch)
        .then((results: SearchResultItem[]) => {
          if (isMounted && results.length > 0) {
            setGeocodedCoords({ lat: results[0].lat, lng: results[0].lng });
          }
        })
        .catch(() => {
          // Keep default fallback
        });
    }

    return () => {
      isMounted = false;
    };
  }, [hasExactCoords, booking]);

  const mapCoords: LocationCoordinates = React.useMemo(() => {
    if (booking && hasExactCoords && booking.latitude != null && booking.longitude != null) {
      return { lat: Number(booking.latitude), lng: Number(booking.longitude) };
    }
    if (geocodedCoords) {
      return geocodedCoords;
    }
    return {
      lat: 37.7749, // Default geographic center (San Francisco)
      lng: -122.4194,
    };
  }, [booking, hasExactCoords, geocodedCoords]);

  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${booking?.providerClinicOrBusiness || ""} ${booking?.location || ""}`.trim() || `${mapCoords.lat},${mapCoords.lng}`
  )}`;

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const [rescheduleDate] = React.useState(getTomorrowDate);
  const [rescheduleTime] = React.useState("11:30 AM");
  const [mountTime] = React.useState(() => Date.now());

  if (isLoading) {
    return <LoadingState variant="detail" message="Loading booking details..." className="min-h-[50vh]" />;
  }

  if (error || !booking) {
    return (
      <ErrorState
        title="Booking Not Found"
        description="We couldn't locate this appointment record or it may have been removed."
        action={
          <Button asChild variant="outline">
            <Link href="/app/bookings">Return to All Bookings</Link>
          </Button>
        }
      />
    );
  }

  const isVet = booking.type === "veterinary";
  const isGroom = booking.type === "grooming";
  const canModify = booking.status === "scheduled";

  const handleConfirmCancel = async () => {
    try {
      await cancelMutation.mutateAsync(booking.id);
      await queryClient.invalidateQueries({ queryKey: ["customer-booking", id] });
      await queryClient.invalidateQueries({ queryKey: ["customer-bookings"] });
      showSuccess("Booking Cancelled", "Your booking has been cancelled and any paid amount has been refunded.");
      setCancelDialogOpen(false);
    } catch {
      showError("Cancellation Failed", "Failed to cancel booking. Please try again.");
    }
  };

  const handleConfirmReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime) {
      showError("Date & Time Required", "Please pick a valid reschedule date and time slot.");
      return;
    }
    try {
      await rescheduleMutation.mutateAsync({
        id: booking.id,
        date: rescheduleDate,
        time: rescheduleTime,
      });
      showSuccess("Reschedule Submitted", `Requested session time updated for ${rescheduleDate} at ${rescheduleTime}.`);
      setRescheduleDialogOpen(false);
    } catch {
      showError("Reschedule Failed", "Failed to reschedule booking. Please try again.");
    }
  };

  const normalizedPaymentStatus = String(booking.paymentStatus || "").toUpperCase();
  const isPaid = normalizedPaymentStatus === "PAID" || normalizedPaymentStatus === "SUCCESS";
  const isRefunded = normalizedPaymentStatus === "REFUNDED";
  const isFailed = normalizedPaymentStatus === "FAILED";
  const isPending = !isPaid && !isRefunded && !isFailed;
  const isCancelled = booking.status === "cancelled";

  const isWindowActive = Boolean(
    booking.canRetryPayment ?? (
      booking.paymentExpiresAt
        ? new Date(booking.paymentExpiresAt).getTime() > currentTime
        : false
    )
  );
  const canPay = (booking.canRetryPayment || isWindowActive || isPending) && !isPaid && !isCancelled;

  const handleCheckPaymentStatus = async () => {
    try {
      setIsCheckingStatus(true);
      await queryClient.invalidateQueries({ queryKey: ["customer-booking", id] });
      await queryClient.invalidateQueries({ queryKey: ["customer-bookings"] });
      showSuccess("Payment Status Checked", "Booking and payment status refreshed.");
    } catch {
      showError("Status Check Failed", "Unable to refresh payment status right now.");
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handlePayBooking = async () => {
    try {
      setIsPayingBooking(true);
      const bookingType = isClinicalAppointment || booking.type === "veterinary" ? "VETERINARY" : "SERVICE";
      const paymentOrder = await createPaymentOrder({
        bookingId: Number(booking.id),
        bookingType,
      });

      await launchRazorpayCheckout({
        order: paymentOrder,
        preferredMethod: "all",
        onSuccess: () => {
          setIsPayingBooking(false);
          showSuccess("Payment Verified", "Fee received and verified successfully!");
          queryClient.invalidateQueries({ queryKey: ["customer-booking", id] });
          queryClient.invalidateQueries({ queryKey: ["customer-bookings"] });
        },
        onDismiss: () => {
          setIsPayingBooking(false);
          const bookingType = isClinicalAppointment || booking.type === "veterinary" ? "VETERINARY" : "SERVICE";
          recordPaymentFailure({
            bookingId: Number(booking.id),
            bookingType,
            reason: "Checkout dismissed by user",
          }).catch(() => {});
          showError("Payment Incomplete", "Payment was not completed. You have 15 minutes to complete payment.");
          queryClient.invalidateQueries({ queryKey: ["customer-booking", id] });
          queryClient.invalidateQueries({ queryKey: ["customer-bookings"] });
        },
        onError: (err) => {
          setIsPayingBooking(false);
          const msg = err instanceof Error ? err.message : "Payment verification failed.";
          const bookingType = isClinicalAppointment || booking.type === "veterinary" ? "VETERINARY" : "SERVICE";
          recordPaymentFailure({
            bookingId: Number(booking.id),
            bookingType,
            reason: msg,
          }).catch(() => {});
          showError("Payment Failed", msg);
          queryClient.invalidateQueries({ queryKey: ["customer-booking", id] });
          queryClient.invalidateQueries({ queryKey: ["customer-bookings"] });
        },
      });
    } catch (err: unknown) {
      setIsPayingBooking(false);
      const msg = err instanceof Error ? err.message : "Unable to initiate payment with Razorpay.";
      showError("Payment Initialization Failed", msg);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Top Breadcrumb & Return */}
      <div>
        <Link
          href="/app/bookings"
          className="inline-flex items-center text-sm font-medium text-paw-charcoal-muted hover:text-paw-charcoal transition-colors group mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to All Bookings
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-semibold uppercase bg-paw-cream-peach px-2.5 py-1 rounded-lg text-paw-charcoal border border-paw-coral/20">
                {booking.appointmentNumber}
              </span>
              <StatusBadge status={booking.status} size="sm" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-paw-charcoal mt-2">
              {isClinicalAppointment ? "Veterinary Clinical Appointment" : booking.serviceTitle}
            </h1>
          </div>

          {canModify && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs"
                onClick={() => setRescheduleDialogOpen(true)}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Reschedule
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                onClick={() => setCancelDialogOpen(true)}
              >
                <Ban className="w-3.5 h-3.5 mr-1.5" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 15-Minute Re-Payment Window Banner (Active Pending Booking) */}
      {(booking.canRetryPayment || (booking.paymentExpiresAt && isWindowActive)) && (
        <PaymentCountdownBanner
          expiresAt={booking.paymentExpiresAt}
          remainingSecondsInitial={booking.remainingPaymentSeconds}
          amount={booking.price}
          orderId={booking.id}
          isRetrying={isPayingBooking}
          onRetryPayment={handlePayBooking}
          onExpired={async () => {
            showError("Payment Window Expired", "The 15-minute payment window has elapsed. This booking has expired.");
            queryClient.invalidateQueries({ queryKey: ["customer-booking", id] });
            queryClient.invalidateQueries({ queryKey: ["customer-bookings"] });
          }}
        />
      )}

      {/* Main Grid: Details Overview + Side Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appointment Schedule & Facility Location Block */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-paw-charcoal/10 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-paw-charcoal flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-paw-coral" />
                  Appointment Schedule & Facility Location
                </h2>
                <p className="text-xs text-paw-charcoal-muted mt-0.5">
                  Confirmed session timing and verified on-site facility location
                </p>
              </div>

              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-paw-coral hover:text-paw-coral/90 transition-colors bg-paw-coral/10 hover:bg-paw-coral/15 px-3.5 py-2 rounded-xl border border-paw-coral/20 self-start sm:self-auto shrink-0 shadow-xs"
              >
                <Navigation className="w-3.5 h-3.5" />
                Get Directions
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-paw-cream-peach/20 border border-paw-cream-peach space-y-1">
                <span className="text-xs text-paw-charcoal-muted font-medium flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-paw-coral" /> Date & Time
                </span>
                <p className="text-base font-bold text-paw-charcoal">{booking.date}</p>
                <p className="text-xs font-semibold text-paw-coral">{booking.time} ({booking.durationMinutes} minutes)</p>
              </div>

              <div className="p-4 rounded-2xl bg-paw-sky-light/20 border border-paw-sky-border space-y-1 flex flex-col justify-between">
                <div>
                  <span className="text-xs text-paw-charcoal-muted font-medium flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-paw-blue-accent" /> Facility Location
                  </span>
                  <p className="text-sm font-bold text-paw-charcoal mt-0.5">{booking.providerClinicOrBusiness}</p>
                  <p className="text-xs text-paw-charcoal-muted">{booking.location}</p>
                </div>
                {(hasExactCoords || geocodedCoords) && (
                  <div className="pt-2 flex items-center gap-2 text-[10px] font-mono text-paw-charcoal-muted">
                    <span className="bg-white/80 px-2 py-0.5 rounded border border-paw-sky-border/60">
                      GPS: {mapCoords.lat.toFixed(4)}, {mapCoords.lng.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Leaflet Map Container */}
            <div className="space-y-2">
              <div className="relative w-full h-[280px] sm:h-[340px] rounded-2xl overflow-hidden border border-paw-charcoal/10 shadow-inner bg-paw-cream-peach/10">
                <LocationMap
                  center={mapCoords}
                  markerPosition={mapCoords}
                  zoom={15}
                  isDraggable={false}
                  popupText={`${booking.providerClinicOrBusiness} — ${booking.providerName}`}
                  className="w-full h-full"
                />
                <div className="absolute bottom-3 left-3 z-[400] pointer-events-none">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-white/95 text-paw-charcoal px-3 py-1 rounded-full shadow-md border border-paw-charcoal/10 backdrop-blur-xs">
                    <MapPin className="w-3 h-3 text-emerald-600" />
                    {booking.providerClinicOrBusiness || "Facility Location"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-paw-charcoal-muted gap-2 pt-1 px-1">
                <p className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Reception check-in desk, parking, and consultation rooms are available at this address.</span>
                </p>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-paw-coral hover:underline inline-flex items-center gap-1 shrink-0"
                >
                  Open in Google Maps <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Attending Provider Details */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-paw-charcoal/10 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-paw-charcoal flex items-center gap-2">
              {isVet ? (
                <Stethoscope className="w-5 h-5 text-paw-coral" />
              ) : isGroom ? (
                <Scissors className="w-5 h-5 text-paw-coral" />
              ) : (
                <Award className="w-5 h-5 text-paw-coral" />
              )}
              Attending Specialist / Care Provider
            </h2>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-paw-cream-peach/10 border border-paw-charcoal/10">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-border bg-primary/10 flex items-center justify-center">
                {booking.providerImage ? (
                  <Image
                    src={booking.providerImage}
                    alt={booking.providerName}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <span className="font-bold text-sm text-primary">
                    {booking.providerName
                      ?.split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase() || "DR"}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-paw-charcoal text-base truncate">
                  {booking.providerName}
                </h3>
                <p className="text-xs text-paw-coral font-medium">{booking.providerTitle}</p>
                <p className="text-xs text-paw-charcoal-muted">{booking.providerClinicOrBusiness}</p>
              </div>

              <Button asChild variant="outline" size="sm" className="rounded-xl text-xs shrink-0">
                <Link
                  href={
                    isVet
                      ? `/app/services/veterinary/${booking.providerId}`
                      : isGroom
                        ? `/app/services/grooming/${booking.providerId}`
                        : `/app/services/training/${booking.providerId}`
                  }
                >
                  View Profile
                </Link>
              </Button>
            </div>
          </div>

          {/* Patient / Companion Pet Information */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-paw-charcoal/10 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-paw-charcoal flex items-center gap-2">
              <Heart className="w-5 h-5 text-paw-coral" />
              Companion Pet Profile
            </h2>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-paw-cream-peach/10 border border-paw-charcoal/10">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-border bg-primary/10 flex items-center justify-center">
                {booking.petPhoto ? (
                  <Image
                    src={booking.petPhoto}
                    alt={booking.petName}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <span className="font-bold text-sm text-primary">
                    {booking.petName ? booking.petName.charAt(0).toUpperCase() : <PawPrint className="w-5 h-5" />}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-paw-charcoal text-base">{booking.petName}</h4>
                <p className="text-xs text-paw-charcoal-muted">{booking.petBreed}</p>
              </div>

              <Button asChild variant="outline" size="sm" className="rounded-xl text-xs shrink-0">
                <Link href={`/app/pets/${booking.petId}`}>Pet Profile</Link>
              </Button>
            </div>
          </div>

          {/* Notes / Reason for Appointment */}
          {booking.notes && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-paw-charcoal/10 shadow-sm space-y-2">
              <h3 className="text-sm font-bold text-paw-charcoal flex items-center gap-2">
                <FileText className="w-4 h-4 text-paw-coral" />
                Visit Reason & Client Notes
              </h3>
              <p className="text-xs text-paw-charcoal-muted bg-paw-cream-peach/20 p-3.5 rounded-xl border border-paw-cream-peach leading-relaxed">
                &quot;{booking.notes}&quot;
              </p>
            </div>
          )}
        </div>

        {/* Right Col: Payment & Billing Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-paw-charcoal/10 shadow-sm space-y-5 sticky top-24">
            <div className="flex items-center justify-between border-b border-paw-charcoal/10 pb-4">
              <span className="text-sm font-bold text-paw-charcoal">Payment Status</span>
              <Badge
                variant="outline"
                className={`text-xs uppercase font-bold ${
                  isPaid
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : isRefunded
                    ? "bg-purple-50 text-purple-800 border-purple-200"
                    : isFailed
                    ? "bg-rose-50 text-rose-800 border-rose-200"
                    : "bg-amber-50 text-amber-800 border-amber-200"
                }`}
              >
                {isPaid ? "PAID" : isRefunded ? "REFUNDED" : isFailed ? "FAILED" : "PENDING"}
              </Badge>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-paw-charcoal-muted">{booking.serviceTitle}</span>
                <span className="font-semibold text-paw-charcoal">₹{booking.price}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-paw-charcoal-muted">PawConnect Platform Fee</span>
                <span className="font-semibold text-emerald-700">Included (₹0)</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-paw-charcoal/10 text-sm">
                <span className="font-bold text-paw-charcoal">Total Amount</span>
                <span className="font-extrabold text-paw-charcoal text-base">₹{booking.price}</span>
              </div>
            </div>

            {canPay && (
              <div className="space-y-2 pt-2">
                <Button
                  size="sm"
                  className="w-full rounded-2xl font-bold text-xs h-10 gap-2 shadow-xs"
                  disabled={isPayingBooking}
                  onClick={handlePayBooking}
                >
                  {isPayingBooking ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Opening Razorpay...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Pay with Razorpay (₹{booking.price})</span>
                    </>
                  )}
                </Button>

                <p className="text-[10px] text-center text-paw-charcoal-muted pt-0.5">
                  Official Razorpay Checkout (Instant UPI, Cards & NetBanking).
                </p>
              </div>
            )}

            {booking.appointmentNumber && (
              <div className="flex items-center justify-between text-[11px] text-paw-charcoal-muted pt-2 border-t border-paw-charcoal/10">
                <span>Payment Reference ID:</span>
                <span className="font-mono font-medium text-paw-charcoal">{booking.appointmentNumber}</span>
              </div>
            )}

            {isPending && booking.status !== "cancelled" && (
              <Button
                size="sm"
                variant="ghost"
                className="w-full text-xs font-medium text-paw-charcoal-muted hover:text-paw-charcoal h-8 gap-1.5"
                disabled={isCheckingStatus}
                onClick={handleCheckPaymentStatus}
              >
                <RefreshCw className={`w-3 h-3 ${isCheckingStatus ? "animate-spin" : ""}`} />
                <span>Check Payment Status</span>
              </Button>
            )}

            {(isPaid || isRefunded) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInvoiceModalOpen(true)}
                className="w-full rounded-2xl text-xs font-semibold gap-2 h-10 mt-2"
              >
                <FileText className="w-4 h-4" />
                <span>View GST Tax Invoice</span>
              </Button>
            )}

            <div className="pt-2 text-[11px] text-paw-charcoal-muted space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isPaid
                  ? "Payment Verified via Razorpay"
                  : isRefunded
                  ? "Booking Cancelled - Payment Refunded"
                  : isFailed
                  ? "Payment Attempt Failed"
                  : "Pay securely upon confirmation"}
              </div>
              <p>
                {isRefunded
                  ? "This booking was cancelled and your payment has been automatically refunded to your original payment method."
                  : "Cancellations can be made up to 2 hours before the scheduled time with full refund processed automatically."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancel This Appointment?"
        description="Are you sure you want to cancel this booking? The slot will be reopened for other pet owners."
        confirmLabel="Yes, Cancel Booking"
        cancelLabel="Keep Appointment"
        variant="destructive"
        onConfirm={handleConfirmCancel}
      />

      {/* Reschedule Confirmation Dialog */}
      <ConfirmDialog
        open={rescheduleDialogOpen}
        onOpenChange={setRescheduleDialogOpen}
        title="Confirm Reschedule?"
        description="Would you like to move this session to the next recommended opening (Tomorrow at 11:30 AM)?"
        confirmLabel="Confirm Reschedule"
        cancelLabel="Nevermind"
        onConfirm={handleConfirmReschedule}
      />

      {/* Official Universal GST Tax Invoice Modal */}
      <InvoiceModal
        open={invoiceModalOpen}
        onOpenChange={setInvoiceModalOpen}
        invoiceType={isVet ? "APPOINTMENT" : "SERVICE_BOOKING"}
        resourceId={booking.id}
      />
    </div>
  );
}
