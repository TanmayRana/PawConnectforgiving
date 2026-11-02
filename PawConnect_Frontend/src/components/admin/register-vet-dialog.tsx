"use client";

import React, { useEffect, useState } from "react";
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
import { ImageUpload } from "@/components/shared/image-upload";
import { useCreateAdminVeterinarian, type AdminRegisterVetInput } from "@/lib/api/hooks";
import { toast } from "@/lib/utils/toast";
import { Stethoscope, Loader2, AlertCircle, MapPin, Navigation } from "lucide-react";
import { LocationPickerModal } from "@/components/shared/location/location-picker-modal";

interface RegisterVetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RegisterVetDialog({ open, onOpenChange }: RegisterVetDialogProps) {
  const { mutateAsync: registerVet, isPending } = useCreateAdminVeterinarian();
  const [error, setError] = useState<string | null>(null);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    photo: "",
    specialization: "",
    qualification: "",
    licenseNumber: "",
    experienceYears: 5,
    clinicName: "",
    clinicAddress: "",
    clinicLatitude: undefined as number | undefined,
    clinicLongitude: undefined as number | undefined,
    consultationFee: 50,
    bio: "",
  });

  useEffect(() => {
    if (!open) {
      setError(null);
    }
  }, [open]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "experienceYears" || name === "consultationFee" ? Number(value) : value,
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
    if (!form.licenseNumber.trim()) {
      setError("Veterinary license number is required.");
      return;
    }
    if (!form.specialization.trim()) {
      setError("Specialization is required.");
      return;
    }
    if (!form.qualification.trim()) {
      setError("Professional qualification is required.");
      return;
    }
    if (form.consultationFee < 0) {
      setError("Consultation fee cannot be negative.");
      return;
    }

    try {
      const payload: AdminRegisterVetInput = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password.trim() || undefined,
        specialization: form.specialization.trim(),
        qualification: form.qualification.trim(),
        licenseNumber: form.licenseNumber.trim(),
        experienceYears: Number(form.experienceYears) || 0,
        clinicName: form.clinicName.trim() || undefined,
        clinicAddress: form.clinicAddress.trim() || undefined,
        clinicLatitude: form.clinicLatitude,
        clinicLongitude: form.clinicLongitude,
        consultationFee: Number(form.consultationFee) || 0,
        bio: form.bio.trim() || undefined,
        profileImage: form.photo.trim() || undefined,
        isActive: true,
      };

      await registerVet(payload);

      toast.success("Veterinarian Registered", {
        description: `Dr. ${form.firstName} ${form.lastName} has been successfully registered and certified.`,
      });

      onOpenChange(false);
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        photo: "",
        specialization: "",
        qualification: "",
        licenseNumber: "",
        experienceYears: 5,
        clinicName: "",
        clinicAddress: "",
        clinicLatitude: undefined,
        clinicLongitude: undefined,
        consultationFee: 50,
        bio: "",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to register veterinarian";
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
              <Stethoscope className="h-4.5 w-4.5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Clinical Registry
            </span>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold">Register New Veterinarian</DialogTitle>
          <DialogDescription>
            Create an authenticated practitioner account with VETERINARIAN role and official clinical profile.
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

            {/* Section 1: Practitioner Identity */}
            <div className="rounded-2xl border border-border/60 bg-surface/30 p-5 space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-border/30">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  1. Practitioner Identity & Credentials
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-xs font-semibold">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="e.g. Sarah"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                    className="h-10.5 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-xs font-semibold">Last Name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="e.g. Jenkins"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                    className="h-10.5 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="e.g. dr.jenkins@pawconnect.care"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="h-10.5 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="e.g. +1 (415) 555-0189"
                    value={form.phone}
                    onChange={handleChange}
                    className="h-10.5 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold">
                  Temporary Password (Optional, min 8 chars)
                </Label>
                <Input
                  id="password"
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
                  label="Practitioner Profile Photo"
                  folder="veterinarians"
                  value={form.photo}
                  onChange={(url) => {
                    setForm((prev) => ({ ...prev, photo: url }));
                    if (error) setError(null);
                  }}
                  helperText="Upload a professional profile portrait (stored in public/uploads/veterinarians) or paste a photo link."
                />
              </div>
            </div>

            {/* Section 2: Board Certification & Qualifications */}
            <div className="rounded-2xl border border-border/60 bg-surface/30 p-5 space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-border/30">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  2. Board Certification & Practice
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="licenseNumber" className="text-xs font-semibold">License / Board Reg Number *</Label>
                  <Input
                    id="licenseNumber"
                    name="licenseNumber"
                    placeholder="e.g. VET-CA-8921"
                    value={form.licenseNumber}
                    onChange={handleChange}
                    required
                    className="h-10.5 rounded-xl text-sm font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="experienceYears" className="text-xs font-semibold">Years of Experience</Label>
                  <Input
                    id="experienceYears"
                    name="experienceYears"
                    type="number"
                    min="0"
                    placeholder="e.g. 8"
                    value={form.experienceYears}
                    onChange={handleChange}
                    className="h-10.5 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="specialization" className="text-xs font-semibold">Specialization *</Label>
                  <Input
                    id="specialization"
                    name="specialization"
                    placeholder="e.g. Feline Internal Medicine, Surgery"
                    value={form.specialization}
                    onChange={handleChange}
                    required
                    className="h-10.5 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="qualification" className="text-xs font-semibold">Degree / Certification *</Label>
                  <Input
                    id="qualification"
                    name="qualification"
                    placeholder="e.g. DVM, MS, DACVIM"
                    value={form.qualification}
                    onChange={handleChange}
                    required
                    className="h-10.5 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="consultationFee" className="text-xs font-semibold">Standard Consultation Fee (₹)</Label>
                <Input
                  id="consultationFee"
                  name="consultationFee"
                  type="number"
                  min="0"
                  step="5"
                  placeholder="e.g. 50"
                  value={form.consultationFee}
                  onChange={handleChange}
                  className="h-10.5 rounded-xl text-sm font-mono"
                />
              </div>
            </div>

            {/* Section 3: Clinic Facility & GPS Geo-Coordinates */}
            <div className="rounded-2xl border border-border/60 bg-surface/30 p-5 space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-border/30">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  3. Clinic Facility & Location
                </h4>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="clinicName" className="text-xs font-semibold">Clinic / Hospital Affiliation</Label>
                <Input
                  id="clinicName"
                  name="clinicName"
                  placeholder="e.g. St. Jude Pet Hospital & Wellness Center"
                  value={form.clinicName}
                  onChange={handleChange}
                  className="h-10.5 rounded-xl text-sm"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="clinicAddress" className="text-xs font-semibold">Clinic Physical Street Address</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsLocationPickerOpen(true)}
                    className="h-7 text-xs rounded-lg gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                  >
                    <Navigation className="h-3 w-3" />
                    Pick on Map
                  </Button>
                </div>
                <Input
                  id="clinicAddress"
                  name="clinicAddress"
                  placeholder="e.g. 104 Westwood Blvd, Suite 200, Los Angeles, CA"
                  value={form.clinicAddress}
                  onChange={handleChange}
                  className="h-10.5 rounded-xl text-sm"
                />
              </div>

              {/* Coordinates display badge */}
              {form.clinicLatitude != null && form.clinicLongitude != null && (
                <div className="flex items-center gap-2 p-2.5 bg-primary/5 rounded-xl border border-primary/20 text-xs">
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="font-mono text-foreground">
                    Lat: {form.clinicLatitude.toFixed(6)}, Lng: {form.clinicLongitude.toFixed(6)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, clinicLatitude: undefined, clinicLongitude: undefined }))}
                    className="ml-auto text-[11px] text-muted-foreground hover:text-destructive underline"
                  >
                    Clear Pin
                  </button>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="bio" className="text-xs font-semibold">Practitioner Bio / Summary</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  rows={3}
                  placeholder="Brief biography outlining clinical focus, residency training, or philosophy of pet care..."
                  value={form.bio}
                  onChange={handleChange}
                  className="rounded-xl text-sm resize-none"
                />
              </div>
            </div>
          </DialogBody>

          <DialogFooter className="px-6 py-4 border-t border-border/50 bg-surface/50 gap-2 shrink-0">
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
              Register Veterinarian
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <LocationPickerModal
        open={isLocationPickerOpen}
        onOpenChange={setIsLocationPickerOpen}
        title="Pinpoint Clinic & Practice Location"
        description="Search your clinic name or drag the pin to your clinic doorstep."
        initialCoordinates={
          form.clinicLatitude != null && form.clinicLongitude != null
            ? { lat: form.clinicLatitude, lng: form.clinicLongitude }
            : null
        }
        initialAddressText={form.clinicAddress}
        onConfirmLocation={(result) => {
          setForm((prev) => ({
            ...prev,
            clinicAddress: result.formattedAddress || result.address.street,
            clinicLatitude: result.coordinates.lat,
            clinicLongitude: result.coordinates.lng,
          }));
          if (error) setError(null);
        }}
      />
    </Dialog>
  );
}
