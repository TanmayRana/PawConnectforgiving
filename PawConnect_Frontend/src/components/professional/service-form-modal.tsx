"use client";

import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormModal } from "@/components/shared/form-shells";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { applyServerErrors } from "@/lib/utils/form-errors";
import type { ProviderService } from "@/lib/mock/professionals";
import { cn } from "@/lib/utils";

const serviceSchema = z.object({
  name: z.string().trim().min(2, "Service name must be at least 2 characters").max(100, "Service name cannot exceed 100 characters"),
  category: z.enum(["grooming", "training"]),
  description: z.string().trim().min(10, "Please provide at least 10 characters describing the service").max(1000, "Description cannot exceed 1000 characters"),
  price: z.number({ message: "Price is required" }).min(0, "Price cannot be negative").max(10000, "Price cannot exceed ₹10,000"),
  durationMinutes: z.number({ message: "Duration is required" }).min(5, "Duration must be at least 5 minutes").max(480, "Duration cannot exceed 8 hours"),
  active: z.boolean(),
});

export type ServiceFormData = z.infer<typeof serviceSchema>;

interface ServiceFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: ProviderService | null;
  onSubmit: (data: ServiceFormData) => Promise<void> | void;
  loading?: boolean;
}

export function ServiceFormModal({
  open,
  onOpenChange,
  service,
  onSubmit,
  loading = false,
}: ServiceFormModalProps) {
  const isEdit = Boolean(service);
  const [rootError, setRootError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    control,
    reset,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      category: "grooming",
      description: "",
      price: 50,
      durationMinutes: 45,
      active: true,
    },
  });

  const categoryValue = useWatch({ control, name: "category" });
  const isActive = useWatch({ control, name: "active" });

  useEffect(() => {
    if (open) {
      setRootError(null);
      if (service) {
        reset({
          name: service.name,
          category: service.category,
          description: service.description,
          price: service.price,
          durationMinutes: service.durationMinutes,
          active: service.active,
        });
      } else {
        reset({
          name: "",
          category: "grooming",
          description: "",
          price: 50,
          durationMinutes: 45,
          active: true,
        });
      }
    }
  }, [open, service, reset]);

  const handleFormSubmit = async (data: ServiceFormData) => {
    setRootError(null);
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = applyServerErrors(err, setError, "Unable to save service. Please review the highlighted fields.");
      if (msg) {
        setRootError(msg);
      }
    }
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit Service Offering" : "Add New Service Offering"}
      description="Configure package details, duration, pricing, and active booking availability."
      onSubmit={handleSubmit(handleFormSubmit)}
      loading={loading}
      submitLabel={isEdit ? "Save Changes" : "Create Service"}
    >
      <div className="space-y-4 pt-1 max-h-[70vh] overflow-y-auto pr-1">
        {rootError && (
          <div className="flex items-start gap-2.5 rounded-2xl bg-destructive/10 p-3.5 text-xs text-destructive border border-destructive/20 mb-3">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Unable to Save Service</p>
              <p>{rootError}</p>
            </div>
          </div>
        )}

        <Input
          label="Service Name *"
          placeholder="e.g. Hydro-Therapy De-Shedding Bath"
          error={errors.name?.message}
          {...register("name")}
          className="rounded-xl h-10 text-xs"
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Service Category *</label>
            <Select
              value={categoryValue}
              onValueChange={(val) => setValue("category", val as "grooming" | "training")}
            >
              <SelectTrigger className="w-full rounded-xl h-10 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grooming">Grooming & Spa</SelectItem>
                <SelectItem value="training">Training & Behavior</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Input
            label="Price (₹ INR) *"
            type="number"
            min={0}
            step="1"
            error={errors.price?.message}
            {...register("price", { valueAsNumber: true })}
            className="rounded-xl h-10 text-xs"
          />
        </div>

        <Input
          label="Estimated Duration (Minutes) *"
          type="number"
          min={5}
          step="5"
          placeholder="45"
          error={errors.durationMinutes?.message}
          {...register("durationMinutes", { valueAsNumber: true })}
          className="rounded-xl h-10 text-xs"
        />

        <Textarea
          label="Service Description *"
          rows={3}
          placeholder="Describe what is included in this session, suitable breeds, and techniques used..."
          error={errors.description?.message}
          {...register("description")}
          className="rounded-xl text-xs leading-relaxed"
        />

        {/* Active Availability Switch */}
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface/50">
          <div>
            <p className="text-xs font-bold text-foreground">Active for Client Booking</p>
            <p className="text-[11px] text-muted-foreground">
              When inactive, clients cannot book new sessions for this service
            </p>
          </div>
          <button
            type="button"
            onClick={() => setValue("active", !isActive)}
            className={cn(
              "w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5",
              isActive ? "bg-primary" : "bg-muted"
            )}
          >
            <span
              className={cn(
                "w-5 h-5 rounded-full bg-white transition-transform shadow-xs",
                isActive ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>
      </div>
    </FormModal>
  );
}
