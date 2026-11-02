"use client";

import React, { useState, useMemo } from "react";
import {
  useProviderServices,
  useCreateProviderService,
  useUpdateProviderService,
  useToggleProviderServiceActive,
  useDeleteProviderService,
} from "@/lib/api/hooks";
import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { ServiceFormModal } from "@/components/professional/service-form-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LoadingState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils/money";
import { toast } from "@/lib/utils/toast";
import {
  Plus,
  Edit2,
  Trash2,
  Power,
  Sparkles,
} from "lucide-react";
import type { ProviderService } from "@/lib/mock/professionals";
import type { ServiceFormData } from "@/components/professional/service-form-modal";

export function ProviderServicesClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "grooming" | "training">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ProviderService | null>(null);
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);

  const { data: services = [], isLoading, isError, refetch } = useProviderServices();
  const { mutateAsync: createService, isPending: isCreating } = useCreateProviderService();
  const { mutateAsync: updateService, isPending: isUpdating } = useUpdateProviderService();
  const { mutateAsync: toggleActive } = useToggleProviderServiceActive();
  const { mutateAsync: deleteService, isPending: isDeleting } = useDeleteProviderService();

  const filteredServices = useMemo(() => {
    let result = [...services];

    if (categoryFilter !== "all") {
      result = result.filter((s) => s.category === categoryFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
      );
    }

    return result;
  }, [services, categoryFilter, searchQuery]);

  const handleOpenCreate = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (srv: ProviderService) => {
    setEditingService(srv);
    setIsModalOpen(true);
  };

  const handleSaveService = async (formData: ServiceFormData) => {
    try {
      if (editingService) {
        await updateService({
          id: editingService.id,
          input: formData,
        });
        toast.success("Service Updated", {
          description: `${formData.name} has been updated.`,
        });
      } else {
        await createService(formData);
        toast.success("Service Created", {
          description: `${formData.name} added to your offering catalog.`,
        });
      }
      setIsModalOpen(false);
      setEditingService(null);
    } catch {
      toast.error("Operation Failed", {
        description: "Could not save service changes. Please retry.",
      });
    }
  };

  const handleToggleActive = async (id: string, name: string, current: boolean) => {
    try {
      await toggleActive(id);
      toast.success(current ? "Service Deactivated" : "Service Activated", {
        description: `${name} is now ${current ? "inactive" : "active"} for client booking.`,
      });
    } catch {
      toast.error("Status Change Failed", {
        description: "Could not toggle service status.",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingServiceId) return;
    try {
      await deleteService(deletingServiceId);
      toast.success("Service Deleted", {
        description: "Service has been removed from catalog.",
      });
      setDeletingServiceId(null);
    } catch {
      toast.error("Delete Failed", {
        description: "Could not remove service.",
      });
    }
  };

  const columns: Column<ProviderService>[] = [
    {
      key: "name",
      header: "Service Package",
      cell: (row) => (
        <div className="max-w-md">
          <span className="font-bold text-xs text-foreground block">{row.name}</span>
          <p className="text-[11px] text-muted-foreground line-clamp-1 leading-relaxed mt-0.5">
            {row.description}
          </p>
        </div>
      ),
    },
    {
      key: "category",
      header: "Specialty",
      cell: (row) => (
        <Badge
          variant="secondary"
          className="text-[10px] px-2 py-0.5 font-semibold capitalize"
        >
          {row.category === "grooming" ? "Grooming & Spa" : "Canine Training"}
        </Badge>
      ),
    },
    {
      key: "price",
      header: "Price",
      cell: (row) => (
        <span className="text-xs font-bold text-foreground">
          {formatMoney(row.price)}
        </span>
      ),
    },
    {
      key: "durationMinutes",
      header: "Duration",
      cell: (row) => (
        <span className="text-xs text-muted-foreground font-medium">
          {row.durationMinutes} mins
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <StatusBadge
          status={row.active ? "active" : "inactive"}
          size="sm"
        />
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleActive(row.id, row.name, row.active)}
            title={row.active ? "Deactivate service" : "Activate service"}
            className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <Power className={`h-4 w-4 ${row.active ? "text-emerald-600" : "text-muted-foreground"}`} />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenEdit(row)}
            title="Edit service details"
            className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeletingServiceId(row.id)}
            title="Delete service"
            className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Service Packages & Offerings"
        description="Create and manage your grooming treatments, behavioral coaching workshops, and pricing tiers."
      >
        <Button
          onClick={handleOpenCreate}
          className="rounded-xl text-xs font-semibold gap-1.5 h-9"
        >
          <Plus className="h-4 w-4" />
          Add Service
        </Button>
      </PageHeader>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-border self-start">
          {(["all", "grooming", "training"] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                categoryFilter === cat
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat === "all" ? "All Services" : cat}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search service name or description..."
          />
        </div>
      </div>

      {/* Services Table */}
      {isLoading ? (
        <LoadingState variant="cards" count={6} columns={3} />
      ) : isError ? (
        <ErrorState
          title="Could not load services"
          description="Encountered an issue retrieving your service packages. Please retry."
          action={
            <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
              Retry
            </Button>
          }
        />
      ) : (
        <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-2xs">
          <DataTable
            columns={columns}
            data={filteredServices}
            emptyTitle="No services found"
            emptyDescription={
              searchQuery
                ? `No service offerings match "${searchQuery}".`
                : "No service packages are registered in your catalog."
            }
            emptyAction={
              <Button onClick={handleOpenCreate} size="sm" className="rounded-xl text-xs mt-2">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Your First Service
              </Button>
            }
            emptyIcon={<Sparkles className="h-8 w-8 text-muted-foreground" />}
          />
        </div>
      )}

      {/* Add / Edit Service Modal */}
      <ServiceFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        service={editingService}
        onSubmit={handleSaveService}
        loading={isCreating || isUpdating}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deletingServiceId)}
        onOpenChange={(op) => !op && setDeletingServiceId(null)}
        title="Delete this service package?"
        description="Are you sure you want to remove this service from your catalog? Historical bookings will preserve their recorded data."
        confirmLabel="Yes, Delete Service"
        variant="destructive"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
