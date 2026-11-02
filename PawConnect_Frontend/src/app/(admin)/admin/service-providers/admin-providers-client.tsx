"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  useAdminProviders,
  useUpdateAdminProviderVerification,
} from "@/lib/api/hooks";
import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { VerificationDialog } from "@/components/admin/verification-dialog";
import { RegisterProviderDialog } from "@/components/admin/register-provider-dialog";
import { ErrorState } from "@/components/shared/states";
import { RefreshIndicator } from "@/components/ui/paw-spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/lib/utils/toast";
import {
  Briefcase,
  Check,
  Ban,
  Eye,
  UserPlus,
  MapPin,
} from "lucide-react";
import type {
  ServiceProviderProfile,
  VerificationStatus,
} from "@/lib/mock/professionals";

type DisciplineFilter = "all" | "grooming" | "training";

export function AdminProvidersClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState<DisciplineFilter>("all");
  const [reviewProvider, setReviewProvider] = useState<ServiceProviderProfile | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);

  const { data: providers = [], isLoading, isFetching, isError, refetch } = useAdminProviders();
  const { mutateAsync: updateVerification, isPending: isUpdating } = useUpdateAdminProviderVerification();

  const filteredProviders = useMemo(() => {
    let result = [...providers];

    if (disciplineFilter !== "all") {
      result = result.filter((p) => p.providerType === disciplineFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.businessName.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.specializations.some((s) => s.toLowerCase().includes(q))
      );
    }

    return result;
  }, [providers, disciplineFilter, searchQuery]);

  const handleStatusChange = async (id: string, status: VerificationStatus, rejectionReason?: string) => {
    try {
      await updateVerification({ id, status, rejectionReason });
      toast.success("Provider Verification Updated", {
        description: `Partner standards set to '${status}'.`,
      });
      setReviewProvider(null);
    } catch (err) {
      toast.error("Update Failed", {
        description: "Could not modify provider status.",
      });
      throw err;
    }
  };

  const columns: Column<ServiceProviderProfile>[] = [
    {
      key: "provider",
      header: "Service Partner Profile",
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 rounded-xl overflow-hidden bg-secondary shrink-0 border border-border flex items-center justify-center">
            {p.photo ? (
              <Image src={p.photo} alt={p.name} fill sizes="40px" className="object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center font-bold text-xs text-primary bg-primary/10">
                {p.businessName?.charAt(0) || p.name?.charAt(0) || "P"}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <span className="font-bold text-foreground text-xs block truncate">{p.name}</span>
            <span className="text-[11px] text-muted-foreground block truncate">
              {p.businessName}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "discipline",
      header: "Discipline & Specialties",
      render: (p) => (
        <div className="space-y-1">
          <Badge
            variant="outline"
            className={`text-[10px] capitalize font-semibold ${
              p.providerType === "grooming"
                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                : "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20"
            }`}
          >
            {p.providerType} Specialist
          </Badge>
          <div className="flex flex-wrap gap-1">
            {p.specializations.slice(0, 2).map((s) => (
              <span key={s} className="text-[10px] text-muted-foreground">
                • {s}
              </span>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: "experience",
      header: "Track Record & Location",
      render: (p) => (
        <div className="space-y-1 text-xs">
          <span className="font-semibold text-foreground block">
            {p.experienceYears} Years Active
          </span>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
            <span className="truncate max-w-[160px]">{p.location}</span>
          </div>
          {p.latitude != null && p.longitude != null && (
            <Badge variant="outline" className="text-[10px] font-mono py-0 px-1.5 bg-primary/5 text-primary border-primary/20">
              GPS Mapped
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Verification",
      render: (p) => <StatusBadge status={p.verificationStatus} size="sm" />,
    },
    {
      key: "actions",
      header: "Audit / Actions",
      className: "text-right",
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReviewProvider(p)}
            className="rounded-xl text-xs h-8 gap-1"
          >
            <Eye className="h-3.5 w-3.5" />
            Review
          </Button>

          {p.verificationStatus !== "verified" && (
            <Button
              size="sm"
              onClick={() => handleStatusChange(p.id, "verified")}
              className="rounded-xl text-xs h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              title="Quick Approve"
            >
              <Check className="h-3.5 w-3.5" />
              Approve
            </Button>
          )}

          {p.verificationStatus !== "blocked" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleStatusChange(p.id, "blocked")}
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
          title="Could not load providers"
          description="Failed to load service partner records."
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
        title="Service Providers Governance"
        description="Verify grooming salons and certified positive dog trainers. Note: Providers are professional service contractors, not marketplace vendors."
      >
        <div className="flex items-center gap-3">
          <RefreshIndicator isRefreshing={isFetching && !isLoading} label="Refreshing..." />
          <Button
            onClick={() => setRegisterOpen(true)}
            className="rounded-2xl text-xs h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1.5 shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            Register Service Provider
          </Button>
        </div>
      </PageHeader>

      {/* Filter Tabs by Discipline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs
          value={disciplineFilter}
          onValueChange={(val) => setDisciplineFilter(val as DisciplineFilter)}
          className="w-full sm:w-auto"
        >
          <TabsList className="bg-secondary/60 p-1 rounded-2xl h-10">
            <TabsTrigger value="all" className="rounded-xl text-xs px-3">
              All Providers ({providers.length})
            </TabsTrigger>
            <TabsTrigger value="grooming" className="rounded-xl text-xs px-3">
              Grooming Salons
            </TabsTrigger>
            <TabsTrigger value="training" className="rounded-xl text-xs px-3">
              Training Academies
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search */}
        <div className="w-full sm:w-72">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by studio, partner name..."
            className="w-full"
          />
        </div>
      </div>

      {/* Providers DataTable */}
      <DataTable
        columns={columns}
        data={filteredProviders}
        keyExtractor={(p) => p.id}
        loading={isLoading}
        emptyTitle="No service providers found"
        emptyDescription="Try clearing filters or search query."
        emptyIcon={<Briefcase className="h-8 w-8 text-muted-foreground" />}
      />

      {/* Verification Dialog */}
      <VerificationDialog
        open={Boolean(reviewProvider)}
        onOpenChange={(op) => !op && setReviewProvider(null)}
        professional={reviewProvider}
        role="provider"
        onUpdateStatus={handleStatusChange}
        loading={isUpdating}
      />

      {/* Service Provider Registration Dialog */}
      <RegisterProviderDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
      />
    </div>
  );
}
