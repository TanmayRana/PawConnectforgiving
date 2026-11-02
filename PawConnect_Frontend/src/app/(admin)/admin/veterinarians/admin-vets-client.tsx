"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  useAdminVeterinarians,
  useUpdateAdminVetVerification,
} from "@/lib/api/hooks";
import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { VerificationDialog } from "@/components/admin/verification-dialog";
import { RegisterVetDialog } from "@/components/admin/register-vet-dialog";
import { ErrorState } from "@/components/shared/states";
import { RefreshIndicator } from "@/components/ui/paw-spinner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/lib/utils/toast";
import {
  Stethoscope,
  Check,
  Ban,
  Building2,
  Eye,
  UserPlus,
} from "lucide-react";
import type {
  VeterinarianProfile,
  VerificationStatus,
} from "@/lib/mock/professionals";

type StatusFilter = "all" | VerificationStatus;

export function AdminVetsClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [reviewVet, setReviewVet] = useState<VeterinarianProfile | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);

  const { data: vets = [], isLoading, isFetching, isError, refetch } = useAdminVeterinarians();
  const { mutateAsync: updateVerification, isPending: isUpdating } = useUpdateAdminVetVerification();

  const filteredVets = useMemo(() => {
    let result = [...vets];

    if (statusFilter !== "all") {
      result = result.filter((v) => v.verificationStatus === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.specialization.toLowerCase().includes(q) ||
          v.clinic.toLowerCase().includes(q) ||
          v.qualification.toLowerCase().includes(q)
      );
    }

    return result;
  }, [vets, statusFilter, searchQuery]);

  const handleStatusChange = async (id: string, status: VerificationStatus, rejectionReason?: string) => {
    try {
      await updateVerification({ id, status, rejectionReason });
      toast.success("Verification Status Updated", {
        description: `Practitioner credentials set to '${status}'.`,
      });
      setReviewVet(null);
    } catch (err) {
      toast.error("Update Failed", {
        description: "Could not record verification status change.",
      });
      throw err;
    }
  };

  const columns: Column<VeterinarianProfile>[] = [
    {
      key: "practitioner",
      header: "Veterinarian",
      render: (v) => (
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 rounded-xl overflow-hidden bg-secondary shrink-0 border border-primary/20 flex items-center justify-center">
            {v.photo ? (
              <Image src={v.photo} alt={v.name} fill sizes="40px" className="object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center font-bold text-xs text-primary bg-primary/10">
                {v.name.replace(/^Dr\.\s*/i, "").charAt(0) || "V"}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <span className="font-bold text-foreground text-xs block truncate">{v.name}</span>
            <span className="text-[11px] text-muted-foreground block truncate">
              {v.qualification}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "specialization",
      header: "Specialization & Clinical Focus",
      render: (v) => (
        <div className="space-y-0.5">
          <span className="text-xs font-semibold text-primary block truncate">
            {v.specialization}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {v.experienceYears} Years Practicing
          </span>
        </div>
      ),
    },
    {
      key: "clinic",
      header: "Hospital / Workplace",
      render: (v) => (
        <div className="flex items-center gap-1.5 text-xs text-foreground">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="truncate">{v.clinic}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Verification",
      render: (v) => <StatusBadge status={v.verificationStatus} size="sm" />,
    },
    {
      key: "actions",
      header: "Audit / Decision",
      className: "text-right",
      render: (v) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReviewVet(v)}
            className="rounded-xl text-xs h-8 gap-1"
          >
            <Eye className="h-3.5 w-3.5" />
            Review
          </Button>

          {v.verificationStatus !== "verified" && (
            <Button
              size="sm"
              onClick={() => handleStatusChange(v.id, "verified")}
              className="rounded-xl text-xs h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              title="Quick Approve"
            >
              <Check className="h-3.5 w-3.5" />
              Approve
            </Button>
          )}

          {v.verificationStatus !== "blocked" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleStatusChange(v.id, "blocked")}
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Block"
            >
              <Ban className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (isError) {
    return (
      <div className="py-12">
        <ErrorState
          title="Could not load practitioners"
          description="Failed to load practitioner licensing records."
          action={
            <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Veterinary Practitioners Verification"
        description="Review licensing, medical boards, and credentials before certifying practitioners for clinical bookings."
      >
        <div className="flex items-center gap-3">
          <RefreshIndicator isRefreshing={isFetching && !isLoading} label="Refreshing..." />
          <Button
            onClick={() => setRegisterOpen(true)}
            className="rounded-2xl text-xs h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1.5 shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            Register Veterinarian
          </Button>
        </div>
      </PageHeader>

      {/* Filter Tabs by Verification Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs
          value={statusFilter}
          onValueChange={(val) => setStatusFilter(val as StatusFilter)}
          className="w-full sm:w-auto"
        >
          <TabsList className="bg-secondary/60 p-1 rounded-2xl h-10">
            <TabsTrigger value="all" className="rounded-xl text-xs px-3">
              All ({vets.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-xl text-xs px-3">
              Pending Audit
            </TabsTrigger>
            <TabsTrigger value="verified" className="rounded-xl text-xs px-3">
              Verified
            </TabsTrigger>
            <TabsTrigger value="rejected" className="rounded-xl text-xs px-3">
              Rejected
            </TabsTrigger>
            <TabsTrigger value="blocked" className="rounded-xl text-xs px-3">
              Blocked
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search */}
        <div className="w-full sm:w-72">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by name, hospital, specialty..."
            className="w-full"
          />
        </div>
      </div>

      {/* Veterinarians DataTable */}
      <DataTable
        columns={columns}
        data={filteredVets}
        keyExtractor={(v) => v.id}
        loading={isLoading}
        emptyTitle="No veterinary practitioners found"
        emptyDescription="Try clearing filters or search query."
        emptyIcon={<Stethoscope className="h-8 w-8 text-muted-foreground" />}
      />

      {/* Credential Verification Dialog */}
      <VerificationDialog
        open={Boolean(reviewVet)}
        onOpenChange={(op) => !op && setReviewVet(null)}
        professional={reviewVet}
        role="vet"
        onUpdateStatus={handleStatusChange}
        loading={isUpdating}
      />

      {/* Practitioner Registration Dialog */}
      <RegisterVetDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
      />
    </div>
  );
}
