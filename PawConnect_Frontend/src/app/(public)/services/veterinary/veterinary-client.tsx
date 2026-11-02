"use client";

import * as React from "react";
import { ProviderCard } from "@/components/shared/provider-card";
import { SearchBar } from "@/components/shared/search-bar";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingState, ErrorState } from "@/components/shared/states";
import { useAuthModal } from "@/stores/auth-modal.store";
import { toast } from "@/lib/utils/toast";
import { StaggerView, StaggerItem } from "@/lib/animations/motion-components";
import { Filter, AlertCircle } from "lucide-react";
import { usePublicVeterinarians, type BackendPublicVeterinarian } from "@/lib/api/hooks";
import { RefreshIndicator } from "@/components/ui/paw-spinner";

interface VeterinaryClientProps {
  initialVets?: BackendPublicVeterinarian[];
}

const SPECIALTY_OPTIONS = [
  "All Specialties",
  "Surgery",
  "Dermatology",
  "Emergency",
  "Dental",
];

export function VeterinaryClient({ initialVets }: VeterinaryClientProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedSpecialty, setSelectedSpecialty] = React.useState("All Specialties");
  const [availableTodayOnly, setAvailableTodayOnly] = React.useState(false);
  const { openLogin } = useAuthModal();

  const { data: vets = initialVets || [], isLoading, isFetching, isError, refetch } = usePublicVeterinarians({
    search: searchQuery.trim() || undefined,
    specialization: selectedSpecialty !== "All Specialties" ? selectedSpecialty : undefined,
  });

  const filteredVets = React.useMemo(() => {
    return vets.filter((vet) => {
      const matchesAvailability = !availableTodayOnly || vet.isAvailableToday;
      return matchesAvailability;
    });
  }, [vets, availableTodayOnly]);

  const handleBook = (vet: BackendPublicVeterinarian) => {
    toast.info(`Booking consultation with ${vet.name}`, {
      description: "Sign in or create an account to confirm your real-time slot.",
      action: {
        label: "Sign In",
        onClick: openLogin,
      },
    });
  };

  return (
    <div className="space-y-10">
      {/* ─── Search & Filter Bar ────────────────────────────────────────────── */}
      <div className="rounded-[32px] border border-border/70 bg-white p-5 shadow-sm dark:bg-card">
        <div className="grid gap-4 md:grid-cols-12 md:items-center">
          <div className="md:col-span-6">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by doctor name, specialty, or clinic..."
              className="w-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 md:col-span-6 md:justify-end">
            <button
              onClick={() => setAvailableTodayOnly(!availableTodayOnly)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-[background-color,border-color,color] duration-150 motion-reduce:transition-none border ${
                availableTodayOnly
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700"
                  : "bg-surface text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              ● Available Today
            </button>

            {(searchQuery || selectedSpecialty !== "All Specialties" || availableTodayOnly) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedSpecialty("All Specialties");
                  setAvailableTodayOnly(false);
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Reset Filters
              </Button>
            )}
          </div>
        </div>

        {/* Specialization Chips */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mr-1">
            <Filter className="h-3.5 w-3.5" />
            Specialty:
          </span>
          {SPECIALTY_OPTIONS.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`rounded-full px-3.5 py-1 text-xs font-medium transition-[background-color,color,box-shadow] duration-150 motion-reduce:transition-none ${
                selectedSpecialty === spec
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-surface text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Results Section ─────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-foreground">
              Available Specialists {isLoading ? <span className="text-sm font-normal text-muted-foreground animate-pulse">(finding specialists...)</span> : `(${filteredVets.length})`}
            </h2>
            <RefreshIndicator isRefreshing={isFetching && !isLoading} label="Refreshing..." />
          </div>
          <span className="text-xs text-muted-foreground">
            Real-time verified calendar derivations
          </span>
        </div>

        {isLoading ? (
          <div className="py-6">
            <LoadingState variant="provider-cards" count={6} />
          </div>
        ) : isError ? (
          <div className="py-12">
            <ErrorState
              title="Could not load practitioners"
              description="Failed to load practitioner licensing records."
              action={
                <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
                  Retry
                </Button>
              }
            />
          </div>
        ) : filteredVets.length === 0 ? (
          <EmptyState
            title="No specialists matched your filter"
            description="Try adjusting your keywords or clearing the specialization filter to view all veterinary doctors."
            action={
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedSpecialty("All Specialties");
                  setAvailableTodayOnly(false);
                }}
                className="rounded-full shadow-sm"
              >
                Clear All Filters
              </Button>
            }
          />
        ) : (
          <StaggerView key={`${selectedSpecialty}-${availableTodayOnly}`} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
            {filteredVets.map((vet) => (
              <StaggerItem key={vet.id}>
                <ProviderCard
                  id={String(vet.id)}
                  name={vet.name}
                  title={vet.qualification || "Licensed Practitioner"}
                  specialty={vet.specialization || "General Medicine"}
                  location={vet.clinicName ? (vet.clinicAddress ? `${vet.clinicName} • ${vet.clinicAddress}` : vet.clinicName) : "PawConnect Care Center"}
                  rating={vet.rating ?? 0}
                  reviewCount={vet.reviewCount ?? 0}
                  fee={vet.consultationFee ?? 0}
                  feeLabel="Consultation Fee"
                  nextAvailable="Schedule appointment"
                  availableToday={Boolean(vet.isAvailableToday)}
                  image={vet.profileImageUrl || ""}
                  badges={vet.experienceYears ? [`${vet.experienceYears} Years Experience`] : []}
                  bio={vet.bio || "Certified veterinary specialist practicing compassionate animal healthcare."}
                  detailsHref={`/app/services/veterinary/${vet.id}`}
                  onSelect={() => handleBook(vet)}
                />
              </StaggerItem>
            ))}
          </StaggerView>
        )}
      </div>

      {/* ─── Emergency Banner ───────────────────────────────────────────────── */}
      <div className="rounded-[32px] border border-amber-200 bg-amber-50/70 p-6 dark:border-amber-900/60 dark:bg-amber-950/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-amber-500/20 p-2 text-amber-700 dark:text-amber-400 shrink-0">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Experiencing a medical emergency?</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Our Urgent Care Hub has board-certified trauma vets on-call 24 hours a day, 7 days a week.
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="destructive" className="rounded-full shrink-0">
            <a href="tel:18005557299">Call Emergency: 1-800-PAW-HELP</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
