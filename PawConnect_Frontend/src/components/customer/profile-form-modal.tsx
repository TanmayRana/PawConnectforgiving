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
import { ImageUpload } from "@/components/shared/image-upload";
import { AlertCircle } from "lucide-react";
import { applyServerErrors } from "@/lib/utils/form-errors";
import type { CustomerProfile } from "@/lib/mock/customer";

const PHONE_REGEX = /^\+?[0-9]{10,15}$/;

const profileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name cannot exceed 50 characters"),
  lastName: z
    .string()
    .trim()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name cannot exceed 50 characters"),
  phone: z
    .string()
    .trim()
    .regex(PHONE_REGEX, "Enter a valid phone number (10-15 digits, optional + prefix)"),
  avatar: z.string().trim().max(500, "Avatar URL cannot exceed 500 characters").optional(),
  emergencyName: z
    .string()
    .trim()
    .min(2, "Emergency contact name must be at least 2 characters")
    .max(100, "Contact name cannot exceed 100 characters"),
  emergencyPhone: z
    .string()
    .trim()
    .regex(PHONE_REGEX, "Enter a valid phone number (10-15 digits, optional + prefix)"),
  emergencyRelation: z
    .string()
    .trim()
    .min(2, "Relationship is required")
    .max(50, "Relationship cannot exceed 50 characters"),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: CustomerProfile;
  onSubmit: (data: ProfileFormData) => Promise<void> | void;
  isSubmitting?: boolean;
}

export function ProfileFormModal({
  open,
  onOpenChange,
  profile,
  onSubmit,
  isSubmitting = false,
}: ProfileFormModalProps) {
  const [rootError, setRootError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    control,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      avatar: profile.avatar || "",
      emergencyName: profile.emergencyContact.name,
      emergencyPhone: profile.emergencyContact.phone,
      emergencyRelation: profile.emergencyContact.relationship,
    },
  });

  const avatarValue = useWatch({ control, name: "avatar" });

  React.useEffect(() => {
    if (open) {
      setRootError(null);
      reset({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        avatar: profile.avatar || "",
        emergencyName: profile.emergencyContact.name,
        emergencyPhone: profile.emergencyContact.phone,
        emergencyRelation: profile.emergencyContact.relationship,
      });
    }
  }, [open, profile, reset]);

  const handleFormSubmit = async (data: ProfileFormData) => {
    setRootError(null);
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = applyServerErrors(err, setError, "Unable to save profile changes. Please review the highlighted fields.");
      if (msg) {
        setRootError(msg);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="wide">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            Edit Personal Profile
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Update your contact numbers and designated emergency pet contact.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <DialogBody className="space-y-4">
            {rootError && (
              <div className="flex items-start gap-2.5 rounded-2xl bg-destructive/10 p-3.5 text-xs text-destructive border border-destructive/20">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Unable to Save Profile</p>
                  <p>{rootError}</p>
                </div>
              </div>
            )}

            <ImageUpload
              label="Profile Photo / Avatar"
              folder="avatars"
              value={avatarValue}
              onChange={(url) => setValue("avatar", url, { shouldValidate: true, shouldDirty: true })}
              error={errors.avatar?.message}
              helperText="Upload a picture of yourself (saved locally to public/uploads/avatars) or paste an image link."
              aspectRatio="square"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="First Name *"
                error={errors.firstName?.message}
                {...register("firstName")}
              />
              <Input
                label="Last Name *"
                error={errors.lastName?.message}
                {...register("lastName")}
              />
            </div>

            <Input
              label="Phone Number *"
              placeholder="+15552345678"
              error={errors.phone?.message}
              {...register("phone")}
            />

            <div className="pt-2 border-t border-border/70">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Designated Emergency Contact
              </p>
              <div className="space-y-3">
                <Input
                  label="Full Name *"
                  placeholder="Michael Jenkins"
                  error={errors.emergencyName?.message}
                  {...register("emergencyName")}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Contact Phone *"
                    placeholder="+15558765432"
                    error={errors.emergencyPhone?.message}
                    {...register("emergencyPhone")}
                  />
                  <Input
                    label="Relationship *"
                    placeholder="Partner, Parent, etc."
                    error={errors.emergencyRelation?.message}
                    {...register("emergencyRelation")}
                  />
                </div>
              </div>
            </div>
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
              {isSubmitting ? "Saving..." : "Update Profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
