"use client";

import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormModal } from "@/components/shared/form-shells";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AlertCircle } from "lucide-react";
import { applyServerErrors } from "@/lib/utils/form-errors";
import type { AdminCategory } from "@/lib/mock/admin";

const categorySchema = z.object({
  name: z.string().trim().min(2, "Category name must be at least 2 characters").max(100),
  slug: z
    .string()
    .trim()
    .min(2, "URL Slug is required")
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().trim().min(5, "Please provide at least 5 characters for description").max(500),
  active: z.boolean(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: AdminCategory | null;
  onSubmit: (data: CategoryFormValues) => Promise<void> | void;
  loading?: boolean;
}

export function CategoryFormModal({
  open,
  onOpenChange,
  category,
  onSubmit,
  loading = false,
}: CategoryFormModalProps) {
  const isEditing = Boolean(category);
  const [rootError, setRootError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    control,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      active: true,
    },
  });

  const activeValue = useWatch({ control, name: "active" });

  useEffect(() => {
    if (open) {
      setRootError(null);
      if (category) {
        reset({
          name: category.name,
          slug: category.slug,
          description: category.description,
          active: category.active,
        });
      } else {
        reset({
          name: "",
          slug: "",
          description: "",
          active: true,
        });
      }
    }
  }, [open, category, reset]);

  const handleFormSubmit = async (values: CategoryFormValues) => {
    setRootError(null);
    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = applyServerErrors(err, setError, "Unable to save category. Please check the highlighted fields.");
      if (msg) {
        setRootError(msg);
      }
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue("name", val);
    if (!isEditing) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setValue("slug", generatedSlug, { shouldValidate: true });
    }
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Product Category" : "Add Product Category"}
      description="Manage taxonomy groupings, search slugs, and active status for store organization."
      onSubmit={handleSubmit(handleFormSubmit)}
      loading={loading}
      submitLabel={isEditing ? "Save Changes" : "Create Category"}
      className="sm:max-w-md"
    >
      <div className="space-y-4 pt-1">
        {rootError && (
          <div className="flex items-start gap-2.5 rounded-2xl bg-destructive/10 p-3.5 text-xs text-destructive border border-destructive/20 mb-3">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Unable to Save Category</p>
              <p>{rootError}</p>
            </div>
          </div>
        )}

        <Input
          label="Category Name *"
          {...register("name")}
          onChange={handleNameChange}
          placeholder="e.g. Health & Wellness"
          error={errors.name?.message}
          className="rounded-xl h-9.5 text-xs"
        />

        <Input
          label="URL Slug *"
          {...register("slug")}
          placeholder="e.g. health-and-wellness"
          error={errors.slug?.message}
          className="rounded-xl h-9.5 text-xs font-mono text-[11px]"
        />

        <Textarea
          label="Category Description *"
          {...register("description")}
          placeholder="Brief description of the product types in this category..."
          rows={2.5}
          error={errors.description?.message}
          className="rounded-xl text-xs resize-none"
        />

        <div className="flex items-center justify-between rounded-xl border border-border/70 p-2.5">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-foreground">Category Status</span>
            <p className="text-[11px] text-muted-foreground">
              {activeValue ? "Active in customer shop navigation" : "Hidden from filters and menu"}
            </p>
          </div>
          <Switch
            checked={activeValue}
            onCheckedChange={(checked) => setValue("active", checked)}
          />
        </div>
      </div>
    </FormModal>
  );
}
