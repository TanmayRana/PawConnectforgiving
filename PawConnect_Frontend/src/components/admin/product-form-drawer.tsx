"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormDrawer } from "@/components/shared/form-shells";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2, Star, Image as ImageIcon, AlertCircle } from "lucide-react";
import { ImageUpload } from "@/components/shared/image-upload";
import { applyServerErrors } from "@/lib/utils/form-errors";
import { useAdminCategories } from "@/lib/api/hooks";
import type { EnrichedProductItem } from "@/lib/mock/products";

const productSchema = z.object({
  name: z.string().trim().min(2, "Product name must be at least 2 characters").max(150, "Name cannot exceed 150 characters"),
  category: z.string().trim().min(2, "Category is required"),
  description: z.string().trim().min(10, "Please provide at least 10 characters for description").max(2000, "Description cannot exceed 2000 characters"),
  price: z.number({ message: "Price must be a valid number" }).min(0.01, "Price must be greater than 0").max(100000, "Price cannot exceed ₹100,000"),
  stock: z.number({ message: "Stock must be a valid number" }).int("Stock must be an integer").min(0, "Stock cannot be negative").max(100000),
  inStock: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: EnrichedProductItem | null;
  onSubmit: (data: Omit<EnrichedProductItem, "id">) => Promise<void> | void;
  loading?: boolean;
}

export function ProductFormDrawer({
  open,
  onOpenChange,
  product,
  onSubmit,
  loading = false,
}: ProductFormDrawerProps) {
  const isEditing = Boolean(product);
  const [prevProduct, setPrevProduct] = useState(product);
  const [rootError, setRootError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>(() =>
    product?.images?.length
      ? product.images
      : [product?.image || "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=800&q=80"]
  );

  if (product !== prevProduct) {
    setPrevProduct(product);
    setImages(
      product?.images?.length
        ? product.images
        : [product?.image || "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=800&q=80"]
    );
  }

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    control,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      category: "Food & Nutrition",
      description: "",
      price: 499,
      stock: 50,
      inStock: true,
    },
  });

  const categoryValue = useWatch({ control, name: "category" });
  const inStockValue = useWatch({ control, name: "inStock" });

  useEffect(() => {
    if (open) {
      setRootError(null);
      if (product) {
        reset({
          name: product.name,
          category: product.category,
          description: product.description,
          price: product.price,
          stock: product.stock,
          inStock: product.inStock,
        });
      } else {
        reset({
          name: "",
          category: "Food & Nutrition",
          description: "",
          price: 29.99,
          stock: 50,
          inStock: true,
        });
      }
    }
  }, [open, product, reset]);

  const handleRemoveImage = (idx: number) => {
    if (images.length <= 1) return;
    setImages(images.filter((_, i) => i !== idx));
  };

  const handleSetPrimary = (idx: number) => {
    const item = images[idx];
    const rest = images.filter((_, i) => i !== idx);
    setImages([item, ...rest]);
  };

  const { data: dbCategories = [] } = useAdminCategories();

  const categoryOptions = React.useMemo(() => {
    const defaultList = [
      "Food & Nutrition",
      "Treats & Chews",
      "Toys & Enrichment",
      "Grooming & Coat Care",
      "Beds & Furniture",
      "Health & Wellness",
    ];
    if (!dbCategories || dbCategories.length === 0) {
      return defaultList.map((name) => ({ id: undefined as number | undefined, name }));
    }
    return dbCategories.map((c) => ({ id: Number(c.id), name: c.name }));
  }, [dbCategories]);

  const handleFormSubmit = async (values: ProductFormValues) => {
    setRootError(null);
    try {
      const primaryImage =
        images[0] ||
        "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=800&q=80";

      const matchedCat = categoryOptions.find(
        (c) => c.name.toLowerCase() === values.category.toLowerCase()
      );
      const categoryId = matchedCat?.id ?? product?.categoryId;

      const payload: Omit<EnrichedProductItem, "id"> = {
        name: values.name,
        category: values.category,
        categoryId: categoryId,
        description: values.description,
        price: values.price,
        stock: values.stock,
        stockQuantity: values.stock,
        stockStatus: values.stock <= 5 ? (values.stock === 0 ? "out-of-stock" : "low-stock") : "in-stock",
        inStock: values.inStock,
        image: primaryImage,
        images: images.length > 0 ? images : [primaryImage],
        rating: product?.rating || 4.8,
        reviewCount: product?.reviewCount || 0,
        inHouseGuaranteed: true,
        highlights: product?.highlights || [
          "100% In-house quality guaranteed",
          "Formulated without harmful artificial additives",
        ],
        specifications: product?.specifications || {
          Category: values.category,
          Fulfillment: "PawConnect Direct Courier",
        },
      };

      await onSubmit(payload);
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = applyServerErrors(err, setError, "Unable to save product. Please check the highlighted fields.");
      if (msg) {
        setRootError(msg);
      }
    }
  };

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit In-House Product" : "Add In-House Product"}
      description="Manage catalogue pricing, stock levels, image assets, and public shelf status."
      onSubmit={handleSubmit(handleFormSubmit)}
      loading={loading}
      submitLabel={isEditing ? "Save Changes" : "Create Product"}
      size="lg"
    >
      <div className="space-y-4">
        {rootError && (
          <div className="flex items-start gap-2.5 rounded-2xl bg-destructive/10 p-3.5 text-xs text-destructive border border-destructive/20 mb-3">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Unable to Save Product</p>
              <p>{rootError}</p>
            </div>
          </div>
        )}

        <Input
          label="Product Title *"
          {...register("name")}
          placeholder="e.g. Wild Alaskan Salmon Recipe"
          error={errors.name?.message}
          className="rounded-xl h-10 text-xs"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Product Category *</label>
            <Select
              value={categoryValue}
              onValueChange={(val) => setValue("category", val)}
            >
              <SelectTrigger className="rounded-xl h-10 text-xs">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((opt) => (
                  <SelectItem key={opt.id ?? opt.name} value={opt.name}>
                    {opt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-[11px] text-destructive">{errors.category.message}</p>
            )}
          </div>

          <Input
            label="Price (₹ INR) *"
            type="number"
            step="0.01"
            min={0.01}
            {...register("price", { valueAsNumber: true })}
            placeholder="499.00"
            error={errors.price?.message}
            className="rounded-xl h-10 text-xs"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Available Inventory Units *"
            type="number"
            min={0}
            {...register("stock", { valueAsNumber: true })}
            placeholder="50"
            error={errors.stock?.message}
            className="rounded-xl h-10 text-xs"
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Catalogue Visibility</label>
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-surface/30 px-3.5 h-10">
              <span className="text-xs font-medium text-foreground whitespace-nowrap">
                {inStockValue ? "Active on Storefront" : "Draft / Archived"}
              </span>
              <Switch
                checked={inStockValue}
                onCheckedChange={(checked) => setValue("inStock", checked)}
              />
            </div>
          </div>
        </div>

        <Textarea
          label="Product Description & Benefits *"
          {...register("description")}
          placeholder="Comprehensive description of formulation, ingredients, and key pet benefits..."
          rows={3}
          error={errors.description?.message}
          className="rounded-xl text-xs resize-none"
        />

        {/* Product Media Manager */}
        <div className="space-y-2.5 pt-2 border-t border-border/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-primary" />
              Product Image Gallery ({images.length})
            </span>
            <span className="text-[11px] text-muted-foreground">
              First image is primary
            </span>
          </div>

          {/* Upload or Add Image */}
          <ImageUpload
            folder="products"
            label=""
            value=""
            onChange={(url) => {
              if (url && !images.includes(url)) {
                setImages((prev) => [...prev, url]);
              }
            }}
            helperText="Upload images from your device or switch to Image URL tab."
            aspectRatio="wide"
          />

          {/* Image Thumbnail List */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-1">
              {images.map((img, idx) => (
                <div
                  key={img + idx}
                  className="group relative rounded-xl overflow-hidden border border-border/80 bg-secondary aspect-square shadow-2xs"
                >
                  <Image src={img} alt={`Preview ${idx + 1}`} fill sizes="140px" className="object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                    <div className="flex justify-between items-center">
                      {idx === 0 ? (
                        <Badge className="bg-primary text-primary-foreground text-[9px] px-1.5 py-0.5 rounded font-bold shadow-xs">
                          Primary
                        </Badge>
                      ) : (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleSetPrimary(idx)}
                          className="h-6 w-6 rounded-md bg-black/40 text-white hover:text-amber-300 hover:bg-black/60 p-0"
                          title="Set as Primary"
                        >
                          <Star className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    {images.length > 1 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        onClick={() => handleRemoveImage(idx)}
                        className="h-6 w-6 ml-auto p-0 rounded-md shadow-xs"
                        title="Remove Image"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </FormDrawer>
  );
}
