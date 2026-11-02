"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Edit,
  FileHeart,
  Plus,
  ShieldCheck,
  Syringe,
  Trash2,
  Activity,
  Clock,
  PawPrint,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PetFormModal } from "@/components/customer/pet-form-modal";
import { VaccinationModal } from "@/components/customer/vaccination-modal";
import { MedicalRecordModal } from "@/components/customer/medical-record-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { BookingCard } from "@/components/shared/booking-card";
import { EmptyState, LoadingState, ErrorState } from "@/components/shared/states";
import {
  usePet,
  useUpdatePet,
  useAddVaccination,
  useDeleteVaccination,
  useAddMedicalRecord,
  useDeleteMedicalRecord,
  useBookings,
} from "@/lib/api/hooks";
import { showSuccess, showError } from "@/lib/utils/toast";

interface PetDetailClientProps {
  id: string;
}

export function PetDetailClient({ id }: PetDetailClientProps) {
  const { data: pet, isLoading, error } = usePet(id);
  const updatePetMutation = useUpdatePet();
  const addVaccinationMutation = useAddVaccination();
  const deleteVaccinationMutation = useDeleteVaccination();
  const addMedicalMutation = useAddMedicalRecord();
  const deleteMedicalMutation = useDeleteMedicalRecord();
  const { data: allBookings = [] } = useBookings();

  // Modals state
  const [editPetModalOpen, setEditPetModalOpen] = React.useState(false);
  const [vaccineModalOpen, setVaccineModalOpen] = React.useState(false);
  const [medicalModalOpen, setMedicalModalOpen] = React.useState(false);

  // Deletion confirm states
  const [deleteVaccineId, setDeleteVaccineId] = React.useState<string | null>(null);
  const [deleteMedicalId, setDeleteMedicalId] = React.useState<string | null>(null);

  if (isLoading) {
    return <LoadingState variant="detail" message="Loading pet profile..." className="min-h-[50vh]" />;
  }

  if (error || !pet) {
    return (
      <ErrorState
        title="Pet Not Found"
        description="The pet profile you are trying to view does not exist or has been removed."
        action={
          <Button asChild variant="outline">
            <Link href="/app/pets">Return to My Pets</Link>
          </Button>
        }
      />
    );
  }

  // Filter bookings associated with this pet
  const petBookings = allBookings.filter(
    (b) => b.petId === pet.id || b.petName.toLowerCase() === pet.name.toLowerCase()
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Back button & Page Header */}
      <div>
        <div className="mb-4">
          <Link
            href="/app/pets"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to My Pets
          </Link>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
              {pet.name}
              <Badge variant="secondary" className="text-xs font-semibold uppercase tracking-wider">
                {pet.species}
              </Badge>
              {pet.status && (
                <Badge
                  variant={pet.status === "ACTIVE" ? "default" : "outline"}
                  className={`text-xs ${
                    pet.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {pet.status}
                </Badge>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {pet.breed} • {pet.gender} • {pet.age} {pet.age === 1 ? "year old" : "years old"}
              {pet.dateOfBirth || pet.birthDate ? ` • Born ${pet.dateOfBirth || pet.birthDate}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="gap-2 rounded-full"
              onClick={() => setEditPetModalOpen(true)}
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </Button>
            <Button asChild className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs">
              <Link href="/app/services/veterinary">
                <Calendar className="w-4 h-4" />
                Book Care
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Pet Hero Card */}
      <div className="rounded-[32px] border border-border/80 bg-card p-6 sm:p-8 shadow-xs flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden shrink-0 border border-border/60 bg-surface shadow-xs flex items-center justify-center">
          {pet.photo || pet.photoUrl ? (
            <Image
              src={(pet.photo || pet.photoUrl)!}
              alt={pet.name}
              fill
              sizes="(max-width: 640px) 144px, 176px"
              priority
              className="object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <PawPrint className="w-12 h-12 text-primary/40 mb-1" />
              <span className="text-xs font-medium">No Photo</span>
            </div>
          )}
        </div>

        <div className="flex-1 w-full space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-surface/80 p-3 rounded-2xl border border-border/60">
              <span className="text-[11px] font-medium text-muted-foreground block">Breed</span>
              <span className="text-xs font-semibold text-foreground block truncate mt-0.5">
                {pet.breed || "Standard"}
              </span>
            </div>
            <div className="bg-surface/80 p-3 rounded-2xl border border-border/60">
              <span className="text-[11px] font-medium text-muted-foreground block">Age</span>
              <span className="text-xs font-semibold text-foreground block truncate mt-0.5">
                {pet.age} {pet.age === 1 ? "yr" : "yrs"}
              </span>
            </div>
            <div className="bg-surface/80 p-3 rounded-2xl border border-border/60">
              <span className="text-[11px] font-medium text-muted-foreground block">Date of Birth</span>
              <span className="text-xs font-semibold text-foreground block truncate mt-0.5">
                {pet.dateOfBirth || pet.birthDate || "N/A"}
              </span>
            </div>
            <div className="bg-surface/80 p-3 rounded-2xl border border-border/60">
              <span className="text-[11px] font-medium text-muted-foreground block">Weight</span>
              <span className="text-xs font-semibold text-foreground block truncate mt-0.5">
                {pet.weight} kg
              </span>
            </div>
            <div className="bg-surface/80 p-3 rounded-2xl border border-border/60">
              <span className="text-[11px] font-medium text-muted-foreground block">Color</span>
              <span className="text-xs font-semibold text-foreground block truncate mt-0.5">
                {pet.color || "Standard"}
              </span>
            </div>
            <div className="bg-surface/80 p-3 rounded-2xl border border-border/60">
              <span className="text-[11px] font-medium text-muted-foreground block">Status</span>
              <span className="text-xs font-semibold text-foreground block truncate mt-0.5">
                {pet.status || "ACTIVE"}
              </span>
            </div>
            {(pet.microchipId || pet.microchipNumber) && (
              <div className="bg-surface/80 p-3 rounded-2xl border border-border/60">
                <span className="text-[11px] font-medium text-muted-foreground block">Microchip</span>
                <span className="text-xs font-semibold text-foreground block truncate mt-0.5 font-mono">
                  {pet.microchipId || pet.microchipNumber}
                </span>
              </div>
            )}
          </div>

          {/* Care Notes Card if available */}
          {pet.notes && (
            <div className="bg-surface/60 p-3.5 rounded-2xl border border-border/60 text-xs text-foreground space-y-1">
              <span className="font-bold text-foreground block text-[11px] uppercase tracking-wider text-muted-foreground">
                Care Notes & Medical Instructions:
              </span>
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">{pet.notes}</p>
            </div>
          )}

          {/* Quick Health Summary Indicators */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/40">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Vaccinations: {pet.vaccinations.length} on record</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-primary bg-primary-soft/50 px-3 py-1.5 rounded-xl border border-primary/20">
              <Activity className="w-4 h-4 text-primary" />
              <span>Medical History: {pet.medicalRecords.length} visits</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-foreground bg-secondary/80 px-3 py-1.5 rounded-xl border border-border/50">
              <Clock className="w-4 h-4 text-sky-600" />
              <span>Bookings: {petBookings.length} appointments</span>
            </div>
          </div>
        </div>
      </div>

      {/* Deep-dive Tabbed Information Sections */}
      <Tabs defaultValue="vaccinations" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md bg-secondary/80 p-1 rounded-2xl">
          <TabsTrigger value="vaccinations" className="rounded-xl font-semibold text-xs sm:text-sm">
            Vaccinations ({pet.vaccinations.length})
          </TabsTrigger>
          <TabsTrigger value="medical" className="rounded-xl font-semibold text-xs sm:text-sm">
            Medical ({pet.medicalRecords.length})
          </TabsTrigger>
          <TabsTrigger value="bookings" className="rounded-xl font-semibold text-xs sm:text-sm">
            Bookings ({petBookings.length})
          </TabsTrigger>
        </TabsList>

        {/* ─── VACCINATIONS TAB ─── */}
        <TabsContent value="vaccinations" className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Syringe className="w-5 h-5 text-primary" />
                Vaccination History & Schedule
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Keep immunization logs up to date for travel and boarding readiness.
              </p>
            </div>
            <Button
              onClick={() => setVaccineModalOpen(true)}
              className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Vaccine
            </Button>
          </div>

          {pet.vaccinations.length === 0 ? (
            <EmptyState
              title="No Vaccinations Recorded"
              description={`No vaccination entries currently on file for ${pet.name}.`}
              action={
                <Button
                  onClick={() => setVaccineModalOpen(true)}
                  className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
                >
                  Record First Vaccine
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pet.vaccinations.map((v) => (
                <div
                  key={v.id}
                  className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 hover:shadow-sm transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-foreground text-base">{v.vaccineName}</h4>
                        <p className="text-xs text-muted-foreground">
                          Administered by: {v.veterinarian}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                        Protected
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-surface/70 p-2.5 rounded-xl border border-border/60">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Given On:</span>
                        <span className="font-semibold text-foreground">{v.dateAdministered}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Next Due:</span>
                        <span className="font-semibold text-primary">{v.nextDueDate}</span>
                      </div>
                    </div>

                    {v.notes && (
                      <p className="text-xs text-muted-foreground italic bg-surface/50 p-2 rounded-lg">
                        &quot;{v.notes}&quot;
                      </p>
                    )}
                  </div>

                  <div className="pt-3 mt-3 border-t border-border/40 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-destructive hover:bg-destructive/10 h-8 gap-1.5"
                      onClick={() => setDeleteVaccineId(v.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── MEDICAL RECORDS TAB ─── */}
        <TabsContent value="medical" className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <FileHeart className="w-5 h-5 text-primary" />
                Medical & Clinical Records
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Track doctor consultations, therapies, checkups, and diagnostic reports.
              </p>
            </div>
            <Button
              onClick={() => setMedicalModalOpen(true)}
              className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Record
            </Button>
          </div>

          {pet.medicalRecords.length === 0 ? (
            <EmptyState
              title="No Medical Records"
              description={`No medical diagnoses or clinical records logged for ${pet.name}.`}
              action={
                <Button
                  onClick={() => setMedicalModalOpen(true)}
                  className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
                >
                  Add Medical Record
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {pet.medicalRecords.map((m) => (
                <div
                  key={m.id}
                  className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/40 hover:shadow-sm transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-xs font-semibold">
                        {m.recordType}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        {m.date}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-foreground">{m.description}</h4>
                    <p className="text-xs text-muted-foreground">
                      Attending Clinician: <span className="font-semibold text-foreground">{m.veterinarian}</span> at {m.clinic}
                    </p>

                    {m.notes && (
                      <p className="text-xs text-muted-foreground italic mt-1 bg-surface/60 p-2 rounded-lg max-w-2xl">
                        &quot;{m.notes}&quot;
                      </p>
                    )}
                  </div>

                  <div className="flex md:flex-col items-center justify-end gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-destructive hover:bg-destructive/10 h-8 gap-1.5"
                      onClick={() => setDeleteMedicalId(m.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── BOOKINGS HISTORY TAB ─── */}
        <TabsContent value="bookings" className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Service Bookings for {pet.name}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Overview of upcoming and past veterinary, grooming, or training sessions.
              </p>
            </div>
            <Button asChild className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm">
              <Link href="/app/services/veterinary">Book New Service</Link>
            </Button>
          </div>

          {petBookings.length === 0 ? (
            <EmptyState
              title="No Bookings Found"
              description={`There are no past or upcoming care bookings for ${pet.name}.`}
              action={
                <Button asChild className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs">
                  <Link href="/app/services/veterinary">Browse Services</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {petBookings.map((b) => (
                <BookingCard key={b.id} booking={b} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── MODALS ─── */}
      {/* 1. Edit Pet Profile */}
      <PetFormModal
        open={editPetModalOpen}
        onOpenChange={setEditPetModalOpen}
        mode="edit"
        initialData={pet}
        onSubmit={async (data) => {
          await updatePetMutation.mutateAsync({ id: pet.id, data });
          showSuccess(`${pet.name}'s profile updated`, "Details saved successfully.");
        }}
        isSubmitting={updatePetMutation.isPending}
      />

      {/* 2. Add Vaccination */}
      <VaccinationModal
        open={vaccineModalOpen}
        onOpenChange={setVaccineModalOpen}
        petName={pet.name}
        onSubmit={async (data) => {
          await addVaccinationMutation.mutateAsync({ petId: pet.id, record: data });
          showSuccess(`Vaccine record added for ${pet.name}`, "Immunization file updated.");
        }}
        isSubmitting={addVaccinationMutation.isPending}
      />

      {/* 3. Add Medical Record */}
      <MedicalRecordModal
        open={medicalModalOpen}
        onOpenChange={setMedicalModalOpen}
        petName={pet.name}
        onSubmit={async (data) => {
          await addMedicalMutation.mutateAsync({ petId: pet.id, record: data });
          showSuccess(`Clinical record logged for ${pet.name}`, "Health file updated.");
        }}
        isSubmitting={addMedicalMutation.isPending}
      />

      {/* 4. Delete Vaccine Confirm */}
      <ConfirmDialog
        open={Boolean(deleteVaccineId)}
        onOpenChange={(open) => !open && setDeleteVaccineId(null)}
        title="Remove Vaccination Record?"
        description="Are you sure you want to remove this vaccination record? This action cannot be undone."
        confirmLabel="Remove Record"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={async () => {
          if (!deleteVaccineId) return;
          try {
            await deleteVaccinationMutation.mutateAsync({
              petId: pet.id,
              vaccinationId: deleteVaccineId,
            });
            showSuccess("Vaccination record removed", "Record deleted from pet file.");
            setDeleteVaccineId(null);
          } catch {
            showError("Failed to remove vaccination record", "Please try again.");
          }
        }}
      />

      {/* 5. Delete Medical Record Confirm */}
      <ConfirmDialog
        open={Boolean(deleteMedicalId)}
        onOpenChange={(open) => !open && setDeleteMedicalId(null)}
        title="Remove Medical Record?"
        description="Are you sure you want to remove this medical entry? This action cannot be undone."
        confirmLabel="Remove Entry"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={async () => {
          if (!deleteMedicalId) return;
          try {
            await deleteMedicalMutation.mutateAsync({
              petId: pet.id,
              recordId: deleteMedicalId,
            });
            showSuccess("Medical record removed", "Record deleted from clinical history.");
            setDeleteMedicalId(null);
          } catch {
            showError("Failed to remove medical record", "Please try again.");
          }
        }}
      />
    </div>
  );
}

