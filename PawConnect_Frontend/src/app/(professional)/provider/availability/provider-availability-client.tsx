"use client";

import React from "react";
import {
  useProfessionalAvailability,
  useUpdateProfessionalAvailability,
} from "@/lib/api/hooks";
import { PageHeader } from "@/components/shared/page-header";
import { AvailabilityEditor } from "@/components/professional/availability-editor";
import { LoadingState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/utils/toast";
import type { DaySchedule } from "@/lib/mock/professionals";

export function ProviderAvailabilityClient() {
  const { data: availability, isLoading, isError, refetch } =
    useProfessionalAvailability("provider");
  const { mutateAsync: updateSchedule, isPending: isUpdating } =
    useUpdateProfessionalAvailability("provider");

  if (isLoading) {
    return (
      <div className="py-8">
        <LoadingState variant="list" count={7} message="Loading provider working schedule..." />
      </div>
    );
  }

  if (isError || !availability) {
    return (
      <div className="py-12">
        <ErrorState
          title="Could not load availability"
          description="Encountered an issue retrieving your operational schedule. Please retry."
          action={
            <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  const handleUpdateSchedule = async (schedule: DaySchedule[], notes?: string) => {
    try {
      await updateSchedule({ schedule, notes });
      toast.success("Schedule Updated", {
        description: "Your bookable client appointment windows have been synchronized.",
      });
    } catch {
      toast.error("Update Failed", {
        description: "Could not save schedule changes. Please retry.",
      });
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Provider Working Hours & Availability"
        description="Set your daily spa opening times, canine training session windows, and slot durations."
      />

      <AvailabilityEditor
        availability={availability}
        onUpdateSchedule={handleUpdateSchedule}
        isUpdating={isUpdating}
      />
    </div>
  );
}
