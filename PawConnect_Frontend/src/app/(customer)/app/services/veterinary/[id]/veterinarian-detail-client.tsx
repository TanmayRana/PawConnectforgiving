"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  GraduationCap,
  Award,
  Sparkles,
  ShieldCheck,
  Building2,
  Navigation,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/shared/rating-stars";
import { BookingModal } from "@/components/customer/booking-modal";
import { LoadingState, ErrorState } from "@/components/shared/states";
import { usePublicVeterinarian, usePublicReviews } from "@/lib/api/hooks";
import {
  LocationMap,
  searchAddress,
  type LocationCoordinates,
  type SearchResultItem,
} from "@/components/shared/location";

interface VeterinarianDetailClientProps {
  id: string;
}

export function VeterinarianDetailClient({ id }: VeterinarianDetailClientProps) {
  const router = useRouter();
  const [bookingModalOpen, setBookingModalOpen] = React.useState(false);

  const { data: vet, isLoading, isError, refetch } = usePublicVeterinarian(id);
  const { data: reviews = [] } = usePublicReviews({ veterinarianId: Number(id) });

  const hasExactCoords = Boolean(
    vet &&
    vet.clinicLatitude != null &&
    vet.clinicLongitude != null &&
    (vet.clinicLatitude !== 0 || vet.clinicLongitude !== 0)
  );

  const [geocodedCoords, setGeocodedCoords] = React.useState<LocationCoordinates | null>(null);

  // If coordinates were not saved on the vet profile, attempt geocoding the clinicAddress
  React.useEffect(() => {
    if (!vet || hasExactCoords) return;

    let isMounted = true;
    const addressToSearch = (vet.clinicAddress || vet.clinicName || "").trim();
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
  }, [hasExactCoords, vet]);

  const mapCoords: LocationCoordinates = React.useMemo(() => {
    if (vet && hasExactCoords) {
      return { lat: Number(vet.clinicLatitude), lng: Number(vet.clinicLongitude) };
    }
    if (geocodedCoords) {
      return geocodedCoords;
    }
    return {
      lat: 37.7749, // Default geographic center (San Francisco)
      lng: -122.4194,
    };
  }, [vet, hasExactCoords, geocodedCoords]);

  if (isLoading) {
    return (
      <div className="py-8">
        <LoadingState variant="detail" title="Loading doctor profile..." description="Fetching credential and clinic information." />
      </div>
    );
  }

  if (isError || !vet) {
    return (
      <div className="py-16 space-y-6">
        <Link
          href="/app/services/veterinary"
          className="inline-flex items-center text-sm font-medium text-paw-charcoal-muted hover:text-paw-charcoal"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Veterinarians
        </Link>
        <ErrorState
          title="Doctor Profile Not Found"
          description="Could not load the requested veterinarian from the active registry."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Back link */}
      <div>
        <Link
          href="/app/services/veterinary"
          className="inline-flex items-center text-sm font-medium text-paw-charcoal-muted hover:text-paw-charcoal transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Veterinarians
        </Link>
      </div>

      {/* Main Profile Header */}
      <div className="rounded-[32px] border border-border/80 bg-card p-6 sm:p-8 shadow-xs flex flex-col md:flex-row gap-6 md:gap-8 items-start">
        <div className="relative w-36 h-36 sm:w-48 sm:h-48 rounded-2xl overflow-hidden shrink-0 border border-border/60 bg-primary/10 shadow-inner flex items-center justify-center">
          {vet.profileImageUrl || vet.photo ? (
            <Image
              src={vet.profileImageUrl || vet.photo || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80"}
              alt={vet.name}
              fill
              sizes="(max-width: 640px) 144px, 192px"
              priority
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-primary font-bold text-3xl select-none">
              {vet.name
                .split(" ")
                .map((n) => n[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase() || "DR"}
            </div>
          )}
        </div>

        <div className="flex-1 w-full space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                  {vet.name}
                </h1>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-sm font-semibold text-primary mt-0.5">
                {vet.specialization || "Licensed Veterinarian"} {vet.qualification ? `• ${vet.qualification}` : ""}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <RatingStars rating={vet.rating || 0} reviewCount={vet.reviewCount || 0} size="md" />
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {vet.bio || "Dedicated veterinary practitioner committed to compassionate, fear-free clinical medicine."}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-muted-foreground">
            <a
              href="#clinic-location"
              className="flex items-center gap-1.5 bg-surface/70 hover:bg-surface px-3 py-1.5 rounded-xl border border-border/60 text-foreground transition-all duration-150 group cursor-pointer hover:border-primary/40 shadow-2xs"
            >
              <MapPin className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
              <span className="font-semibold">{vet.clinicName || "Veterinary Clinic"}</span>
              <span className="text-muted-foreground font-normal">({vet.clinicAddress || "Primary Location"})</span>
              <span className="text-[10px] font-bold text-primary underline underline-offset-2 ml-1">View Map</span>
            </a>
            <span className="flex items-center gap-1.5 bg-surface/70 px-3 py-1.5 rounded-xl border border-border/60">
              <Award className="w-3.5 h-3.5 text-sky-600" />
              {vet.experienceYears || 1} Years Clinical Experience
            </span>
            {vet.licenseNumber && (
              <span className="flex items-center gap-1.5 bg-surface/70 px-3 py-1.5 rounded-xl border border-border/60">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                License: {vet.licenseNumber}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Details & Booking Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Credentials & Reviews */}
        <div className="lg:col-span-2 space-y-6">
          {/* Clinical Expertise & Qualifications */}
          <div className="rounded-[28px] border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-5">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              Specialization & Credentials
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-surface/70 border border-border/60">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Primary Specialty
                </span>
                <span className="text-sm font-bold text-foreground mt-1 block">
                  {vet.specialization || "General Medicine"}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  Accredited clinical examination and diagnostic treatment.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-surface/70 border border-border/60">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Affiliated Practice
                </span>
                <span className="text-sm font-bold text-foreground mt-1 block">
                  {vet.clinicName || "Veterinary Practice"}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  Equipped with dedicated clinical suites and pharmacy services.
                </p>
              </div>
            </div>
          </div>

          {/* Hospital & Clinical Workplace Location Map */}
          <div id="clinic-location" className="rounded-[28px] border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-5 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Clinic & Workplace Location
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Visit {vet.name} at their accredited clinical hospital or consultation suite.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {hasExactCoords && (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25 text-[11px] font-medium gap-1 py-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    GPS Verified
                  </Badge>
                )}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${vet.clinicName || ""} ${vet.clinicAddress || ""}`.trim() || `${mapCoords.lat},${mapCoords.lng}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/90 transition-colors bg-primary/10 hover:bg-primary/15 px-3.5 py-2 rounded-xl border border-primary/20"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Get Directions
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Clinic Details Sub-Card */}
            <div className="p-4 rounded-2xl bg-surface/70 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Hospital & Consultation Practice
                </span>
                <h3 className="text-sm font-bold text-foreground">
                  {vet.clinicName || "Veterinary Practice & Clinical Suites"}
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  {vet.clinicAddress || "Primary Clinical Location"}
                </p>
              </div>

              {hasExactCoords && (
                <div className="text-left sm:text-right text-[11px] font-mono text-muted-foreground bg-background/80 px-3 py-1.5 rounded-xl border border-border/50 shrink-0">
                  <span className="block">Lat: {mapCoords.lat.toFixed(5)}</span>
                  <span className="block">Lng: {mapCoords.lng.toFixed(5)}</span>
                </div>
              )}
            </div>

            {/* Interactive Leaflet Map Container */}
            <div className="relative w-full h-[320px] sm:h-[380px] rounded-2xl overflow-hidden border border-border/70 shadow-inner bg-secondary/20">
              <LocationMap
                center={mapCoords}
                markerPosition={mapCoords}
                zoom={15}
                isDraggable={false}
                popupText={vet.clinicName ? `${vet.clinicName} — ${vet.name}` : vet.name}
                className="w-full h-full"
              />
              <div className="absolute bottom-3 left-3 z-[400] pointer-events-none">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-medium bg-background/95 text-foreground px-3 py-1 rounded-full shadow-md border border-border/60 backdrop-blur-xs">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  {vet.clinicName || "Clinic Location"}
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Dedicated pet check-in desks, exam rooms, and pharmacy suites are situated at this hospital.</span>
            </p>
          </div>

          {/* Genuine Client Reviews */}
          <div className="rounded-[28px] border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Verified Patient Reviews ({reviews.length})
              </h2>
              <RatingStars rating={vet.rating || 0} reviewCount={reviews.length} size="sm" />
            </div>

            {reviews.length === 0 ? (
              <div className="p-6 rounded-2xl bg-muted/40 border border-border text-center text-xs text-muted-foreground">
                No reviews yet for this doctor. Verified clients can submit reviews following a completed consultation.
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-2xl bg-surface/60 border border-border/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-foreground">
                        {rev.reviewerName}
                      </span>
                      <RatingStars rating={rev.rating} size="sm" />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      &quot;{rev.reviewText}&quot;
                    </p>
                    {rev.createdAt && (
                      <span className="text-[11px] text-muted-foreground block">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Booking Card & Action */}
        <div className="space-y-6">
          <div className="rounded-[28px] border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6 sticky top-24">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Standard Consultation Fee
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-foreground">
                  ₹{vet.consultationFee || 500}
                </span>
                <span className="text-xs text-muted-foreground">/ consultation visit</span>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-border/60 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" /> Availability:
                </span>
                <span className="font-semibold text-emerald-600">
                  {vet.isAvailableToday ? "Available Today" : "Online Appointments"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" /> Practice:
                </span>
                <a
                  href="#clinic-location"
                  className="font-semibold text-foreground hover:text-primary transition-colors text-right max-w-[160px] truncate group"
                  title={vet.clinicName || "Veterinary Hospital"}
                >
                  <span className="truncate">{vet.clinicName || "Veterinary Hospital"}</span>
                  <span className="block text-[10px] text-primary underline underline-offset-1 font-normal">View Map</span>
                </a>
              </div>
            </div>

            <Button
              onClick={() => setBookingModalOpen(true)}
              size="lg"
              className="w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base shadow-md gap-2"
            >
              <Calendar className="w-5 h-5" />
              Book Appointment
            </Button>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        open={bookingModalOpen}
        onOpenChange={setBookingModalOpen}
        type="veterinary"
        provider={{
          id: String(vet.id),
          name: vet.name,
          title: vet.specialization || "Veterinarian",
          clinicOrBusiness: vet.clinicName || "Veterinary Clinic",
          image: vet.profileImageUrl || vet.photo || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80",
          feeOrRate: vet.consultationFee || 500,
          feeLabel: "Consultation Fee",
          location: vet.clinicAddress || "Clinic",
        }}
        services={[
          {
            id: "srv-vet-consultation",
            title: vet.specialization ? `${vet.specialization} Clinical Consultation` : "Clinical Examination & Consultation",
            price: vet.consultationFee || 500,
            durationMinutes: 30,
          },
        ]}
        onSuccess={(booking) => {
          router.push(`/app/bookings/appointments/${booking.id}`);
        }}
      />
    </div>
  );
}
