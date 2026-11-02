"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useProviderProfile, useUpdateProviderProfile } from "@/lib/api/hooks";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ProfileFormModal } from "@/components/professional/profile-form-modal";
import { LoadingState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/utils/toast";
import {
  Sparkles,
  Scissors,
  Building2,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Edit2,
  Layers,
} from "lucide-react";
import type { ServiceProviderProfile } from "@/lib/mock/professionals";

export function ProviderProfileClient() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: profile, isLoading, isError, refetch } = useProviderProfile();
  const { mutateAsync: updateProfile, isPending: isUpdating } = useUpdateProviderProfile();

  if (isLoading) {
    return (
      <div className="py-8">
        <LoadingState variant="profile" message="Loading provider credentials..." />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="py-12">
        <ErrorState
          title="Could not load profile"
          description="Encountered an issue retrieving service provider credentials."
          action={
            <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  const handleUpdate = async (updates: Partial<ServiceProviderProfile>) => {
    try {
      await updateProfile(updates);
      toast.success("Profile Updated", {
        description: "Your business credentials and specialty details have been saved.",
      });
    } catch {
      toast.error("Update Failed", {
        description: "Could not save profile changes. Please retry.",
      });
    }
  };

  const isGrooming = profile.providerType === "grooming";

  return (
    <div className="space-y-8 pb-16 max-w-4xl">
      <PageHeader
        title="Provider Profile & Business Credentials"
        description="Public studio profile, care specialties, certifications, and client contact details."
      >
        <Button
          onClick={() => setModalOpen(true)}
          className="rounded-xl text-xs font-semibold gap-1.5 h-9"
        >
          <Edit2 className="h-4 w-4" />
          Edit Profile
        </Button>
      </PageHeader>

      {/* Main Profile Card */}
      <Card className="rounded-3xl border-border/80 p-6 sm:p-8 space-y-6 shadow-2xs">
        {/* Top Info Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-border/60">
          <div className="flex items-start sm:items-center gap-5">
            <div className="relative h-24 w-24 rounded-2xl overflow-hidden bg-secondary shrink-0 border-2 border-primary/20 shadow-xs">
              <Image
                src={profile.photo}
                alt={profile.name}
                fill
                sizes="96px"
                priority
                className="object-cover"
              />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
                <StatusBadge status={profile.verificationStatus} size="sm" />
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                {profile.businessName}
              </p>
              <div className="flex items-center gap-2 text-xs text-primary font-semibold pt-0.5">
                {isGrooming ? (
                  <Scissors className="h-3.5 w-3.5" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                <span className="capitalize">{profile.providerType} Specialist</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-1 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground text-sm">
              {profile.experienceYears} Years Professional Experience
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {profile.location}
            </span>
          </div>
        </div>

        {/* Verification Status Banner */}
        <div className="rounded-2xl border border-border/70 bg-surface/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-foreground">
                PawConnect Professional Network Verification
              </p>
              <p className="text-muted-foreground">
                Background-checked, certified pet-care standards endorsed by PawConnect.
              </p>
            </div>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs px-3 py-1 self-start sm:self-auto">
            Certified Partner
          </Badge>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-1.5">
            <span className="font-bold text-muted-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              Studio / Facility Name
            </span>
            <p className="font-bold text-foreground text-sm">{profile.businessName}</p>
            <p className="text-muted-foreground">{profile.location}</p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-1.5">
            <span className="font-bold text-muted-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-primary" />
              Active Specializations
            </span>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {profile.specializations.map((spec) => (
                <Badge
                  key={spec}
                  variant="outline"
                  className="text-[10px] font-semibold rounded-lg bg-surface"
                >
                  {spec}
                </Badge>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-1.5">
            <span className="font-bold text-muted-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-primary" />
              Direct Contact Telephone
            </span>
            <p className="font-bold text-foreground text-sm">{profile.phone}</p>
            <p className="text-muted-foreground">For active booking inquiries and pet parent arrivals</p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-1.5">
            <span className="font-bold text-muted-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-primary" />
              Business Email
            </span>
            <p className="font-bold text-foreground text-sm">{profile.email}</p>
            <p className="text-muted-foreground">Booking coordination and care plan summaries</p>
          </div>
        </div>

        {/* Biography */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Care Philosophy & Approach
          </h3>
          <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed rounded-2xl border border-border/60 bg-surface/40 p-4">
            {profile.bio}
          </p>
        </div>
      </Card>

      {/* Profile Form Modal */}
      <ProfileFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        role="provider"
        initialData={profile}
        onSubmit={handleUpdate}
        loading={isUpdating}
      />
    </div>
  );
}
