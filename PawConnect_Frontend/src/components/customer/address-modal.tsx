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
import { Textarea } from "@/components/ui/textarea";
import { SelectField } from "@/components/ui/select";
import { applyServerErrors } from "@/lib/utils/form-errors";
import type { CustomerAddress } from "@/lib/mock/customer";
import { LocationPickerModal } from "@/components/shared/location/location-picker-modal";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation } from "lucide-react";

const addressSchema = z.object({
  label: z.enum(["Home", "Work", "Other"]),
  recipientName: z
    .string()
    .trim()
    .min(1, "Recipient name is required")
    .max(150, "Recipient name cannot exceed 150 characters"),
  street: z
    .string()
    .trim()
    .min(3, "Street address is required")
    .max(255, "Address cannot exceed 255 characters"),
  unit: z.string().trim().max(255).optional(),
  city: z
    .string()
    .trim()
    .min(2, "City is required")
    .max(100, "City cannot exceed 100 characters"),
  state: z
    .string()
    .trim()
    .min(2, "State is required")
    .max(100, "State cannot exceed 100 characters"),
  zipCode: z
    .string()
    .trim()
    .min(4, "Postal code must be at least 4 characters")
    .max(20, "Postal code cannot exceed 20 characters"),
  phone: z
    .string()
    .trim()
    .regex(
      /^\+?[0-9]{10,15}$/,
      "Phone must be a valid 10-15 digit number (e.g. +919876543210 or 9876543210)"
    ),
  isDefault: z.boolean(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  deliveryInstructions: z.string().trim().max(500).optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface AddressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialData?: CustomerAddress | null;
  onSubmit: (data: AddressFormData) => Promise<void> | void;
  isSubmitting?: boolean;
}

export function AddressModal({
  open,
  onOpenChange,
  mode,
  initialData,
  onSubmit,
  isSubmitting = false,
}: AddressModalProps) {
  const [rootError, setRootError] = React.useState<string | null>(null);
  const [isMapPickerOpen, setIsMapPickerOpen] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    setError,
    control,
    reset,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: "Home",
      recipientName: "",
      street: "",
      unit: "",
      city: "San Francisco",
      state: "CA",
      zipCode: "",
      phone: "",
      isDefault: false,
      latitude: undefined,
      longitude: undefined,
      deliveryInstructions: "",
    },
  });

  const currentLat = useWatch({ control, name: "latitude" });
  const currentLng = useWatch({ control, name: "longitude" });

  React.useEffect(() => {
    if (open) {
      setRootError(null);
      if (mode === "edit" && initialData) {
        reset({
          label: initialData.label,
          recipientName: initialData.recipientName,
          street: initialData.street,
          unit: initialData.unit || "",
          city: initialData.city,
          state: initialData.state,
          zipCode: initialData.zipCode,
          phone: initialData.phone,
          isDefault: initialData.isDefault,
          latitude: initialData.latitude,
          longitude: initialData.longitude,
          deliveryInstructions: initialData.deliveryInstructions || "",
        });
      } else {
        reset({
          label: "Home",
          recipientName: "",
          street: "",
          unit: "",
          city: "San Francisco",
          state: "CA",
          zipCode: "",
          phone: "",
          isDefault: false,
          latitude: undefined,
          longitude: undefined,
          deliveryInstructions: "",
        });
      }
    }
  }, [open, mode, initialData, reset]);

  const handleFormSubmit = async (data: AddressFormData) => {
    setRootError(null);
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = applyServerErrors(
        err,
        setError,
        "Unable to save delivery address. Please check highlighted fields."
      );
      if (msg) setRootError(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="wide">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            {mode === "create" ? "Add Delivery Address" : "Edit Address"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Manage your delivery destination for in-house pet food, prescriptions, and treats.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <DialogBody className="space-y-4">
            {rootError && (
              <div className="p-3 text-xs rounded-xl bg-destructive/10 text-destructive font-medium border border-destructive/20" role="alert">
                {rootError}
              </div>
            )}

            {/* Interactive Delivery Location Picker Card */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">
                      {currentLat != null && currentLng != null
                        ? "GPS Location Pinned"
                        : "Pin Exact Delivery Location"}
                    </span>
                    {currentLat != null && currentLng != null && (
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-mono py-0 px-1.5">
                        {currentLat.toFixed(4)}, {currentLng.toFixed(4)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {currentLat != null && currentLng != null
                      ? "Coordinates mapped. Drag pin on map anytime to fine-tune doorstep."
                      : "Search your street or use GPS to auto-fill address details."}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsMapPickerOpen(true)}
                className="rounded-xl text-xs h-8 px-3 gap-1.5 shrink-0 bg-background font-semibold hover:bg-primary hover:text-primary-foreground border-primary/30"
              >
                <Navigation className="h-3 w-3" />
                {currentLat != null && currentLng != null ? "Change Pin on Map" : "Select on Map"}
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Address Tag *"
                defaultValue={initialData?.label || "Home"}
                onValueChange={(val) => setValue("label", val as "Home" | "Work" | "Other")}
                options={[
                  { value: "Home", label: "Home" },
                  { value: "Work", label: "Work / Office" },
                  { value: "Other", label: "Other" },
                ]}
                error={errors.label?.message}
              />

              <Input
                label="Recipient Name *"
                placeholder="Sarah Jenkins"
                error={errors.recipientName?.message}
                {...register("recipientName")}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <Input
                  label="Street Address *"
                  placeholder="742 Evergreen Terrace"
                  error={errors.street?.message}
                  {...register("street")}
                />
              </div>
              <div>
                <Input
                  label="Apt / Unit"
                  placeholder="Apt 4B"
                  error={errors.unit?.message}
                  {...register("unit")}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="City *"
                placeholder="San Francisco"
                error={errors.city?.message}
                {...register("city")}
              />
              <Input
                label="State *"
                placeholder="CA"
                error={errors.state?.message}
                {...register("state")}
              />
              <Input
                label="Zip Code *"
                placeholder="94107"
                error={errors.zipCode?.message}
                {...register("zipCode")}
              />
            </div>

            <Input
              label="Contact Phone *"
              placeholder="+15552345678"
              error={errors.phone?.message}
              {...register("phone")}
            />

            <Textarea
              label="Courier Delivery Notes (Optional)"
              placeholder="Gate code, lobby parcel instructions, or ring bell..."
              rows={2}
              error={errors.deliveryInstructions?.message}
              {...register("deliveryInstructions")}
            />

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isDefault"
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                {...register("isDefault")}
              />
              <label htmlFor="isDefault" className="text-xs font-medium text-foreground cursor-pointer">
                Set as primary default address
              </label>
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
              {isSubmitting ? "Saving..." : mode === "create" ? "Save Address" : "Update Address"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <LocationPickerModal
        open={isMapPickerOpen}
        onOpenChange={setIsMapPickerOpen}
        title="Pinpoint Delivery Address"
        description="Search your locality or drag the pin directly onto your delivery gate/entrance."
        initialCoordinates={
          currentLat != null && currentLng != null
            ? { lat: currentLat, lng: currentLng }
            : null
        }
        initialAddressText={getValues("street")}
        onConfirmLocation={(result) => {
          if (result.address.street) {
            setValue("street", result.address.street, { shouldValidate: true });
          }
          if (result.address.unit && !getValues("unit")) {
            setValue("unit", result.address.unit, { shouldValidate: true });
          }
          if (result.address.city) {
            setValue("city", result.address.city, { shouldValidate: true });
          }
          if (result.address.state) {
            setValue("state", result.address.state, { shouldValidate: true });
          }
          if (result.address.postalCode) {
            setValue("zipCode", result.address.postalCode, { shouldValidate: true });
          }
          setValue("latitude", result.coordinates.lat);
          setValue("longitude", result.coordinates.lng);
        }}
      />
    </Dialog>
  );
}
