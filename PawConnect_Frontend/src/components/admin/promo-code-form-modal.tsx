"use client";

import React, { useEffect, useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormModal } from "@/components/shared/form-shells";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, AlertCircle, Percent, IndianRupee } from "lucide-react";
import { applyServerErrors } from "@/lib/utils/form-errors";
import {
  type PromoCode,
  type CreatePromoCodeInput,
  generateRandomPromoCode,
} from "@/lib/api/promo-codes";

const promoCodeSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2, "Promo code must be at least 2 characters")
      .max(50, "Promo code must not exceed 50 characters")
      .regex(
        /^[A-Z0-9_-]+$/,
        "Code must contain only uppercase letters, numbers, hyphens, and underscores"
      ),
    description: z.string().trim().max(255).optional(),
    discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
    discountValue: z
      .number({ message: "Discount value must be a number" })
      .positive("Discount value must be greater than 0"),
    minOrderAmount: z
      .number({ message: "Minimum order amount must be a number" })
      .min(0, "Minimum order amount cannot be negative"),
    maxDiscountAmount: z
      .number({ message: "Max discount cap must be a number" })
      .positive("Max discount cap must be positive")
      .optional()
      .nullable(),
    usageLimit: z
      .number({ message: "Usage limit must be a number" })
      .int("Usage limit must be a whole number")
      .positive("Usage limit must be a positive integer")
      .optional()
      .nullable(),
    perUserLimit: z
      .number({ message: "Per-user limit must be a number" })
      .int("Per-user limit must be a whole number")
      .min(1, "Per-user limit must be at least 1"),
    validFrom: z.string().optional(),
    validUntil: z.string().optional(),
    isActive: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.discountType === "PERCENTAGE" && data.discountValue > 100) {
        return false;
      }
      return true;
    },
    {
      message: "Percentage discount cannot exceed 100%",
      path: ["discountValue"],
    }
  )
  .refine(
    (data) => {
      if (data.validFrom && data.validUntil) {
        return new Date(data.validUntil) >= new Date(data.validFrom);
      }
      return true;
    },
    {
      message: "Valid Until date must be on or after Valid From date",
      path: ["validUntil"],
    }
  );

export type PromoCodeFormValues = z.infer<typeof promoCodeSchema>;

interface PromoCodeFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promoCode?: PromoCode | null;
  onSubmit: (data: CreatePromoCodeInput) => Promise<void> | void;
  loading?: boolean;
}

export function PromoCodeFormModal({
  open,
  onOpenChange,
  promoCode,
  onSubmit,
  loading = false,
}: PromoCodeFormModalProps) {
  const isEditing = Boolean(promoCode);
  const [rootError, setRootError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    control,
    formState: { errors },
  } = useForm<PromoCodeFormValues>({
    resolver: zodResolver(promoCodeSchema),
    defaultValues: {
      code: "",
      description: "",
      discountType: "PERCENTAGE",
      discountValue: 10,
      minOrderAmount: 0,
      maxDiscountAmount: null,
      usageLimit: null,
      perUserLimit: 1,
      validFrom: "",
      validUntil: "",
      isActive: true,
    },
  });

  const discountType = useWatch({ control, name: "discountType" });
  const isActive = useWatch({ control, name: "isActive" });

  useEffect(() => {
    if (open) {
      setRootError(null);
      if (promoCode) {
        reset({
          code: promoCode.code,
          description: promoCode.description || "",
          discountType: promoCode.discountType,
          discountValue: promoCode.discountValue,
          minOrderAmount: promoCode.minOrderAmount ?? 0,
          maxDiscountAmount: promoCode.maxDiscountAmount ?? null,
          usageLimit: promoCode.usageLimit ?? null,
          perUserLimit: promoCode.perUserLimit ?? 1,
          validFrom: promoCode.validFrom ? promoCode.validFrom.slice(0, 16) : "",
          validUntil: promoCode.validUntil ? promoCode.validUntil.slice(0, 16) : "",
          isActive: promoCode.isActive,
        });
      } else {
        reset({
          code: "",
          description: "",
          discountType: "PERCENTAGE",
          discountValue: 10,
          minOrderAmount: 0,
          maxDiscountAmount: null,
          usageLimit: null,
          perUserLimit: 1,
          validFrom: "",
          validUntil: "",
          isActive: true,
        });
      }
    }
  }, [open, promoCode, reset]);

  const handleGenerateCode = () => {
    const generated = generateRandomPromoCode("PAW");
    setValue("code", generated, { shouldValidate: true, shouldDirty: true });
  };

  const handleFormSubmit = async (values: PromoCodeFormValues) => {
    setRootError(null);
    try {
      const payload: CreatePromoCodeInput = {
        code: values.code.trim().toUpperCase(),
        description: values.description?.trim() || undefined,
        discountType: values.discountType,
        discountValue: Number(values.discountValue),
        minOrderAmount: Number(values.minOrderAmount || 0),
        maxDiscountAmount:
          values.maxDiscountAmount !== null &&
          values.maxDiscountAmount !== undefined &&
          !isNaN(values.maxDiscountAmount)
            ? Number(values.maxDiscountAmount)
            : null,
        usageLimit:
          values.usageLimit !== null &&
          values.usageLimit !== undefined &&
          !isNaN(values.usageLimit)
            ? Number(values.usageLimit)
            : null,
        perUserLimit: Number(values.perUserLimit || 1),
        validFrom: values.validFrom
          ? values.validFrom.length === 16
            ? `${values.validFrom}:00`
            : values.validFrom
          : null,
        validUntil: values.validUntil
          ? values.validUntil.length === 16
            ? `${values.validUntil}:00`
            : values.validUntil
          : null,
        isActive: values.isActive,
      };

      await onSubmit(payload);
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = applyServerErrors(
        err,
        setError,
        "Unable to save promo code. Please verify input fields."
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
      title={isEditing ? `Edit Promo Code (${promoCode?.code})` : "Create New Promo Code"}
      description="Configure discount values, validation thresholds, per-customer limits, and schedule."
      onSubmit={handleSubmit(handleFormSubmit)}
      loading={loading}
      submitLabel={isEditing ? "Save Changes" : "Create Promo Code"}
      className="sm:max-w-xl max-h-[90vh] overflow-y-auto"
    >
      <div className="space-y-4 pt-1">
        {rootError && (
          <div className="flex items-start gap-2.5 rounded-2xl bg-destructive/10 p-3.5 text-xs text-destructive border border-destructive/20 mb-3">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Unable to Save Promo Code</p>
              <p>{rootError}</p>
            </div>
          </div>
        )}

        {/* Promo Code & Generator */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground flex items-center justify-between">
            <span>Promo Code *</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleGenerateCode}
              className="h-7 text-xs font-semibold text-primary hover:text-primary gap-1 px-2"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Generate Random Code
            </Button>
          </label>
          <Input
            {...register("code")}
            placeholder="e.g. PAW10, WELCOME20"
            className="font-mono uppercase tracking-wider h-11"
            onChange={(e) => {
              setValue("code", e.target.value.toUpperCase(), { shouldValidate: true });
            }}
            error={errors.code?.message}
          />
          <p className="text-[11px] text-muted-foreground">
            Unique alphanumeric code that customers enter during cart or checkout review.
          </p>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">
            Description
          </label>
          <Textarea
            {...register("description")}
            placeholder="e.g. 10% off for all in-house dog and cat food essentials"
            rows={2}
            className="rounded-2xl resize-none text-xs"
          />
          {errors.description?.message && (
            <p className="text-xs text-destructive">{errors.description.message}</p>
          )}
        </div>

        {/* Discount Type & Discount Value */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">
              Discount Type *
            </label>
            <Controller
              control={control}
              name="discountType"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(val: "PERCENTAGE" | "FIXED_AMOUNT") => field.onChange(val)}
                >
                  <SelectTrigger className="h-11 rounded-2xl">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="PERCENTAGE">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-primary" />
                        <span>Percentage (%)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="FIXED_AMOUNT">
                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-emerald-600" />
                        <span>Fixed Amount (₹)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">
              {discountType === "PERCENTAGE" ? "Percentage Value (%) *" : "Flat Discount (₹) *"}
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max={discountType === "PERCENTAGE" ? "100" : undefined}
              {...register("discountValue", {
                setValueAs: (v) => (v === "" || isNaN(Number(v)) ? 0 : Number(v)),
              })}
              placeholder={discountType === "PERCENTAGE" ? "10" : "150"}
              error={errors.discountValue?.message}
            />
          </div>
        </div>

        {/* Min Order Amount & Max Discount Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">
              Minimum Order Amount (₹)
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              {...register("minOrderAmount", {
                setValueAs: (v) => (v === "" || isNaN(Number(v)) ? 0 : Number(v)),
              })}
              placeholder="0.00"
              error={errors.minOrderAmount?.message}
            />
            <p className="text-[11px] text-muted-foreground">
              Cart subtotal required to activate promo code.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">
              Max Discount Cap (₹)
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              {...register("maxDiscountAmount", {
                setValueAs: (v) => (v === "" || isNaN(Number(v)) ? null : Number(v)),
              })}
              placeholder="e.g. 250.00 (Optional)"
              disabled={discountType === "FIXED_AMOUNT"}
              error={errors.maxDiscountAmount?.message}
            />
            <p className="text-[11px] text-muted-foreground">
              Caps maximum savings (percentage discounts only).
            </p>
          </div>
        </div>

        {/* Usage Limits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">
              Total Platform Usage Limit
            </label>
            <Input
              type="number"
              step="1"
              min="1"
              {...register("usageLimit", {
                setValueAs: (v) => (v === "" || isNaN(Number(v)) ? null : Number(v)),
              })}
              placeholder="Unlimited if empty"
              error={errors.usageLimit?.message}
            />
            <p className="text-[11px] text-muted-foreground">
              Maximum total redemptions across all users.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">
              Per-Customer Limit *
            </label>
            <Input
              type="number"
              step="1"
              min="1"
              {...register("perUserLimit", {
                setValueAs: (v) => (v === "" || isNaN(Number(v)) ? 1 : Number(v)),
              })}
              placeholder="1"
              error={errors.perUserLimit?.message}
            />
            <p className="text-[11px] text-muted-foreground">
              Redemptions allowed per customer account.
            </p>
          </div>
        </div>

        {/* Validity Period */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">
              Valid From (Optional)
            </label>
            <Input
              type="datetime-local"
              {...register("validFrom")}
              error={errors.validFrom?.message}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">
              Valid Until (Optional)
            </label>
            <Input
              type="datetime-local"
              {...register("validUntil")}
              error={errors.validUntil?.message}
            />
          </div>
        </div>

        {/* Active Toggle Switch */}
        <div className="flex items-center justify-between rounded-2xl border border-border/70 p-4 bg-surface/50">
          <div className="space-y-0.5">
            <span className="text-sm font-semibold text-foreground block">
              Active Status
            </span>
            <span className="text-xs text-muted-foreground block">
              When inactive, customers cannot apply or checkout with this promo code.
            </span>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={(checked) => setValue("isActive", checked)}
            aria-label="Toggle active status"
          />
        </div>
      </div>
    </FormModal>
  );
}
