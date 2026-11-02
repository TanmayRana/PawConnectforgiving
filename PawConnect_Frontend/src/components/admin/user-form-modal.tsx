"use client";

import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormModal } from "@/components/shared/form-shells";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/shared/image-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { applyServerErrors } from "@/lib/utils/form-errors";
import type { AdminUser, PlatformRole, UserStatus } from "@/lib/mock/admin";

const PHONE_REGEX = /^\+?[0-9]{10,15}$/;

const userSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Valid email address is required"),
  phone: z
    .string()
    .trim()
    .regex(
      PHONE_REGEX,
      "Enter a valid phone number (10-15 digits, optional + prefix)",
    ),
  avatar: z
    .string()
    .trim()
    .max(500, "Avatar URL cannot exceed 500 characters")
    .optional(),
  role: z.enum(["pet_owner", "veterinarian", "service_provider", "admin"]),
  status: z.enum(["active", "blocked"]),
  password: z
    .string()
    .max(100, "Password cannot exceed 100 characters")
    .optional(),
});

export type UserFormData = z.infer<typeof userSchema>;

interface UserFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: AdminUser | null;
  onSubmit: (data: UserFormData) => Promise<void> | void;
  loading?: boolean;
}

export function UserFormModal({
  open,
  onOpenChange,
  user,
  onSubmit,
  loading = false,
}: UserFormModalProps) {
  const isEditing = Boolean(user);
  const [rootError, setRootError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    control,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      avatar: "",
      role: "pet_owner",
      status: "active",
      password: "",
    },
  });

  const roleValue = useWatch({ control, name: "role" });
  const statusValue = useWatch({ control, name: "status" });
  const avatarValue = useWatch({ control, name: "avatar" });

  useEffect(() => {
    if (open) {
      setRootError(null);
      setIsUploadingImage(false);

      if (user) {
        reset({
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar || "",
          role: user.role,
          status: user.status,
          password: "",
        });
      } else {
        reset({
          name: "",
          email: "",
          phone: "",
          avatar: "",
          role: "pet_owner",
          status: "active",
          password: "",
        });
      }
    }
  }, [open, user, reset]);

  const handleFormSubmit = async (values: UserFormData) => {
    if (isUploadingImage || loading) return;

    setRootError(null);
    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = applyServerErrors(
        err,
        setError,
        "Unable to save user account. Please check the highlighted fields.",
      );
      if (msg) {
        setRootError(msg);
      }
    }
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Platform User" : "Register Platform User"}
      description="Manage role entitlements, authentication status, and contact credentials."
      onSubmit={handleSubmit(handleFormSubmit)}
      loading={loading}
      submitDisabled={loading || isUploadingImage}
      cancelDisabled={loading || isUploadingImage}
      submitLabel={
        isUploadingImage
          ? "Uploading Photo..."
          : isEditing
            ? "Save Changes"
            : "Create User"
      }
    >
      <div className="space-y-4 pt-1">
        {rootError && (
          <div className="flex items-start gap-2.5 rounded-2xl bg-destructive/10 p-3.5 text-xs text-destructive border border-destructive/20 mb-3">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Unable to Save User</p>
              <p>{rootError}</p>
            </div>
          </div>
        )}

        <ImageUpload
          label="Profile Picture / Avatar"
          folder="avatars"
          value={avatarValue}
          onChange={(url) =>
            setValue("avatar", url, { shouldValidate: true, shouldDirty: true })
          }
          onUploadingChange={setIsUploadingImage}
          error={errors.avatar?.message}
          helperText="Upload profile photo (saved in public/uploads/avatars) or paste an image link."
          aspectRatio="square"
        />

        <Input
          label="Full Name *"
          error={errors.name?.message}
          {...register("name")}
          placeholder="Alex Morgan"
          className="rounded-xl h-9.5 text-xs"
        />

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Email Address *
          </label>
          <Input
            type="email"
            error={errors.email?.message}
            {...register("email")}
            placeholder="alex@pawconnect.care"
            className="rounded-xl h-10 text-xs"
          />
          {!isEditing && (
            <p className="text-[11px] leading-relaxed text-muted-foreground flex items-start gap-1.5 pt-0.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <span>
                A secure login password will be generated automatically, and
                sent to this email upon creation.
              </span>
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Phone Number *
          </label>
          <Input
            error={errors.phone?.message}
            {...register("phone")}
            placeholder="+15550000000"
            className="rounded-xl h-10 text-xs"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              System Role *
            </label>
            <Select
              value={roleValue}
              onValueChange={(val: PlatformRole) => setValue("role", val)}
            >
              <SelectTrigger className="rounded-xl h-9.5 text-xs">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pet_owner">Pet Owner</SelectItem>
                <SelectItem value="veterinarian">Veterinarian</SelectItem>
                <SelectItem value="service_provider">
                  Service Provider
                </SelectItem>
                <SelectItem value="admin">Platform Admin</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-[11px] text-destructive">
                {errors.role.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Account Status *
            </label>
            <Select
              value={statusValue}
              onValueChange={(val: UserStatus) => setValue("status", val)}
            >
              <SelectTrigger className="rounded-xl h-9.5 text-xs">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="blocked">Blocked / Suspended</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-[11px] text-destructive">
                {errors.status.message}
              </p>
            )}
          </div>
        </div>
      </div>
    </FormModal>
  );
}
