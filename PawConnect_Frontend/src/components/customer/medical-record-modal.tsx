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
import { SelectField } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { applyServerErrors } from "@/lib/utils/form-errors";

const medicalRecordSchema = z.object({
  recordType: z.enum(["Examination", "Surgery", "Dental", "Diagnostic", "Therapy"], {
    message: "Please choose a record type",
  }),
  date: z
    .string()
    .min(1, "Visit date is required")
    .refine(
      (val) => {
        const date = new Date(val);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return date <= today;
      },
      { message: "Procedure date cannot be in the future" }
    ),
  description: z
    .string()
    .trim()
    .min(2, "Description must be at least 2 characters")
    .max(255, "Description cannot exceed 255 characters"),
  veterinarian: z
    .string()
    .trim()
    .min(1, "Veterinarian name is required")
    .max(150, "Veterinarian name cannot exceed 150 characters"),
  clinic: z
    .string()
    .trim()
    .min(1, "Clinic name is required")
    .max(150, "Clinic name cannot exceed 150 characters"),
  notes: z.string().trim().max(1000, "Notes cannot exceed 1000 characters").optional(),
});

type MedicalRecordFormData = z.infer<typeof medicalRecordSchema>;

interface MedicalRecordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  petName: string;
  onSubmit: (data: MedicalRecordFormData) => Promise<void> | void;
  isSubmitting?: boolean;
}

export function MedicalRecordModal({
  open,
  onOpenChange,
  petName,
  onSubmit,
  isSubmitting = false,
}: MedicalRecordModalProps) {
  const [rootError, setRootError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    reset,
    formState: { errors },
  } = useForm<MedicalRecordFormData>({
    resolver: zodResolver(medicalRecordSchema),
    defaultValues: {
      recordType: "Examination",
      date: new Date().toISOString().split("T")[0],
      description: "",
      veterinarian: "Dr. Sarah Vance, DVM",
      clinic: "PawConnect Central Animal Hospital",
      notes: "",
    },
  });

  const dateValue = watch("date");

  React.useEffect(() => {
    if (open) {
      setRootError(null);
      reset({
        recordType: "Examination",
        date: new Date().toISOString().split("T")[0],
        description: "",
        veterinarian: "Dr. Sarah Vance, DVM",
        clinic: "PawConnect Central Animal Hospital",
        notes: "",
      });
    }
  }, [open, reset]);

  const handleFormSubmit = async (data: MedicalRecordFormData) => {
    setRootError(null);
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = applyServerErrors(
        err,
        setError,
        "Unable to save medical entry. Please review highlighted fields."
      );
      if (msg) setRootError(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="wide">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            Add Medical Record for {petName}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Document diagnostic results, surgeries, clinical therapies, and prescriptions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <DialogBody className="space-y-4">
            {rootError && (
              <div className="p-3 text-xs rounded-xl bg-destructive/10 text-destructive font-medium border border-destructive/20" role="alert">
                {rootError}
              </div>
            )}
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Record Category *"
              defaultValue="Examination"
              onValueChange={(val) =>
                setValue("recordType", val as "Examination" | "Surgery" | "Dental" | "Diagnostic" | "Therapy")
              }
              options={[
                { value: "Examination", label: "Physical Exam" },
                { value: "Diagnostic", label: "Diagnostics / Lab" },
                { value: "Dental", label: "Dental Procedure" },
                { value: "Surgery", label: "Surgical Record" },
                { value: "Therapy", label: "Physical Therapy" },
              ]}
              error={errors.recordType?.message}
            />

            <DatePicker
              label="Procedure Date *"
              required
              maxDate={new Date()}
              value={dateValue}
              onChange={(val) =>
                setValue("date", val, { shouldValidate: true, shouldDirty: true })
              }
              error={errors.date?.message}
              placeholder="Pick procedure date"
            />
          </div>

          <Input
            label="Diagnosis / Procedure Title *"
            placeholder="e.g. Annual ear cytology and wellness exam"
            error={errors.description?.message}
            {...register("description")}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Treating Doctor *"
              placeholder="Dr. Sarah Vance, DVM"
              error={errors.veterinarian?.message}
              {...register("veterinarian")}
            />

            <Input
              label="Clinic Location *"
              placeholder="PawConnect Animal Hospital"
              error={errors.clinic?.message}
              {...register("clinic")}
            />
          </div>

          <Textarea
            label="Doctor Findings & Prescriptions (Optional)"
            placeholder="Dosages, treatment plans, follow-up instructions..."
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
              {isSubmitting ? "Saving..." : "Save Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
