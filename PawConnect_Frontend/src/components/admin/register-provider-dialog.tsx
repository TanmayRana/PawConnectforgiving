"use client";

import React, { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/shared/image-upload";
import { useCreateAdminServiceProvider, type AdminRegisterProviderInput } from "@/lib/api/hooks";
import { toast } from "@/lib/utils/toast";
import { Sparkles, Loader2, AlertCircle, MapPin, Navigation } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LocationPickerModal } from "@/components/shared/location";

interface RegisterProviderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RegisterProviderDialog({ open, onOpenChange }: RegisterProviderDialogProps) {
  const { mutateAsync: registerProvider, isPending } = useCreateAdminServiceProvider();
  const [error, setError] = useState<string | null>(null);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    photo: "",
    providerType: "GROOMER" as "GROOMER" | "TRAINER",
    businessName: "",
    businessPhone: "",
    description: "",
    address: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    experienceYears: 4,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "experienceYears" ? Number(value) : value,
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First and last name are required.");
      return;
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("A valid email address is required.");
      return;
    }
    if (!form.businessName.trim()) {
      setError("Business or studio display name is required.");
      return;
    }
    if (!form.businessPhone.trim()) {
      setError("Business contact phone number is required.");
      return;
    }

    try {
      const payload: AdminRegisterProviderInput = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password.trim() || undefined,
        providerType: form.providerType,
        businessName: form.businessName.trim(),
        description: form.description.trim() || undefined,
        businessPhone: form.businessPhone.trim(),
        address: form.address.trim() || undefined,
        latitude: form.latitude,
        longitude: form.longitude,
        experienceYears: Number(form.experienceYears) || 0,
        profileImage: form.photo.trim() || undefined,
        isActive: true,
      };

      await registerProvider(payload);

      toast.success("Service Provider Registered", {
        description: `${form.businessName} (${form.providerType}) has been registered with SERVICE_PROVIDER credentials.`,
      });

      onOpenChange(false);
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        photo: "",
        providerType: "GROOMER",
        businessName: "",
        businessPhone: "",
        description: "",
        address: "",
        latitude: undefined,
        longitude: undefined,
        experienceYears: 4,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to register service provider";
      setError(msg);
      toast.error("Registration Failed", { description: msg });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="wide">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-4.5 w-4.5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Service Registry
            </span>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold">Register Service Provider</DialogTitle>
          <DialogDescription>
            Register grooming or training studio accounts with dedicated SERVICE_PROVIDER role and business profiles.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <DialogBody className="space-y-6">
            {error && (
              <div className="flex items-center gap-2.5 p-3.5 text-xs text-destructive bg-destructive/10 rounded-2xl border border-destructive/20 animate-in fade-in duration-150">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Section 1: Account Owner Credentials */}
            <div className="rounded-2xl border border-border/60 bg-surface/30 p-5 space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-border/30">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  1. Account Owner & Credentials
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="providerFirstName" className="text-xs font-semibold">First Name *</Label>
                  <Input
                    id="providerFirstName"
                    name="firstName"
                    placeholder="e.g. Liam"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                    className="h-10.5 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="providerLastName" className="text-xs font-semibold">Last Name *</Label>
                  <Input
                    id="providerLastName"
                    name="lastName"
                    placeholder="e.g. Vance"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                    className="h-10.5 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="providerEmail" className="text-xs font-semibold">Email Address *</Label>
                  <Input
                    id="providerEmail"
                    name="email"
                    type="email"
                    placeholder="e.g. liam@poshpaws.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="h-10.5 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="providerPersonalPhone" className="text-xs font-semibold">Owner Personal Phone</Label>
                  <Input
                    id="providerPersonalPhone"
                    name="phone"
                    placeholder="e.g. +1 (415) 555-0234"
                    value={form.phone}
                    onChange={handleChange}
                    className="h-10.5 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="providerPassword" className="text-xs font-semibold">
                  Temporary Password (Optional, min 8 chars)
                </Label>
                <Input
                  id="providerPassword"
                  name="password"
                  type="password"
                  placeholder="Leave blank to auto-generate temporary credentials"
                  value={form.password}
                  onChange={handleChange}
                  className="h-10.5 rounded-xl text-sm"
                />
              </div>

              <div className="pt-1">
                <ImageUpload
                  label="Provider Profile Photo"
                  folder="providers"
                  value={form.photo}
                  onChange={(url) => {
                    setForm((prev) => ({ ...prev, photo: url }));
                    if (error) setError(null);
                  }}
                  helperText="Upload a professional profile photo (stored in public/uploads/providers) or paste a photo link."
                />
              </div>
            </div>

            {/* Section 2: Business Profile & Services */}
            <div className="rounded-2xl border border-border/60 bg-surface/30 p-5 space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-border/30">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  2. Business Profile & Service Category
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="providerType" className="text-xs font-semibold">Service Category *</Label>
                  <Select
                    value={form.providerType}
                    onValueChange={(val: "GROOMER" | "TRAINER") => {
                      setForm((prev) => ({ ...prev, providerType: val }));
                      if (error) setError(null);
                    }}
                  >
                    <SelectTrigger id="providerType" className="w-full h-10.5 rounded-xl text-sm">
                      <SelectValue placeholder="Select service category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GROOMER">Grooming & Spa (GROOMER)</SelectItem>
                      <SelectItem value="TRAINER">Behavior & Training (TRAINER)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="experienceYears" className="text-xs font-semibold">Years in Business</Label>
                  <Input
                    id="experienceYears"
                    name="experienceYears"
                    type="number"
                    min="0"
                    placeholder="e.g. 5"
                    value={form.experienceYears}
                    onChange={handleChange}
                    className="h-10.5 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="businessName" className="text-xs font-semibold">Business / Studio Name *</Label>
                  <Input
                    id="businessName"
                    name="businessName"
                    placeholder="e.g. Posh Paws Luxury Spa"
                    value={form.businessName}
                    onChange={handleChange}
                    required
                    className="h-10.5 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="businessPhone" className="text-xs font-semibold">Business Dispatch Phone *</Label>
                  <Input
                    id="businessPhone"
                    name="businessPhone"
                    placeholder="e.g. +1 (415) 555-8900"
                    value={form.businessPhone}
                    onChange={handleChange}
                    required
                    className="h-10.5 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Interactive Studio Location Selection */}
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-8.5 w-8.5 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">
                        {form.latitude != null && form.longitude != null
                          ? "Studio Location Pinned"
                          : "Pin Studio Location on Map"}
                      </span>
                      {form.latitude != null && form.longitude != null && (
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-mono py-0 px-1.5">
                          {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {form.latitude != null && form.longitude != null
                        ? "GPS coordinates recorded for client booking & service discovery."
                        : "Pick salon, studio or coverage center on map to auto-fill address & coordinates."}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsLocationPickerOpen(true)}
                  className="rounded-xl text-xs h-8 px-3 gap-1.5 shrink-0 bg-background font-semibold hover:bg-primary hover:text-primary-foreground border-primary/30"
                >
                  <Navigation className="h-3 w-3" />
                  {form.latitude != null && form.longitude != null ? "Change Pin" : "Select on Map"}
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="providerAddress" className="text-xs font-semibold">Studio Location / Coverage Address</Label>
                <Input
                  id="providerAddress"
                  name="address"
                  placeholder="e.g. 500 Market St Suite 4, San Francisco, CA"
                  value={form.address}
                  onChange={handleChange}
                  className="h-10.5 rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-semibold">Studio Description & Service Scope</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe salon facilities, grooming styles, or training philosophies..."
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  className="rounded-2xl text-sm resize-y"
                />
              </div>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 px-5 rounded-full text-sm"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-11 px-6 rounded-full text-sm font-semibold gap-2 shadow-sm"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Register Service Provider
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <LocationPickerModal
        open={isLocationPickerOpen}
        onOpenChange={setIsLocationPickerOpen}
        title="Pinpoint Studio & Service Location"
        description="Search your salon or studio, or drag the pin to your exact facility doorstep."
        initialCoordinates={
          form.latitude != null && form.longitude != null
            ? { lat: form.latitude, lng: form.longitude }
            : null
        }
        initialAddressText={form.address}
        onConfirmLocation={(result) => {
          setForm((prev) => ({
            ...prev,
            address: result.formattedAddress || result.address.street,
            latitude: result.coordinates.lat,
            longitude: result.coordinates.lng,
          }));
          if (error) setError(null);
        }}
      />
    </Dialog>
  );
}
