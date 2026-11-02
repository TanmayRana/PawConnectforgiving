"use client";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { SelectField } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { ImageUpload } from "@/components/shared/image-upload";
import { applyServerErrors } from "@/lib/utils/form-errors";
import type { Pet } from "@/lib/mock/pets";

const petFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Pet name is required")
    .max(100, "Pet name must not exceed 100 characters"),
  species: z
    .string()
    .trim()
    .min(1, "Species is required")
    .max(50, "Species cannot exceed 50 characters"),
  breed: z
    .string()
    .trim()
    .min(1, "Breed is required")
    .max(100, "Breed must not exceed 100 characters"),
  gender: z.enum(["Male", "Female", "MALE", "FEMALE"], {
    message: "Please select gender",
  }),
  dateOfBirth: z.string().optional(),
  age: z
    .number({ message: "Please enter a valid age number" })
    .min(0, "Age cannot be negative")
    .max(35, "Please enter a valid age")
    .optional(),
  weight: z
    .number({ message: "Please enter weight in kg" })
    .positive("Weight must be positive")
    .min(0.01, "Weight must be at least 0.01 kg"),
  color: z
    .string()
    .trim()
    .max(100, "Coat color must not exceed 100 characters")
    .optional(),
  notes: z
    .string()
    .trim()
    .max(1000, "Notes must not exceed 1000 characters")
    .optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  photo: z
    .string()
    .trim()
    .max(500, "Photo URL cannot exceed 500 characters")
    .optional(),
  microchipId: z.string().trim().max(100, "Microchip cannot exceed 100 characters").optional(),
});

type PetFormData = z.infer<typeof petFormSchema>;

interface PetFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialData?: Pet | null;
  onSubmit: (data: Partial<Pet> & { name: string; species: string }) => Promise<void> | void;
  isSubmitting?: boolean;
}

function parseLocalDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split("-").map(Number);
  if (parts.length === 3 && !parts.some(isNaN)) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function calculateAgeFromDob(dob?: string): number {
  if (!dob) return 0;
  const birth = parseLocalDate(dob);
  if (!birth) return 0;
  const now = new Date();
  if (birth > now) return 0;

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (now.getDate() < birth.getDate()) {
    months--;
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const decimalYears = years + months / 12;
  return Math.round(decimalYears * 10) / 10;
}

function getFriendlyAgeText(dob?: string): string | null {
  if (!dob) return null;
  const birth = parseLocalDate(dob);
  if (!birth) return null;
  const now = new Date();
  if (birth > now) return null;

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  const days = now.getDate() - birth.getDate();

  if (days < 0) {
    months--;
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? "month" : "months"}`);
  if (parts.length === 0) return "Auto-calculated: Under 1 month";
  return `Auto-calculated: ${parts.join(", ")}`;
}

function getDobFromAge(ageYears: number): string {
  const daysAgo = Math.round(Number(ageYears) * 365.25);
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function PetFormModal({
  open,
  onOpenChange,
  mode,
  initialData,
  onSubmit,
  isSubmitting = false,
}: PetFormModalProps) {
  const [rootError, setRootError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    setError,
    reset,
    control,
    formState: { errors },
  } = useForm<PetFormData>({
    resolver: zodResolver(petFormSchema),
    defaultValues: {
      name: "",
      species: "Dog",
      breed: "",
      gender: "Male",
      dateOfBirth: "",
      age: 1,
      weight: 5,
      color: "",
      notes: "",
      status: "ACTIVE",
      photo: "",
      microchipId: "",
    },
  });

  const photoValue = useWatch({ control, name: "photo" });
  const dobValue = useWatch({ control, name: "dateOfBirth" });

  const friendlyAgeText = React.useMemo(() => getFriendlyAgeText(dobValue), [dobValue]);

  // Handle Date of Birth change and automatically recalculate age
  const handleDobChange = (dateStr: string) => {
    setValue("dateOfBirth", dateStr, { shouldValidate: true, shouldDirty: true });
    if (dateStr) {
      const calculatedAge = calculateAgeFromDob(dateStr);
      setValue("age", calculatedAge, { shouldValidate: true, shouldDirty: true });
    }
  };

  React.useEffect(() => {
    if (open) {
      setRootError(null);
      if (mode === "edit" && initialData) {
        let extractedColor = initialData.color || "";
        let extractedMicrochip = initialData.microchipId || (initialData as { microchipNumber?: string }).microchipNumber || "";
        const rawNotes = initialData.notes || "";

        if (!extractedColor && rawNotes && /Color:\s*([^;\n]+)/i.test(rawNotes)) {
          const match = rawNotes.match(/Color:\s*([^;\n]+)/i);
          if (match) {
            extractedColor = match[1].trim();
          }
        }

        if (!extractedMicrochip && rawNotes && /Microchip:\s*([^;\n]+)/i.test(rawNotes)) {
          const match = rawNotes.match(/Microchip:\s*([^;\n]+)/i);
          if (match) {
            extractedMicrochip = match[1].trim();
          }
        }

        // Clean metadata tags out of the care notes textarea for a clean UI
        const cleanedNotes = rawNotes
          .replace(/Color:\s*[^;\n]+/gi, "")
          .replace(/Microchip:\s*[^;\n]+/gi, "")
          .trim();

        const exactDob = initialData.dateOfBirth || initialData.birthDate || "";
        const numericAge =
          exactDob
            ? calculateAgeFromDob(exactDob)
            : initialData.age !== undefined
            ? initialData.age
            : 1;

        const isFem =
          initialData.gender === "Female" ||
          (typeof initialData.gender === "string" && initialData.gender.toUpperCase() === "FEMALE");

        reset({
          name: initialData.name || "",
          species: initialData.species || "Dog",
          breed: initialData.breed || "",
          gender: isFem ? "Female" : "Male",
          dateOfBirth: exactDob,
          age: numericAge,
          weight:
            initialData.weight !== undefined && initialData.weight !== null
              ? Number(initialData.weight)
              : 5,
          color: extractedColor,
          notes: cleanedNotes,
          status: initialData.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
          photo: initialData.photo || initialData.photoUrl || "",
          microchipId: extractedMicrochip,
        });
      } else {
        reset({
          name: "",
          species: "Dog",
          breed: "",
          gender: "Male",
          dateOfBirth: "",
          age: 1,
          weight: 5,
          color: "",
          notes: "",
          status: "ACTIVE",
          photo: "",
          microchipId: "",
        });
      }
    }
  }, [open, mode, initialData, reset]);

  const handleFormSubmit = async (data: PetFormData) => {
    setRootError(null);
    try {
      let finalDob = data.dateOfBirth?.trim();
      if (!finalDob && data.age !== undefined && data.age !== null && !isNaN(Number(data.age))) {
        finalDob = getDobFromAge(data.age);
      }

      const chipStr = data.microchipId?.trim() || "";

      await onSubmit({
        name: data.name,
        species: data.species,
        breed: data.breed,
        gender: data.gender,
        dateOfBirth: finalDob,
        birthDate: finalDob,
        age: data.age,
        weight: data.weight,
        color: data.color || "",
        notes: data.notes || "",
        status: data.status || "ACTIVE",
        photo: data.photo,
        photoUrl: data.photo,
        microchipId: chipStr,
        microchipNumber: chipStr,
      });
      onOpenChange(false);
    } catch (err: unknown) {
      const generalMsg = applyServerErrors(
        err,
        setError,
        "Unable to save pet profile. Please review the highlighted fields."
      );
      if (generalMsg) {
        setRootError(generalMsg);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="wide">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            {mode === "create" ? "Add a New Pet" : `Edit ${initialData?.name || "Pet"}`}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {mode === "create"
              ? "Register your pet into PawConnect to manage medical records and book appointments."
              : "Update your companion's core profile, weight, health notes, and identification."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <DialogBody className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {rootError && (
              <div className="p-3 text-xs rounded-xl bg-destructive/10 text-destructive font-medium border border-destructive/20" role="alert">
                {rootError}
              </div>
            )}

            {/* Row 1: Name & Species */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Pet Name *"
                placeholder="e.g. Milo or Tinni"
                error={errors.name?.message}
                {...register("name")}
              />

              <SelectField
                label="Species *"
                defaultValue={initialData?.species || "Dog"}
                onValueChange={(val) => {
                  setValue("species", val, { shouldValidate: true, shouldDirty: true });
                }}
                options={[
                  { value: "Dog", label: "Dog" },
                  { value: "Cat", label: "Cat" },
                  { value: "Bird", label: "Bird" },
                  { value: "Rabbit", label: "Rabbit" },
                  { value: "Hamster", label: "Hamster" },
                  { value: "Other", label: "Other / Exotic" },
                ]}
                error={errors.species?.message}
              />
            </div>

            {/* Row 2: Breed & Gender */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Breed *"
                placeholder="e.g. African Grey Parrot or Golden Retriever"
                error={errors.breed?.message}
                {...register("breed")}
              />

              <SelectField
                label="Gender *"
                defaultValue={
                  initialData?.gender === "Female" ||
                  (typeof initialData?.gender === "string" && initialData.gender.toUpperCase() === "FEMALE")
                    ? "Female"
                    : "Male"
                }
                onValueChange={(val) => setValue("gender", val as "Male" | "Female")}
                options={[
                  { value: "Male", label: "Male" },
                  { value: "Female", label: "Female" },
                ]}
                error={errors.gender?.message}
              />
            </div>

            {/* Row 3: Date of Birth & Age (with Auto-Calculation) */}
            <div className="grid gap-4 sm:grid-cols-2 items-start">
              <DatePicker
                label="Date of Birth (Optional)"
                placeholder="Pick birth date..."
                maxDate={new Date()}
                value={dobValue}
                onChange={handleDobChange}
                error={errors.dateOfBirth?.message}
                allowClear
              />

              <div className="space-y-1">
                <Input
                  label="Age (Years) *"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 1 or 1.2"
                  error={errors.age?.message}
                  {...register("age", { valueAsNumber: true })}
                />
                {friendlyAgeText && (
                  <p className="text-[11px] text-primary font-medium flex items-center gap-1.5 pt-0.5">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                    {friendlyAgeText}
                  </p>
                )}
              </div>
            </div>

            {/* Row 4: Weight & Coat Color */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Weight (kg) *"
                type="number"
                step="any"
                min="0.01"
                placeholder="e.g. 0.4 or 25.5"
                error={errors.weight?.message}
                {...register("weight", { valueAsNumber: true })}
              />

              <Input
                label="Coat / Feather Color"
                placeholder="e.g. Grey or Golden Blonde"
                error={errors.color?.message}
                {...register("color")}
              />
            </div>

            {/* Row 5: Notes & Special Instructions */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block">
                Care Notes & Medical Instructions (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Color: Grey, special diet, temperament, allergies, or care preferences..."
                className="w-full rounded-2xl border border-input bg-background p-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register("notes")}
              />
              {errors.notes?.message && (
                <p className="mt-1 text-xs text-destructive">{errors.notes.message}</p>
              )}
            </div>

            {/* Row 6: Profile Status (in Edit Mode) */}
            {mode === "edit" && (
              <SelectField
                label="Profile Status"
                defaultValue={initialData?.status || "ACTIVE"}
                onValueChange={(val) => setValue("status", val as "ACTIVE" | "INACTIVE")}
                options={[
                  { value: "ACTIVE", label: "Active" },
                  { value: "INACTIVE", label: "Archived / Inactive" },
                ]}
                error={errors.status?.message}
              />
            )}

            {/* Row 7: Photo Upload */}
            <ImageUpload
              label="Pet Profile Photo (Optional)"
              required={false}
              folder="pets"
              value={photoValue}
              onChange={(url) => setValue("photo", url, { shouldValidate: true, shouldDirty: true })}
              error={errors.photo?.message}
              helperText="Upload a picture of your companion or provide an image link (optional)."
            />

            {/* Row 8: Microchip Number */}
            <Input
              label="Microchip Number (Optional)"
              placeholder="98514100..."
              error={errors.microchipId?.message}
              {...register("microchipId")}
            />
          </DialogBody>

          <DialogFooter className="flex-col sm:flex-row gap-3 pt-3">
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
              pawLoading={isSubmitting}
              className="rounded-full shadow-sm px-6"
            >
              {isSubmitting
                ? "Saving..."
                : mode === "create"
                ? "Save Pet Profile"
                : "Update Profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
