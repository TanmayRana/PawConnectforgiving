"use client";

import React, { useEffect, useState } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormModal } from "@/components/shared/form-shells";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/shared/image-upload";
import { AlertCircle } from "lucide-react";
import { applyServerErrors } from "@/lib/utils/form-errors";
import type {
  VeterinarianProfile,
  ServiceProviderProfile,
} from "@/lib/mock/professionals";

const PHONE_REGEX = /^\+?[0-9]{10,15}$/;

const vetSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Invalid email address"),
  phone: z.string().trim().regex(PHONE_REGEX, "Enter a valid phone number (10-15 digits, optional + prefix)"),
  photo: z.string().trim().max(500, "Photo URL cannot exceed 500 characters").optional(),
  qualification: z.string().trim().min(2, "Qualification is required").max(100),
  specialization: z.string().trim().min(2, "Specialization is required").max(100),
  experienceYears: z.number({ message: "Years of experience is required" }).min(0, "Cannot be negative").max(60, "Cannot exceed 60 years"),
  clinic: z.string().trim().min(2, "Clinic / hospital is required").max(100),
  location: z.string().trim().min(2, "Location is required").max(150),
  bio: z.string().trim().min(10, "Please provide at least 10 characters for bio").max(1000),
});

const providerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  businessName: z.string().trim().min(2, "Business name is required").max(100),
  email: z.string().trim().email("Invalid email address"),
  phone: z.string().trim().regex(PHONE_REGEX, "Enter a valid phone number (10-15 digits, optional + prefix)"),
  photo: z.string().trim().max(500, "Photo URL cannot exceed 500 characters").optional(),
  specializations: z.string().trim().min(2, "Enter at least one specialty").max(200),
  experienceYears: z.number({ message: "Years of experience is required" }).min(0, "Cannot be negative").max(60, "Cannot exceed 60 years"),
  location: z.string().trim().min(2, "Location is required").max(150),
  bio: z.string().trim().min(10, "Please provide at least 10 characters for bio").max(1000),
});

export type ProfileFormData = {
  name: string;
  email: string;
  phone: string;
  photo?: string;
  experienceYears: number;
  location: string;
  bio: string;
  qualification?: string;
  specialization?: string;
  clinic?: string;
  businessName?: string;
  specializations?: string;
};

interface ProfileFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: "vet" | "provider";
  initialData: VeterinarianProfile | ServiceProviderProfile;
  onSubmit: (data: Partial<VeterinarianProfile & ServiceProviderProfile>) => Promise<void> | void;
  loading?: boolean;
}

export function ProfileFormModal({
  open,
  onOpenChange,
  role,
  initialData,
  onSubmit,
  loading = false,
}: ProfileFormModalProps) {
  const isVet = role === "vet";
  const [rootError, setRootError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    control,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: (isVet ? zodResolver(vetSchema) : zodResolver(providerSchema)) as unknown as Resolver<ProfileFormData>,
    defaultValues: isVet
      ? {
          name: (initialData as VeterinarianProfile).name || "",
          email: initialData.email || "",
          phone: initialData.phone || "",
          photo: initialData.photo || "",
          qualification: (initialData as VeterinarianProfile).qualification || "",
          specialization: (initialData as VeterinarianProfile).specialization || "",
          experienceYears: initialData.experienceYears || 0,
          clinic: (initialData as VeterinarianProfile).clinic || "",
          location: initialData.location || "",
          bio: initialData.bio || "",
        }
      : {
          name: initialData.name || "",
          businessName: (initialData as ServiceProviderProfile).businessName || "",
          email: initialData.email || "",
          phone: initialData.phone || "",
          photo: initialData.photo || "",
          specializations:
            (initialData as ServiceProviderProfile).specializations?.join(", ") || "",
          experienceYears: initialData.experienceYears || 0,
          location: initialData.location || "",
          bio: initialData.bio || "",
        },
  });

  const photoValue = useWatch({ control, name: "photo" });

  useEffect(() => {
    if (open) {
      setRootError(null);
      if (isVet) {
        const v = initialData as VeterinarianProfile;
        reset({
          name: v.name,
          email: v.email,
          phone: v.phone,
          photo: v.photo || "",
          qualification: v.qualification,
          specialization: v.specialization,
          experienceYears: v.experienceYears,
          clinic: v.clinic,
          location: v.location,
          bio: v.bio,
        });
      } else {
        const p = initialData as ServiceProviderProfile;
        reset({
          name: p.name,
          businessName: p.businessName,
          email: p.email,
          phone: p.phone,
          photo: p.photo || "",
          specializations: p.specializations?.join(", ") || "",
          experienceYears: p.experienceYears,
          location: p.location,
          bio: p.bio,
        });
      }
    }
  }, [open, isVet, initialData, reset]);

  const handleFormSubmit = async (values: ProfileFormData) => {
    setRootError(null);
    try {
      const { specializations, ...rest } = values;
      if (!isVet) {
        const specs = typeof specializations === "string"
          ? specializations.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [];
        await onSubmit({ ...rest, specializations: specs });
      } else {
        await onSubmit(rest);
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = applyServerErrors(err, setError, "Unable to save profile changes. Please review the highlighted fields.");
      if (msg) {
        setRootError(msg);
      }
    }
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={isVet ? "Edit Veterinarian Profile" : "Edit Service Provider Profile"}
      description="Keep your clinical credentials, workplace, and contact details updated."
      onSubmit={handleSubmit(handleFormSubmit)}
      loading={loading}
      submitLabel="Save Changes"
      className="sm:max-w-xl"
    >
      <div className="space-y-4 pt-1 max-h-[70vh] overflow-y-auto pr-1">
        {rootError && (
          <div className="flex items-start gap-2.5 rounded-2xl bg-destructive/10 p-3.5 text-xs text-destructive border border-destructive/20 mb-3">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Unable to Update Profile</p>
              <p>{rootError}</p>
            </div>
          </div>
        )}

        <ImageUpload
          label="Profile Portrait"
          folder={isVet ? "veterinarians" : "providers"}
          value={photoValue}
          onChange={(url) => setValue("photo", url, { shouldValidate: true, shouldDirty: true })}
          error={errors.photo?.message as string}
          helperText={`Upload your professional portrait (stored locally in public/uploads/${isVet ? "veterinarians" : "providers"}) or paste a link.`}
          aspectRatio="square"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Full Name *"
            error={errors.name?.message as string}
            {...register("name")}
            className="rounded-xl h-9.5 text-xs"
          />

          <Input
            label={isVet ? "Clinic / Hospital *" : "Business Name *"}
            error={errors[isVet ? "clinic" : "businessName"]?.message as string}
            {...register(isVet ? "clinic" : "businessName")}
            className="rounded-xl h-9.5 text-xs"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Email Address *"
            type="email"
            error={errors.email?.message as string}
            {...register("email")}
            className="rounded-xl h-9.5 text-xs"
          />

          <Input
            label="Phone Number *"
            placeholder="+15550000000"
            error={errors.phone?.message as string}
            {...register("phone")}
            className="rounded-xl h-9.5 text-xs"
          />
        </div>

        {isVet ? (
          <>
            <Input
              label="Veterinary Qualification *"
              placeholder="e.g. DVM, BVSc, MRCVS"
              error={errors.qualification?.message as string}
              {...register("qualification")}
              className="rounded-xl h-9.5 text-xs"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Clinical Specialization *"
                placeholder="e.g. Small Animal Surgery"
                error={errors.specialization?.message as string}
                {...register("specialization")}
                className="rounded-xl h-9.5 text-xs"
              />

              <Input
                label="Years of Experience *"
                type="number"
                error={errors.experienceYears?.message as string}
                {...register("experienceYears", { valueAsNumber: true })}
                className="rounded-xl h-9.5 text-xs"
              />
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Specialties (comma-separated) *"
              placeholder="Grooming, Styling, Deshedding"
              error={errors.specializations?.message as string}
              {...register("specializations")}
              className="rounded-xl h-9.5 text-xs"
            />

            <Input
              label="Years of Experience *"
              type="number"
              error={errors.experienceYears?.message as string}
              {...register("experienceYears", { valueAsNumber: true })}
              className="rounded-xl h-9.5 text-xs"
            />
          </div>
        )}

        <Input
          label="Practice Location *"
          placeholder="e.g. 123 Pet Care Ave, San Francisco, CA"
          error={errors.location?.message as string}
          {...register("location")}
          className="rounded-xl h-9.5 text-xs"
        />

        <Textarea
          label="Professional Statement / Bio *"
          rows={3}
          error={errors.bio?.message as string}
          {...register("bio")}
          className="rounded-xl text-xs leading-relaxed"
        />
      </div>
    </FormModal>
  );
}
