"use client";

import * as React from "react";
import { ProviderCard } from "@/components/shared/provider-card";
import { SearchBar } from "@/components/shared/search-bar";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingState, ErrorState } from "@/components/shared/states";
import { useAuthModal } from "@/stores/auth-modal.store";
import { StaggerView, StaggerItem } from "@/lib/animations/motion-components";
import { toast } from "@/lib/utils/toast";
import { Heart } from "lucide-react";
import { usePublicServiceProviders, type BackendPublicServiceProvider } from "@/lib/api/hooks";
import { RefreshIndicator } from "@/components/ui/paw-spinner";

interface TrainingClientProps {
  initialProviders?: BackendPublicServiceProvider[];
}
export function TrainingClient({ initialProviders }: TrainingClientProps = {}) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const { openLogin } = useAuthModal();

  const { data: providers = initialProviders || [], isLoading, isFetching, isError, refetch } = usePublicServiceProviders({
    search: searchQuery.trim() || undefined,
    providerType: "TRAINER",
  });

  const handleBookTrainer = (provider: BackendPublicServiceProvider) => {
    toast.info(`Booking evaluation session with ${provider.businessName}`, {
      description: "Sign in to select your training schedule and location.",
      action: {
        label: "Sign In",
        onClick: openLogin,
      },
    });
  };

  return (
    <div className="space-y-12">

      {/* ─── Certified Trainers Section ──────────────────────────────────────── */}
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600">Certified Instructors</span>
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Verified Professional Trainers</h2>
            </div>
            <RefreshIndicator isRefreshing={isFetching && !isLoading} label="Refreshing..." />
          </div>
          <p className="text-xs text-muted-foreground">
            CPDT-KA, Fear-Free & Canine Good Citizen Evaluators
          </p>
        </div>

        {/* Filter controls */}
        <div className="rounded-[32px] border border-border/70 bg-white p-5 shadow-sm dark:bg-card">
          <div className="grid gap-4 md:grid-cols-12 md:items-center">
            <div className="md:col-span-10">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search trainers by business name, city, or specialty..."
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-3 md:col-span-2 md:justify-end">
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-muted-foreground"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* API States */}
        {isLoading ? (
          <div className="py-6">
            <LoadingState variant="provider-cards" count={6} />
          </div>
        ) : isError ? (
          <div className="rounded-[32px] border border-border/70 bg-white p-12 dark:bg-card">
            <ErrorState
              title="Unable to load trainers"
              description="Could not connect to the service provider registry. Please try again."
              onRetry={() => refetch()}
            />
          </div>
        ) : providers.length === 0 ? (
          <EmptyState
            title="No certified trainers available yet"
            description="There are currently no registered training specialists matching your criteria. Check back soon as positive trainers join our network."
            action={
              searchQuery ? (
                <Button onClick={() => setSearchQuery("")} className="rounded-full shadow-sm">
                  Clear Search
                </Button>
              ) : undefined
            }
          />
        ) : (
          <StaggerView className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map((provider) => (
              <StaggerItem key={provider.id}>
                <ProviderCard
                  id={String(provider.id)}
                  name={provider.businessName}
                  title="Professional Canine Coach"
                  specialty={provider.description || "Canine Behavior & Obedience"}
                  location={provider.address || "Available in Service Area"}
                  rating={provider.rating || 0}
                  reviewCount={provider.reviewCount || 0}
                  fee={1200}
                  feeLabel="Starting at"
                  nextAvailable="Schedule Upon Booking"
                  availableToday={true}
                  image={provider.profileImageUrl || ""}
                  badges={["Verified Partner", "Training"]}
                  bio={provider.description}
                  detailsHref={`/app/services/training/${provider.id}`}
                  onSelect={() => handleBookTrainer(provider)}
                />
              </StaggerItem>
            ))}
          </StaggerView>
        )}
      </div>

      {/* ─── Training Philosophy Banner ─────────────────────────────────────── */}
      <div className="rounded-[32px] border border-sky-200 bg-sky-50/70 p-7 dark:border-sky-900/60 dark:bg-sky-950/20">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-sm">
            <Heart className="h-7 w-7" />
          </div>
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-base font-bold text-foreground">Our 100% Fear-Free Guarantee</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Every trainer on PawConnect is pledged to force-free, humane positive methods.
              We build trust, communication, and confidence between you and your dog without fear,
              pain, or intimidation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
