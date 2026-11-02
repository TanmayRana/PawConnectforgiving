"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PetCard } from "@/components/shared/pet-card";
import { PetFormModal } from "@/components/customer/pet-form-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, LoadingState } from "@/components/shared/states";
import { usePets, useCreatePet, useUpdatePet, useDeletePet } from "@/lib/api/hooks";
import type { Pet } from "@/lib/mock/pets";
import { Plus } from "lucide-react";
import { showSuccess, showError } from "@/lib/utils/toast";
import { RefreshIndicator } from "@/components/ui/paw-spinner";

export function PetsClient() {
  const { data: pets = [], isLoading, isFetching } = usePets();
  const createPetMutation = useCreatePet();
  const updatePetMutation = useUpdatePet();
  const deletePetMutation = useDeletePet();

  // Modals state
  const [modalMode, setModalMode] = React.useState<"create" | "edit">("create");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [selectedPet, setSelectedPet] = React.useState<Pet | null>(null);

  // Confirm delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [petToDelete, setPetToDelete] = React.useState<Pet | null>(null);

  const handleOpenCreate = () => {
    setSelectedPet(null);
    setModalMode("create");
    setModalOpen(true);
  };

  const handleOpenEdit = (pet: Pet) => {
    setSelectedPet(pet);
    setModalMode("edit");
    setModalOpen(true);
  };

  const handleOpenDelete = (pet: Pet) => {
    setPetToDelete(pet);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (
    data: Partial<Pet> & { name: string; species: string }
  ) => {
    if (modalMode === "create") {
      await createPetMutation.mutateAsync(data);
      showSuccess(`Successfully added ${data.name}!`, "Pet profile registered.");
    } else if (modalMode === "edit" && selectedPet) {
      await updatePetMutation.mutateAsync({
        id: selectedPet.id,
        data,
      });
      showSuccess(`Updated ${data.name}'s profile.`, "Profile details saved successfully.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!petToDelete) return;
    try {
      await deletePetMutation.mutateAsync(petToDelete.id);
      showSuccess(`${petToDelete.name} has been removed.`, "Pet profile archived.");
      setDeleteDialogOpen(false);
      setPetToDelete(null);
    } catch {
      showError("Failed to remove pet", "Unable to remove this pet profile. Please try again.");
    }
  };

  return (
    <div className="space-y-8">
      {/* ─── Page Header with Add Pet Action ─────────────────────────────────── */}
      <PageHeader
        title="My Pets"
        description="Manage your companion profiles, immunization records, and clinical histories in one unified digital record."
      >
        <div className="flex items-center gap-3">
          <RefreshIndicator isRefreshing={isFetching && !isLoading} label="Syncing pets..." />
          <Button onClick={handleOpenCreate} className="rounded-full shadow-xs">
            <Plus className="h-4 w-4 mr-1.5" />
            <span>Add New Pet</span>
          </Button>
        </div>
      </PageHeader>

      {/* ─── Pets Grid, Loading Skeleton, or Empty State ─────────────────────── */}
      {isLoading ? (
        <div className="py-4">
          <LoadingState variant="cards" count={3} columns={3} />
        </div>
      ) : pets.length === 0 ? (
        <EmptyState
          title="No pets added yet"
          description="Register your dog, cat, or bird to easily book certified veterinarians, schedule grooming, and store vaccination certificates."
          action={
            <Button onClick={handleOpenCreate} className="rounded-full shadow-xs">
              <Plus className="h-4 w-4 mr-1.5" />
              <span>Add Your First Pet</span>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pets.map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
            />
          ))}
        </div>
      )}

      {/* ─── Add/Edit Pet Modal ──────────────────────────────────────────────── */}
      <PetFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={modalMode}
        initialData={selectedPet}
        onSubmit={handleFormSubmit}
        isSubmitting={createPetMutation.isPending || updatePetMutation.isPending}
      />

      {/* ─── Confirm Delete Dialog ───────────────────────────────────────────── */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={`Remove ${petToDelete?.name || "Pet"}?`}
        description={`Are you sure you want to remove ${petToDelete?.name} from your PawConnect account? Historical records and completed booking receipts will remain archived.`}
        confirmLabel="Remove Pet"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
