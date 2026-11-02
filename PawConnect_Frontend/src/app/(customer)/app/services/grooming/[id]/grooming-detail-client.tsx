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
  Scissors,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/shared/rating-stars";
import { BookingModal } from "@/components/customer/booking-modal";
import { LoadingState, ErrorState } from "@/components/shared/states";
import { usePublicServiceProvider, usePublicReviews } from "@/lib/api/hooks";

interface GroomingDetailClientProps {
  id: string;
}


export function GroomingDetailClient({ id }: GroomingDetailClientProps) {
  const router = useRouter();
  const [bookingModalOpen, setBookingModalOpen] = React.useState(false);
  const [selectedServiceId, setSelectedServiceId] = React.useState<string | undefined>(undefined);

  const { data: provider, isLoading, isError, refetch } = usePublicServiceProvider(id);
  const { data: reviews = [] } = usePublicReviews({ providerId: Number(id) });

  const handleBookService = (serviceId?: string) => {
    setSelectedServiceId(serviceId);
    setBookingModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="py-8">
        <LoadingState variant="detail" title="Loading salon profile..." description="Fetching groomer details from the registry." />
      </div>
    );
  }

  if (isError || !provider) {
    return (
      <div className="py-16 space-y-6">
        <Link
          href="/app/services/grooming"
          className="inline-flex items-center text-sm font-medium text-paw-charcoal-muted hover:text-paw-charcoal"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Grooming
        </Link>
        <ErrorState
          title="Salon Profile Not Found"
          description="Could not load the requested grooming provider."
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
          href="/app/services/grooming"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Grooming
        </Link>
      </div>

      {/* Hero Salon Header */}
      <div className="rounded-[32px] border border-border/80 bg-card p-6 sm:p-8 shadow-xs flex flex-col md:flex-row gap-6 md:gap-8 items-start">
        <div className="relative w-36 h-36 sm:w-48 sm:h-48 rounded-2xl overflow-hidden shrink-0 border border-border/60 bg-primary/10 shadow-inner flex items-center justify-center">
          {provider.profileImageUrl || provider.photo ? (
            <Image
              src={provider.profileImageUrl || provider.photo || "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=600&q=80"}
              alt={provider.businessName}
              fill
              sizes="(max-width: 640px) 144px, 192px"
              priority
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-primary font-bold text-3xl select-none">
              {provider.businessName
                .split(" ")
                .map((n) => n[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase() || "GR"}
            </div>
          )}
        </div>

        <div className="flex-1 w-full space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                  {provider.businessName}
                </h1>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-sm font-semibold text-primary mt-0.5">
                Lead Stylist: {provider.name}
              </p>
            </div>

            <RatingStars rating={provider.rating || 0} reviewCount={reviews.length} size="md" />
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {provider.description || "Professional gentle pet grooming, styling, and soothing spa treatments."}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 bg-surface/70 px-3 py-1.5 rounded-xl border border-border/60">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              {provider.address || "Service Salon"}
            </span>
            <span className="flex items-center gap-1.5 bg-surface/70 px-3 py-1.5 rounded-xl border border-border/60">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              {provider.experienceYears ? `${provider.experienceYears} Years Experience` : "Verified Partner"}
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Packages & Booking Sticky */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Services & Reviews */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-[28px] border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-5">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Scissors className="w-5 h-5 text-primary" />
              Grooming Services & Care
            </h2>

            <div className="p-5 rounded-2xl border border-border/70 bg-surface/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-foreground text-base">Full Grooming & Styling Session</h4>
                  <Badge variant="outline" className="text-xs">
                    60 mins
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Warm organic shampoo bath, gentle blow dry, breed trimming, hygienic paw care, and coat detangling.
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                <span className="text-xl font-bold text-foreground">₹800</span>
                <Button
                  size="sm"
                  onClick={() => handleBookService("srv-groom-standard")}
                  className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-4 shadow-xs"
                >
                  Select & Book
                </Button>
              </div>
            </div>
          </div>

          {/* Genuine Client Reviews */}
          <div className="rounded-[28px] border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Verified Client Reviews ({reviews.length})
              </h2>
              <RatingStars rating={provider.rating || 0} reviewCount={reviews.length} size="sm" />
            </div>

            {reviews.length === 0 ? (
              <div className="p-6 rounded-2xl bg-muted/40 border border-border text-center text-xs text-muted-foreground">
                No reviews yet for this salon. Verified pet owners can submit reviews following a completed grooming appointment.
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

        {/* Right Col: Booking Card */}
        <div className="space-y-6">
          <div className="rounded-[28px] border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6 sticky top-24">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Starting Rate
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-foreground">
                  ₹800
                </span>
                <span className="text-xs text-muted-foreground">/ standard package</span>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-border/60 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Location:</span>
                <span className="font-semibold text-foreground">{provider.address || "Service Salon"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Schedule:</span>
                <span className="font-semibold text-emerald-700">Online Appointment</span>
              </div>
            </div>

            <Button
              onClick={() => handleBookService()}
              size="lg"
              className="w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base shadow-md gap-2"
            >
              <Calendar className="w-5 h-5" />
              Book Grooming
            </Button>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        open={bookingModalOpen}
        onOpenChange={setBookingModalOpen}
        type="grooming"
        provider={{
          id: String(provider.id),
          name: provider.name,
          title: provider.businessName,
          clinicOrBusiness: provider.businessName,
          image: provider.profileImageUrl || provider.photo || "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=600&q=80",
          feeOrRate: 800,
          feeLabel: "Starting Price",
          location: provider.address || "Salon",
        }}
        services={[
          { id: "srv-groom-standard", title: "Full Coat Grooming Session", price: 800, durationMinutes: 60 },
        ]}
        defaultServiceId={selectedServiceId}
        onSuccess={(booking) => {
          router.push(`/app/bookings/${booking.id}`);
        }}
      />
    </div>
  );
}
