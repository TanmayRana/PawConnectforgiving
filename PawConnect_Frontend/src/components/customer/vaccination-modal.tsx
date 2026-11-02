"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogBody,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { applyServerErrors } from "@/lib/utils/form-errors";

const vaccinationSchema = z
  .object({
    vaccineName: z
      .string()
      .trim()
      .min(1, "Vaccine name is required")
      .max(150, "Vaccine name cannot exceed 150 characters"),
    dateAdministered: z
      .string()
      .min(1, "Date administered is required")
      .refine(
        (val) => {
          const date = new Date(val);
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          return date <= today;
        },
        { message: "Vaccination date cannot be in the future" }
      ),
    nextDueDate: z.string().optional(),
    veterinarian: z
      .string()
      .trim()
      .min(1, "Veterinarian / clinic name is required")
      .max(150, "Veterinarian cannot exceed 150 characters"),
    notes: z.string().trim().max(1000, "Notes cannot exceed 1000 characters").optional(),
  })
  .refine(
    (data) => {
      if (!data.dateAdministered || !data.nextDueDate) return true;
      return new Date(data.nextDueDate) >= new Date(data.dateAdministered);
    },
    {
      message: "Next booster date must be on or after administration date",
      path: ["nextDueDate"],
    }
  );

type VaccinationFormData = z.infer<typeof vaccinationSchema>;

interface VaccinationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  petName: string;
  onSubmit: (data: VaccinationFormData) => Promise<void> | void;
  isSubmitting?: boolean;
}

export function VaccinationModal({
  open,
  onOpenChange,
  petName,
  onSubmit,
  isSubmitting = false,
}: VaccinationModalProps) {
  const [rootError, setRootError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    reset,
    formState: { errors },
  } = useForm<VaccinationFormData>({
    resolver: zodResolver(vaccinationSchema),
    defaultValues: {
      vaccineName: "",
      dateAdministered: new Date().toISOString().split("T")[0],
      nextDueDate: "",
      veterinarian: "Dr. Sarah Vance, DVM",
      notes: "",
    },
  });

  const dateAdministeredValue = watch("dateAdministered");
  const nextDueDateValue = watch("nextDueDate");

  React.useEffect(() => {
    if (open) {
      setRootError(null);
      reset({
        vaccineName: "",
        dateAdministered: new Date().toISOString().split("T")[0],
        nextDueDate: "",
        veterinarian: "Dr. Sarah Vance, DVM",
        notes: "",
      });
    }
  }, [open, reset]);

  const handleFormSubmit = async (data: VaccinationFormData) => {
    setRootError(null);
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = applyServerErrors(
        err,
        setError,
        "Unable to save vaccination entry. Please review highlighted fields."
      );
      if (msg) setRootError(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="wide">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            Add Vaccination for {petName}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Keep track of immunizations, boosters, and official veterinary certificates.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <DialogBody className="space-y-4">
            {rootError && (
              <div className="p-3 text-xs rounded-xl bg-destructive/10 text-destructive font-medium border border-destructive/20" role="alert">
                {rootError}
              </div>
            )}

            <Input
              label="Vaccine Name *"
              placeholder="e.g. DHPP Core Booster, Rabies"
              error={errors.vaccineName?.message}
              {...register("vaccineName")}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <DatePicker
                label="Date Administered *"
                required
                maxDate={new Date()}
                value={dateAdministeredValue}
                onChange={(val) =>
                  setValue("dateAdministered", val, { shouldValidate: true, shouldDirty: true })
                }
                error={errors.dateAdministered?.message}
                placeholder="Pick administration date"
              />

              <DatePicker
                label="Next Due Date (Optional)"
                minDate={new Date()}
                value={nextDueDateValue}
                onChange={(val) =>
                  setValue("nextDueDate", val, { shouldValidate: true, shouldDirty: true })
                }
                error={errors.nextDueDate?.message}
                placeholder="Pick next booster due date"
              />
            </div>

            <Input
              label="Veterinarian / Clinic *"
              placeholder="e.g. Dr. Sarah Vance, DVM"
              error={errors.veterinarian?.message}
              {...register("veterinarian")}
            />

            <Textarea
              label="Clinical Notes (Optional)"
              placeholder="Batch number, manufacturer, or post-vaccine observations..."
              rows={3}
              error={errors.notes?.message}
              {...register("notes")}
            />
          </DialogBody>

          <DialogFooter className="flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full shadow-sm px-6"
            >
              {isSubmitting ? "Saving..." : "Add Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

