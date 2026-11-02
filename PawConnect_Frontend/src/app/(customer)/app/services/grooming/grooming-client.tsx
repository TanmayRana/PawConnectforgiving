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

export function GroomingClient() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");

  // Booking modal state
  const [bookingModalOpen, setBookingModalOpen] = React.useState(false);
  const [selectedProvider, setSelectedProvider] = React.useState<BackendPublicServiceProvider | null>(null);

  const {
    data: providers = [],
    isLoading,
    isError,
    refetch,
  } = usePublicServiceProviders({
    search: searchQuery.trim() || undefined,
    providerType: "GROOMER",
  });

  const handleOpenBooking = (provider: BackendPublicServiceProvider) => {
    setSelectedProvider(provider);
    setBookingModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      <PageHeader
        title="Pet Grooming & Spa"
        description="Book full haircuts, soothing herbal baths, de-shedding treatments, and pawdicures with verified stylists."
      />

      {/* Search and Filters */}
      <div className="bg-white p-5 rounded-3xl border border-paw-charcoal/10 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between dark:bg-card">
        <div className="w-full sm:max-w-md">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by salon name, stylist, or address..."
          />
        </div>
      </div>

      {/* Salons List */}
      <div>
        {isLoading ? (
          <LoadingState variant="cards" count={6} columns={3} />
        ) : isError ? (
          <div className="bg-white rounded-3xl p-12 border border-paw-charcoal/10 dark:bg-card">
            <ErrorState
              title="Failed to load groomers"
              description="Could not connect to the service provider registry."
              onRetry={() => refetch()}
            />
          </div>
        ) : providers.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-paw-charcoal/10 text-center dark:bg-card">
            <EmptyState
              title="No Groomers Found"
              description="No grooming salons currently registered in this category."
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
            {providers.map((provider) => (
              <ProviderCard
                key={provider.id}
                id={String(provider.id)}
                name={provider.name}
                title={provider.businessName}
                specialty={provider.description || "Grooming & Spa"}
                location={provider.address || "Service Salon"}
                rating={provider.rating || 0}
                reviewCount={provider.reviewCount || 0}
                fee={50}
                feeLabel="Starting at"
                nextAvailable="Schedule Upon Booking"
                availableToday={true}
                image={provider.profileImageUrl || ""}
                badges={["Grooming"]}
                detailsHref={`/app/services/grooming/${provider.id}`}
                onSelect={() => handleOpenBooking(provider)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {selectedProvider && (
        <BookingModal
          open={bookingModalOpen}
          onOpenChange={setBookingModalOpen}
          type="grooming"
          provider={{
            id: String(selectedProvider.id),
            name: selectedProvider.name,
            title: selectedProvider.businessName,
            clinicOrBusiness: selectedProvider.businessName,
            image: selectedProvider.profileImageUrl || "",
            feeOrRate: 50,
            feeLabel: "Starting Price",
            location: selectedProvider.address || "Salon",
          }}
          services={[
            { id: "srv-groom-standard", title: "Full Grooming & Styling Session", price: 50, durationMinutes: 60 },
          ]}
          onSuccess={(booking) => {
            router.push(`/app/bookings/${booking.id}`);
          }}
        />
      )}
    </div>
  );
}
