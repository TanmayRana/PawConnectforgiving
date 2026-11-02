"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ProviderCard } from "@/components/shared/provider-card";
import { SearchBar } from "@/components/shared/search-bar";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingState, ErrorState } from "@/components/shared/states";
import { BookingModal } from "@/components/customer/booking-modal";
import { usePublicVeterinarians, type BackendPublicVeterinarian } from "@/lib/api/hooks";
import { Filter } from "lucide-react";

const SPECIALTY_OPTIONS = [
  "All Specialties",
  "Surgery",
  "Dermatology",
  "Emergency",
  "Dental",
];


export function VeterinaryClient() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedSpecialty, setSelectedSpecialty] = React.useState("All Specialties");
  const [availableTodayOnly, setAvailableTodayOnly] = React.useState(false);

  // Booking modal state
  const [bookingModalOpen, setBookingModalOpen] = React.useState(false);
  const [selectedVet, setSelectedVet] = React.useState<BackendPublicVeterinarian | null>(null);

  const {
    data: vets = [],
    isLoading,
    isError,
    refetch,
  } = usePublicVeterinarians({
    search: searchQuery.trim() || undefined,
    specialization: selectedSpecialty,
  });

  const filteredVets = React.useMemo(() => {
    return vets.filter((vet) => {
      if (availableTodayOnly && !vet.isAvailableToday) return false;
      return true;
    });
  }, [vets, availableTodayOnly]);

  const handleOpenBooking = (vet: BackendPublicVeterinarian) => {
    setSelectedVet(vet);
    setBookingModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      <PageHeader
        title="Veterinary Consultations"
        description="Book on-demand visits or routine clinical examinations with verified specialists."
      />

      {/* Filter and Search Bar */}
      <div className="space-y-4 rounded-3xl border border-border/80 bg-card p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="w-full sm:max-w-md">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by doctor, clinic, specialty or location..."
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant={availableTodayOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setAvailableTodayOnly(!availableTodayOnly)}
              className="rounded-full text-xs h-9 font-medium"
            >
              Available Today Only
            </Button>
          </div>
        </div>

        {/* Specialty Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Specialty:
          </span>
          {SPECIALTY_OPTIONS.map((spec) => {
            const isSelected = selectedSpecialty === spec;
            return (
              <button
                key={spec}
                onClick={() => setSelectedSpecialty(spec)}
                className={`text-xs px-3.5 py-1.5 rounded-xl font-medium transition-all duration-150 shrink-0 ${
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs ring-1 ring-primary/40"
                    : "bg-surface text-muted-foreground hover:text-foreground hover:bg-muted border border-border/70"
                }`}
              >
                {spec}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count & Live Status */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="font-medium text-foreground">
              Finding verified veterinary specialists...
            </span>
          </div>
        ) : (
          <span>
            Showing <strong className="text-foreground">{filteredVets.length}</strong> available veterinary doctors
          </span>
        )}
      </div>

      {/* API States & Grid */}
      {isLoading ? (
        <LoadingState variant="provider-cards" count={6} columns={3} />
      ) : isError ? (
        <ErrorState
          title="Failed to load doctors"
          description="Could not connect to the veterinarian registry. Please try again."
          action={
            <Button onClick={() => refetch()} variant="outline" className="rounded-full">
              Try Again
            </Button>
          }
        />
      ) : filteredVets.length === 0 ? (
        <EmptyState
          title="No Doctors Available"
          description="No veterinarians matched your current search criteria or availability filter."
          action={
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setSearchQuery("");
                setSelectedSpecialty("All Specialties");
                setAvailableTodayOnly(false);
              }}
            >
              Reset All Filters
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVets.map((vet) => (
            <ProviderCard
              key={vet.id}
              id={String(vet.id)}
              name={vet.name}
              title={vet.specialization || "Licensed Veterinarian"}
              specialty={vet.qualification || vet.specialization}
              location={vet.clinicAddress || vet.clinicName || "Veterinary Clinic"}
              rating={vet.rating || 0}
              reviewCount={vet.reviewCount || 0}
              fee={vet.consultationFee || 500}
              feeLabel="Consultation"
              nextAvailable={vet.isAvailableToday ? "Available Today" : "Book Online"}
              availableToday={vet.isAvailableToday}
              image={vet.profileImageUrl || ""}
              badges={[
                ...(vet.specialization ? [vet.specialization] : []),
                ...(vet.experienceYears ? [`${vet.experienceYears}y exp`] : []),
              ]}
              bio={vet.bio}
              detailsHref={`/app/services/veterinary/${vet.id}`}
              onSelect={() => handleOpenBooking(vet)}
            />
          ))}
        </div>
      )}

      {/* Universal Booking Modal */}
      {selectedVet && (
        <BookingModal
          open={bookingModalOpen}
          onOpenChange={setBookingModalOpen}
          type="veterinary"
          provider={{
            id: String(selectedVet.id),
            name: selectedVet.name,
            title: selectedVet.specialization || "Veterinarian",
            clinicOrBusiness: selectedVet.clinicName || "Veterinary Hospital",
            image: selectedVet.profileImageUrl || selectedVet.photo || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80",
            feeOrRate: selectedVet.consultationFee || 500,
            feeLabel: "Consultation Fee",
            location: selectedVet.clinicAddress || "Clinic",
          }}
          services={[
            {
              id: "srv-vet-consultation",
              title: selectedVet.specialization ? `${selectedVet.specialization} Clinical Consultation` : "Clinical Examination & Consultation",
              price: selectedVet.consultationFee || 500,
              durationMinutes: 30,
            },
          ]}
          onSuccess={(newBooking) => {
            router.push(`/app/bookings/appointments/${newBooking.id}`);
          }}
        />
      )}
    </div>
  );
}
