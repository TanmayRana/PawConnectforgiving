"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ProviderCard } from "@/components/shared/provider-card";
import { SearchBar } from "@/components/shared/search-bar";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingState, ErrorState } from "@/components/shared/states";
import { BookingModal } from "@/components/customer/booking-modal";
import { usePublicServiceProviders, type BackendPublicServiceProvider } from "@/lib/api/hooks";

export function TrainingClient() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");

  // Booking modal state
  const [bookingModalOpen, setBookingModalOpen] = React.useState(false);
  const [selectedTrainer, setSelectedTrainer] = React.useState<BackendPublicServiceProvider | null>(null);

  const {
    data: trainers = [],
    isLoading,
    isError,
    refetch,
  } = usePublicServiceProviders({
    search: searchQuery.trim() || undefined,
    providerType: "TRAINER",
  });

  const handleOpenBooking = (trainer: BackendPublicServiceProvider) => {
    setSelectedTrainer(trainer);
    setBookingModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      <PageHeader
        title="Canine Coaching & Training"
        description="Certified positive-reinforcement coaches for puppy manners, behavioral modification, and agility."
      />

      {/* Search and Filters */}
      <div className="bg-white p-5 rounded-3xl border border-paw-charcoal/10 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between dark:bg-card">
        <div className="w-full sm:max-w-md">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by trainer name, academy, or specialty..."
          />
        </div>
      </div>

      {/* Trainers List */}
      <div>
        {isLoading ? (
          <LoadingState variant="cards" count={6} columns={3} />
        ) : isError ? (
          <div className="bg-white rounded-3xl p-12 border border-paw-charcoal/10 dark:bg-card">
            <ErrorState
              title="Failed to load trainers"
              description="Could not connect to the trainer registry."
              onRetry={() => refetch()}
            />
          </div>
        ) : trainers.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-paw-charcoal/10 text-center dark:bg-card">
            <EmptyState
              title="No Trainers Found"
              description="No certified canine coaches currently registered in this category."
              action={
                searchQuery ? (
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear Search
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainers.map((trainer) => (
              <ProviderCard
                key={trainer.id}
                id={String(trainer.id)}
                name={trainer.name}
                title={trainer.businessName}
                specialty={trainer.description || "Positive Canine Coaching"}
                location={trainer.address || "Training Facility"}
                rating={trainer.rating || 0}
                reviewCount={trainer.reviewCount || 0}
                fee={65}
                feeLabel="Starting at"
                nextAvailable="Schedule Upon Booking"
                availableToday={true}
                image={trainer.profileImageUrl || ""}
                badges={["Trainer"]}
                detailsHref={`/app/services/training/${trainer.id}`}
                onSelect={() => handleOpenBooking(trainer)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {selectedTrainer && (
        <BookingModal
          open={bookingModalOpen}
          onOpenChange={setBookingModalOpen}
          type="training"
          provider={{
            id: String(selectedTrainer.id),
            name: selectedTrainer.name,
            title: selectedTrainer.businessName,
            clinicOrBusiness: selectedTrainer.businessName,
            image: selectedTrainer.profileImageUrl || "",
            feeOrRate: 65,
            feeLabel: "Starting Price",
            location: selectedTrainer.address || "Training Facility",
          }}
          services={[
            { id: "prog-train-standard", title: "Private Canine Coaching Session", price: 65, durationMinutes: 60 },
          ]}
          onSuccess={(booking) => {
            router.push(`/app/bookings/${booking.id}`);
          }}
        />
      )}
    </div>
  );
}
