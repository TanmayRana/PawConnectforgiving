"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useVetProfile, useUpdateVetProfile } from "@/lib/api/hooks";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ProfileFormModal } from "@/components/professional/profile-form-modal";
import { LoadingState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/utils/toast";
import {
  Stethoscope,
  GraduationCap,
  Building2,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Edit2,
} from "lucide-react";
import type { VeterinarianProfile } from "@/lib/mock/professionals";

export function VetProfileClient() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: profile, isLoading, isError, refetch } = useVetProfile();
  const { mutateAsync: updateProfile, isPending: isUpdating } = useUpdateVetProfile();

  if (isLoading) {
    return (
      <div className="py-8">
        <LoadingState variant="profile" message="Loading practitioner profile..." />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="py-12">
        <ErrorState
          title="Could not load profile"
          description="Encountered an issue retrieving practitioner credentials."
          action={
            <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  const handleUpdate = async (updates: Partial<VeterinarianProfile>) => {
    try {
      await updateProfile(updates);
      toast.success("Profile Updated", {
        description: "Your practitioner credentials and clinical details have been saved.",
      });
    } catch {
      toast.error("Update Failed", {
        description: "Could not save profile changes. Please retry.",
      });
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl">
      <PageHeader
        title="Practitioner Credentials & Profile"
        description="Public clinician profile, licensing qualifications, and hospital workplace details."
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
                {profile.qualification}
              </p>
              <div className="flex items-center gap-2 text-xs text-primary font-semibold pt-0.5">
                <Stethoscope className="h-3.5 w-3.5" />
                <span>{profile.specialization}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-1 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground text-sm">
              {profile.experienceYears} Years Clinical Practice
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
                Veterinary Medical Board Licensing Verification
              </p>
              <p className="text-muted-foreground">
                Credentials reviewed and endorsed by PawConnect Clinical Standards Board.
              </p>
            </div>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs px-3 py-1 self-start sm:self-auto">
            Authorized Practitioner
          </Badge>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-1.5">
            <span className="font-bold text-muted-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              Workplace & Hospital
            </span>
            <p className="font-bold text-foreground text-sm">{profile.clinic}</p>
            <p className="text-muted-foreground">{profile.location}</p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-1.5">
            <span className="font-bold text-muted-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 text-primary" />
              Degree & Accreditations
            </span>
            <p className="font-bold text-foreground text-sm">{profile.qualification}</p>
            <p className="text-muted-foreground">{profile.specialization}</p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-1.5">
            <span className="font-bold text-muted-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-primary" />
              Clinical Contact Telephone
            </span>
            <p className="font-bold text-foreground text-sm">{profile.phone}</p>
            <p className="text-muted-foreground">Available during scheduled operational hours</p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-1.5">
            <span className="font-bold text-muted-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-primary" />
              Direct Clinical Email
            </span>
            <p className="font-bold text-foreground text-sm">{profile.email}</p>
            <p className="text-muted-foreground">Internal referrals and client record inquiries</p>
          </div>
        </div>

        {/* Biography */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Professional Statement & Philosophy
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
        role="vet"
        initialData={profile}
        onSubmit={handleUpdate}
        loading={isUpdating}
      />
    </div>
  );
}
