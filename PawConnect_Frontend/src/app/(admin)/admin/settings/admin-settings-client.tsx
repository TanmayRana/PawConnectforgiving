"use client";

import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAdminSettings, useUpdateAdminSettings } from "@/lib/api/hooks";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { showSuccess } from "@/lib/utils/toast";
import { applyServerErrors } from "@/lib/utils/form-errors";
import {
  Building,
  CalendarDays,
  Truck,
  Save,
  AlertCircle,
} from "lucide-react";

const PHONE_REGEX = /^\+?[0-9]{10,15}$/;

const settingsSchema = z.object({
  platformName: z.string().trim().min(2, "Platform name is required").max(100),
  supportEmail: z.string().trim().email("Valid email is required"),
  supportPhone: z.string().trim().regex(PHONE_REGEX, "Enter a valid phone number (10-15 digits, optional + prefix)"),
  operatingCurrency: z.string().trim().min(1, "Currency is required").max(10),
  operatingCity: z.string().trim().min(2, "Operating city is required").max(100),
  cancellationNoticeHours: z.number({ message: "Hours required" }).min(0, "Cannot be negative").max(168, "Max 168 hours (7 days)"),
  appointmentBufferMinutes: z.number({ message: "Minutes required" }).min(0, "Cannot be negative").max(120, "Max 120 minutes"),
  autoConfirmBookings: z.boolean(),
  freeShippingThreshold: z.number({ message: "Threshold required" }).min(0, "Cannot be negative"),
  standardShippingFee: z.number({ message: "Fee required" }).min(0, "Cannot be negative"),
  taxRatePercent: z.number({ message: "Tax rate required" }).min(0, "Cannot be negative").max(50, "Max 50%"),
  maxUploadSizeMb: z.number({ message: "Upload size required" }).min(1, "Min 1 MB").max(100, "Max 100 MB"),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function AdminSettingsClient() {
  const { data: settings, isLoading, isError, refetch } = useAdminSettings();
  const { mutateAsync: updateSettings, isPending: isUpdating } = useUpdateAdminSettings();
  const [rootError, setRootError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    control,
    formState: { errors },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
  });

  const autoConfirmValue = useWatch({ control, name: "autoConfirmBookings" });

  useEffect(() => {
    if (settings) {
      reset({
        platformName: settings.platformName,
        supportEmail: settings.supportEmail,
        supportPhone: settings.supportPhone,
        operatingCurrency: settings.operatingCurrency,
        operatingCity: settings.operatingCity,
        cancellationNoticeHours: settings.cancellationNoticeHours,
        appointmentBufferMinutes: settings.appointmentBufferMinutes,
        autoConfirmBookings: settings.autoConfirmBookings,
        freeShippingThreshold: settings.freeShippingThreshold,
        standardShippingFee: settings.standardShippingFee,
        taxRatePercent: settings.taxRatePercent,
        maxUploadSizeMb: settings.maxUploadSizeMb,
      });
    }
  }, [settings, reset]);

  const handleSave = async (values: SettingsFormValues) => {
    setRootError(null);
    try {
      await updateSettings(values);
      showSuccess("Settings Saved", "Global platform parameters updated across all modules.");
    } catch (err: unknown) {
      const msg = applyServerErrors(err, setError, "Unable to save platform settings. Please check the highlighted fields.");
      if (msg) {
        setRootError(msg);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="py-8">
        <LoadingState variant="profile" message="Loading administrative platform settings..." />
      </div>
    );
  }

  if (isError || !settings) {
    return (
      <div className="py-12">
        <ErrorState
          title="Could not load settings"
          description="Failed to retrieve configuration."
          action={
            <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 max-w-4xl">
      <PageHeader
        title="Platform & Operational Settings"
        description="Global parameters governing care consultation booking policies, storefront retail shipping rules, and contact information."
      >
        <Button
          onClick={handleSubmit(handleSave)}
          disabled={isUpdating}
          size="sm"
          className="rounded-xl text-xs font-semibold h-9 gap-1.5"
        >
          <Save className="h-4 w-4" />
          {isUpdating ? "Saving..." : "Save Configurations"}
        </Button>
      </PageHeader>

      {rootError && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-destructive/10 p-3.5 text-xs text-destructive border border-destructive/20">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Settings Update Error</p>
            <p>{rootError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
        {/* Section 1: Platform Profile & Support */}
        <Card className="p-6 rounded-3xl border-border/80 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <Building className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Organization & Public Support</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <Input
              label="Platform Display Brand *"
              error={errors.platformName?.message}
              {...register("platformName")}
              className="rounded-xl h-10.5 text-xs"
            />

            <Input
              label="Central Operating Metro *"
              error={errors.operatingCity?.message}
              {...register("operatingCity")}
              className="rounded-xl h-10.5 text-xs"
            />

            <Input
              label="Support Telephone *"
              placeholder="+15550000000"
              error={errors.supportPhone?.message}
              {...register("supportPhone")}
              className="rounded-xl h-10.5 text-xs"
            />

            <Input
              label="Inquiries Email *"
              type="email"
              error={errors.supportEmail?.message}
              {...register("supportEmail")}
              className="rounded-xl h-10.5 text-xs"
            />
          </div>
        </Card>

        {/* Section 2: Care Consultation & Booking Policies */}
        <Card className="p-6 rounded-3xl border-border/80 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <CalendarDays className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Care Booking Policies</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <Input
              label="Cancellation Notice (Hours) *"
              type="number"
              error={errors.cancellationNoticeHours?.message}
              {...register("cancellationNoticeHours", { valueAsNumber: true })}
              className="rounded-xl h-10.5 text-xs"
            />

            <Input
              label="Consultation Buffer (Minutes) *"
              type="number"
              error={errors.appointmentBufferMinutes?.message}
              {...register("appointmentBufferMinutes", { valueAsNumber: true })}
              className="rounded-xl h-10.5 text-xs"
            />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-border/70 p-3 bg-surface/50 text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-foreground">Automated Session Confirmation</span>
              <p className="text-[11px] text-muted-foreground">
                Instantly confirm client bookings upon payment rather than requiring practitioner manual approval.
              </p>
            </div>
            <Switch
              checked={autoConfirmValue}
              onCheckedChange={(checked) => setValue("autoConfirmBookings", checked, { shouldDirty: true })}
            />
          </div>
        </Card>

        {/* Section 3: Storefront Retail & Shipping Rules */}
        <Card className="p-6 rounded-3xl border-border/80 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <Truck className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Fulfillment & Shipping Thresholds</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <Input
              label="Free Shipping Min (₹) *"
              type="number"
              step="0.01"
              error={errors.freeShippingThreshold?.message}
              {...register("freeShippingThreshold", { valueAsNumber: true })}
              className="rounded-xl h-10.5 text-xs"
            />

            <Input
              label="Standard Delivery Fee (₹) *"
              type="number"
              step="0.01"
              error={errors.standardShippingFee?.message}
              {...register("standardShippingFee", { valueAsNumber: true })}
              className="rounded-xl h-10.5 text-xs"
            />

            <Input
              label="Estimated Sales Tax (%) *"
              type="number"
              step="0.1"
              error={errors.taxRatePercent?.message}
              {...register("taxRatePercent", { valueAsNumber: true })}
              className="rounded-xl h-10.5 text-xs"
            />
          </div>
        </Card>
      </form>
    </div>
  );
}
