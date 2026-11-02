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
import { AlertCircle, KeyRound } from "lucide-react";
import { applyServerErrors } from "@/lib/utils/form-errors";
import { showSuccess } from "@/lib/utils/toast";
import { useChangePassword } from "@/lib/api/hooks";

const PASSWORD_REGEX = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!._-]).*$/;

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .max(100, "New password cannot exceed 100 characters")
      .regex(
        PASSWORD_REGEX,
        "Must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special symbol"
      ),
    confirmNewPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords do not match",
    path: ["confirmNewPassword"],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

interface ChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordModal({
  open,
  onOpenChange,
}: ChangePasswordModalProps) {
  const [rootError, setRootError] = React.useState<string | null>(null);
  const changePasswordMutation = useChangePassword();

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      setRootError(null);
      reset({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    }
  }, [open, reset]);

  const handleFormSubmit = async (data: ChangePasswordFormData) => {
    setRootError(null);
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmNewPassword: data.confirmNewPassword,
      });
      showSuccess("Password Updated", "Your account password has been changed successfully.");
      onOpenChange(false);
      reset();
    } catch (err: unknown) {
      const msg = applyServerErrors(err, setError, "Unable to change password. Please verify your current password.");
      if (msg) {
        setRootError(msg);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="compact">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <KeyRound className="h-4 w-4" />
            </span>
            <DialogTitle className="text-xl font-bold text-foreground">
              Change Account Password
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Enter your current password and set a secure new password for your account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <DialogBody className="space-y-4">
            {rootError && (
              <div className="flex items-start gap-2.5 rounded-2xl bg-destructive/10 p-3.5 text-xs text-destructive border border-destructive/20">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Password Update Failed</p>
                  <p>{rootError}</p>
                </div>
              </div>
            )}

            <Input
              type="password"
              label="Current Password *"
              placeholder="••••••••••••"
              error={errors.currentPassword?.message}
              {...register("currentPassword")}
            />

            <Input
              type="password"
              label="New Password *"
              placeholder="••••••••••••"
              error={errors.newPassword?.message}
              {...register("newPassword")}
            />

            <Input
              type="password"
              label="Confirm New Password *"
              placeholder="••••••••••••"
              error={errors.confirmNewPassword?.message}
              {...register("confirmNewPassword")}
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
              disabled={changePasswordMutation.isPending}
              className="rounded-full shadow-sm px-6"
            >
              {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
