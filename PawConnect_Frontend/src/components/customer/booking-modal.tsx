"use client";

import * as React from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogBody,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { usePets } from "@/lib/api/hooks";
import { useCreateBooking } from "@/lib/api/hooks";
import type { CustomerBooking } from "@/lib/mock/bookings";
import { showSuccess, showError } from "@/lib/utils/toast";
import {
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Scissors,
  Award,
  CreditCard,
  Loader2,
} from "lucide-react";

export interface BookingModalProvider {
  id: string;
  name: string;
  title: string;
  clinicOrBusiness: string;
  image: string;
  feeOrRate: number;
  feeLabel?: string;
  location: string;
}

export interface BookingModalService {
  id: string;
  title: string;
  price: number;
  durationMinutes: number;
}

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "veterinary" | "grooming" | "training";
  provider: BookingModalProvider;
  services?: BookingModalService[];
  defaultServiceId?: string;
  onSuccess?: (booking: CustomerBooking) => void;
}

const AVAILABLE_SLOTS = [
  { time: "09:00 AM", status: "available" },
  { time: "10:30 AM", status: "available" },
  { time: "11:45 AM", status: "unavailable" },
  { time: "01:15 PM", status: "available" },
  { time: "02:30 PM", status: "available" },
  { time: "04:00 PM", status: "unavailable" },
  { time: "05:15 PM", status: "available" },
] as const;

export function BookingModal({
  open,
  onOpenChange,
  type,
  provider,
  services = [],
  defaultServiceId,
  onSuccess,
}: BookingModalProps) {
  const { data: pets = [] } = usePets();
  const createBookingMutation = useCreateBooking();

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const [selectedPetId, setSelectedPetId] = React.useState<string>("");
  const [selectedDate, setSelectedDate] = React.useState<string>(getTomorrowDate);
  const [selectedTime, setSelectedTime] = React.useState<string>("10:30 AM");
  const [selectedServiceId, setSelectedServiceId] = React.useState<string>("");
  const [notes, setNotes] = React.useState("");
  const [conflictError, setConflictError] = React.useState<string | null>(null);

  const activePetId = selectedPetId || (pets.length > 0 ? pets[0].id : "");
  const selectedPet = pets.find((p) => p.id === activePetId) || pets[0];

  const activeServiceId =
    selectedServiceId || defaultServiceId || (services.length > 0 ? services[0].id : "");
  const activeService = services.find((s) => s.id === activeServiceId);

  const price = activeService ? activeService.price : provider.feeOrRate;
  const duration = activeService ? activeService.durationMinutes : 45;
  const serviceTitle = activeService
    ? activeService.title
    : type === "veterinary"
    ? "Comprehensive Clinical Examination"
    : type === "grooming"
    ? "Full Spa & Grooming Treatment"
    : "Positive Reinforcement Coaching";

  const handleConfirmBooking = async () => {
    if (!selectedPet) {
      showError("Pet Selection Required", "Please select a registered pet to proceed with booking.");
      return;
    }
    if (!selectedDate || !selectedTime) {
      showError("Date & Time Required", "Please pick an available appointment date and time slot.");
      return;
    }

    setConflictError(null);

    try {
      const newBooking = await createBookingMutation.mutateAsync({
        type,
        providerId: provider.id,
        providerName: provider.name,
        providerTitle: provider.title,
        providerClinicOrBusiness: provider.clinicOrBusiness,
        providerImage: provider.image,
        serviceId: selectedServiceId || `srv-${type}-default`,
        serviceTitle,
        petId: selectedPet.id,
        petName: selectedPet.name,
        petBreed: selectedPet.breed || selectedPet.species,
        petPhoto: selectedPet.photo,
        date: selectedDate,
        time: selectedTime,
        durationMinutes: duration,
        price,
        notes: notes.trim(),
        location: provider.location,
      });

      const returnedStatus = (newBooking.status || "scheduled").toUpperCase();
      showSuccess("Booking Submitted", `Appointment #${newBooking.appointmentNumber} with ${provider.name} is ${returnedStatus}.`);

      onSuccess?.(newBooking);
      onOpenChange(false);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "The selected time slot is no longer available. Please select another time.";
      setConflictError(errorMsg);
      showError("Slot Conflict Notice", errorMsg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="wide">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft text-primary">
              {type === "veterinary" ? (
                <Stethoscope className="h-4 w-4" />
              ) : type === "grooming" ? (
                <Scissors className="h-4 w-4" />
              ) : (
                <Award className="h-4 w-4" />
              )}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              {type === "veterinary"
                ? "Veterinary Visit"
                : type === "grooming"
                ? "Grooming Salon"
                : "Canine Coaching"}
            </span>
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            Book Appointment with {provider.name}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {provider.clinicOrBusiness} • Real-time verified booking
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6">
          {conflictError && (
            <div className="flex items-start gap-2.5 rounded-2xl bg-destructive/10 p-3.5 text-xs text-destructive border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Slot Conflict Notice</p>
                <p>{conflictError}</p>
              </div>
            </div>
          )}
          {/* ─── 1. Select Pet ──────────────────────────────────────────────── */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              1. Select Pet *
            </label>
            {pets.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No pets found in your profile. Please add a pet first.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {pets.map((p) => {
                  const isSelected = (selectedPet?.id || "") === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPetId(p.id)}
                      className={`flex items-center gap-2.5 rounded-2xl p-2.5 border transition-[background-color,border-color,box-shadow] duration-150 motion-reduce:transition-none text-left ${
                        isSelected
                          ? "border-primary bg-primary-soft/30 shadow-xs"
                          : "border-border bg-surface hover:bg-muted/70"
                      }`}
                    >
                      <div className="relative h-9 w-9 overflow-hidden rounded-full shrink-0 border border-border">
                        <Image
                          src={p.photo}
                          alt={p.name}
                          fill
                          sizes="36px"
                          className="object-cover"
                        />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-foreground truncate">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{p.species}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ─── 2. Service Package (if multiple available) ─────────────────── */}
          {services.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                2. Select Package / Service
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {services.map((s) => {
                  const isSelected = activeServiceId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedServiceId(s.id)}
                      className={`flex items-start justify-between rounded-2xl p-3 border text-left transition-[background-color,border-color] duration-150 motion-reduce:transition-none ${
                        isSelected
                          ? "border-primary bg-primary-soft/30"
                          : "border-border bg-white hover:bg-surface dark:bg-card"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-foreground">{s.title}</p>
                        <p className="text-[11px] text-muted-foreground">{s.durationMinutes} minutes</p>
                      </div>
                      <span className="text-xs font-bold text-primary">₹{s.price}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── 3. Select Date & Available Slots ──────────────────────────── */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              3. Date & Available Time Slot *
            </label>
            <div className="grid gap-3 sm:grid-cols-2 items-center">
              <div>
                <span className="text-[11px] text-muted-foreground block mb-1">Appointment Date</span>
                <DatePicker
                  value={selectedDate}
                  minDate={new Date()}
                  onChange={(val) => setSelectedDate(val)}
                  allowClear={false}
                  placeholder="Select appointment date"
                />
              </div>

              <div>
                <span className="text-[11px] text-muted-foreground block mb-1">Schedule Notice</span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Real-time slot availability. Slots are reserved upon final checkout confirmation.
                </p>
              </div>
            </div>

            {/* Slots Matrix */}
            <div className="pt-1">
              <span className="text-[11px] text-muted-foreground block mb-1.5">
                Available Slots on {selectedDate}:
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {AVAILABLE_SLOTS.map((slot) => {
                  const isAvailable = slot.status === "available";
                  const isSelected = selectedTime === slot.time;

                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => {
                        setSelectedTime(slot.time);
                        setConflictError(null);
                      }}
                      className={`rounded-xl py-2 px-1 text-center text-xs font-medium transition-[background-color,border-color,color,box-shadow] duration-150 motion-reduce:transition-none ${
                        !isAvailable
                          ? "bg-surface/50 text-muted-foreground/40 line-through cursor-not-allowed border border-transparent"
                          : isSelected
                          ? "bg-primary text-primary-foreground font-bold shadow-xs border border-primary"
                          : "bg-surface text-foreground hover:border-primary/50 border border-border/80"
                      }`}
                    >
                      {slot.time}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ─── 4. Reason / Special Instructions ─────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              4. Symptoms or Special Notes
            </label>
            <Textarea
              placeholder="Describe symptoms, pet temperament, or specific areas of concern..."
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs"
            />
          </div>

          {/* ─── 5. Summary & Confirmation Footer ─────────────────────────── */}
          <div className="rounded-2xl border border-border/70 bg-surface/60 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Service:</span>
              <span className="font-semibold text-foreground">{serviceTitle}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Estimated Duration:</span>
              <span className="font-medium text-foreground">{duration} minutes</span>
            </div>
            <div className="flex items-center justify-between text-xs border-t border-border/60 pt-2 font-bold">
              <span className="text-foreground">Total Fee:</span>
              <span className="text-base text-primary font-extrabold">₹{price.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
              <CreditCard className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Razorpay Secure Payments — Slot is reserved upon confirmation; fee is paid securely via Razorpay.</span>
            </div>
          </div>
        </DialogBody>

        <DialogFooter className="flex-col sm:flex-row gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirmBooking}
            disabled={createBookingMutation.isPending || !selectedPet || !selectedDate || !selectedTime}
            className="rounded-full shadow-sm px-6"
          >
            {createBookingMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Reserving Slot...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirm Appointment (₹{price.toFixed(2)})</span>
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
