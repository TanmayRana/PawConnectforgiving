"use client";

import React, { useState, useMemo } from "react";
import {
  useAdminPromoCodes,
  useCreateAdminPromoCode,
  useUpdateAdminPromoCode,
  useToggleAdminPromoCodeStatus,
  useDeleteAdminPromoCode,
  type PromoCode,
  type CreatePromoCodeInput,
} from "@/lib/api/hooks";
import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { DataTable, type Column } from "@/components/shared/data-table";
import { PromoCodeFormModal } from "@/components/admin/promo-code-form-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { formatMoney } from "@/lib/utils/money";
import { formatFriendlyDate } from "@/lib/utils/date";
import { toast } from "@/lib/utils/toast";
import {
  Plus,
  Edit2,
  Trash2,
  Ticket,
  Percent,
  IndianRupee,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

export function AdminPromoCodesClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPromoCode, setEditingPromoCode] = useState<PromoCode | null>(null);
  const [deletingPromoCode, setDeletingPromoCode] = useState<PromoCode | null>(null);

  const queryParams = useMemo(() => {
    return {
      search: searchQuery.trim() || undefined,
      isActive: statusFilter === "all" ? undefined : statusFilter === "active",
      size: 50,
    };
  }, [searchQuery, statusFilter]);

  const {
    data: pagedData,
    isLoading,
    isError,
    refetch,
  } = useAdminPromoCodes(queryParams);

  const { mutateAsync: createPromoCode, isPending: isCreating } = useCreateAdminPromoCode();
  const { mutateAsync: updatePromoCode, isPending: isUpdating } = useUpdateAdminPromoCode();
  const { mutateAsync: toggleStatus } = useToggleAdminPromoCodeStatus();
  const { mutateAsync: deletePromoCode, isPending: isDeleting } = useDeleteAdminPromoCode();

  const promoCodes = pagedData?.content || [];

  const handleOpenCreate = () => {
    setEditingPromoCode(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (promo: PromoCode) => {
    setEditingPromoCode(promo);
    setModalOpen(true);
  };

  const handleSavePromoCode = async (formData: CreatePromoCodeInput) => {
    try {
      if (editingPromoCode) {
        await updatePromoCode({ id: editingPromoCode.id, input: formData });
        toast.success("Promo Code Updated", {
          description: `Changes to '${formData.code}' have been saved.`,
        });
      } else {
        await createPromoCode(formData);
        toast.success("Promo Code Created", {
          description: `Promo code '${formData.code}' is now live.`,
        });
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save promo code";
      toast.error("Operation Failed", { description: message });
      throw err;
    }
  };

  const handleToggleActive = async (promo: PromoCode) => {
    try {
      await toggleStatus({ id: promo.id, isActive: !promo.isActive });
      toast.success(
        promo.isActive ? "Promo Code Deactivated" : "Promo Code Activated",
        {
          description: `'${promo.code}' status updated.`,
        }
      );
    } catch (err: unknown) {
      toast.error("Status Change Failed", {
        description: err instanceof Error ? err.message : "Could not toggle status",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingPromoCode) return;
    try {
      await deletePromoCode(deletingPromoCode.id);
      toast.success("Promo Code Deleted", {
        description: `'${deletingPromoCode.code}' has been removed.`,
      });
      setDeletingPromoCode(null);
    } catch (err: unknown) {
      toast.error("Cannot Delete Promo Code", {
        description: err instanceof Error ? err.message : "Error deleting promo code",
      });
      setDeletingPromoCode(null);
    }
  };

  const columns: Column<PromoCode>[] = [
    {
      key: "code",
      header: "Promo Code",
      render: (p) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xs uppercase font-mono tracking-wider text-foreground bg-primary/10 text-primary px-2.5 py-1 rounded-lg border border-primary/20">
              {p.code}
            </span>
          </div>
          {p.description && (
            <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-xs">
              {p.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "discount",
      header: "Discount Value",
      render: (p) => {
        const isPct = p.discountType === "PERCENTAGE";
        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
              {isPct ? (
                <>
                  <Percent className="h-3.5 w-3.5 text-primary" />
                  <span>{p.discountValue}% OFF</span>
                </>
              ) : (
                <>
                  <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{formatMoney(p.discountValue)} OFF</span>
                </>
              )}
            </div>
            {isPct && p.maxDiscountAmount && (
              <span className="text-[10px] text-muted-foreground block">
                Up to {formatMoney(p.maxDiscountAmount)} max
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "minOrder",
      header: "Order Minimum",
      render: (p) => (
        <span className="text-xs font-semibold text-foreground">
          {p.minOrderAmount > 0 ? formatMoney(p.minOrderAmount) : "None"}
        </span>
      ),
    },
    {
      key: "usage",
      header: "Redemptions",
      render: (p) => {
        const hasLimit = p.usageLimit !== null && p.usageLimit !== undefined;
        const isExhausted = hasLimit && p.usedCount >= (p.usageLimit ?? 0);
        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs">
              <span
                className={`font-bold tabular-nums ${
                  isExhausted ? "text-destructive font-black" : "text-foreground"
                }`}
              >
                {p.usedCount}
              </span>
              <span className="text-muted-foreground">
                / {hasLimit ? p.usageLimit : "∞"}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground block">
              Max {p.perUserLimit} per user
            </span>
          </div>
        );
      },
    },
    {
      key: "validity",
      header: "Validity Period",
      render: (p) => {
        const now = new Date();
        const from = p.validFrom ? new Date(p.validFrom) : null;
        const until = p.validUntil ? new Date(p.validUntil) : null;

        const isExpired = until && until < now;
        const isUpcoming = from && from > now;

        if (isExpired) {
          return (
            <Badge variant="outline" className="text-[10px] rounded-lg text-destructive border-destructive/30 bg-destructive/5 gap-1">
              <Clock className="h-3 w-3" /> Expired ({formatFriendlyDate(until)})
            </Badge>
          );
        }

        if (isUpcoming) {
          return (
            <Badge variant="outline" className="text-[10px] rounded-lg text-amber-600 border-amber-500/30 bg-amber-500/5 gap-1">
              <Calendar className="h-3 w-3" /> Starts {formatFriendlyDate(from)}
            </Badge>
          );
        }

        if (until) {
          return (
            <span className="text-xs text-muted-foreground">
              Until {formatFriendlyDate(until)}
            </span>
          );
        }

        return (
          <span className="text-xs text-muted-foreground">
            Always valid
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (p) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={p.isActive}
            onCheckedChange={() => handleToggleActive(p)}
            aria-label={`Toggle active state for ${p.code}`}
          />
          <span className="text-[11px] font-medium text-muted-foreground">
            {p.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenEdit(p)}
            className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-foreground"
            aria-label={`Edit ${p.code}`}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeletingPromoCode(p)}
            className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            aria-label={`Delete ${p.code}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Promo Codes & Discounts"
        description="Create, monitor usage limits, configure minimum orders, and schedule discount vouchers for the PawConnect pet shop."
      >
        <Button onClick={handleOpenCreate} className="rounded-2xl gap-2 font-bold shadow-sm">
          <Plus className="h-4 w-4" />
          Create Promo Code
        </Button>
      </PageHeader>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="w-full sm:max-w-xs">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by code or description..."
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-2xl border border-border/70 bg-card self-start sm:self-auto">
          {(["all", "active", "inactive"] as const).map((filter) => (
            <Button
              key={filter}
              variant={statusFilter === filter ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter(filter)}
              className="text-xs h-8 px-3 rounded-xl capitalize font-semibold"
            >
              {filter}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <LoadingState variant="table" count={5} message="Loading promo codes..." />
      ) : isError ? (
        <ErrorState
          title="Could not load promo codes"
          description="An error occurred while connecting to the Spring Boot promo code service."
          onRetry={refetch}
        />
      ) : promoCodes.length === 0 ? (
        <EmptyState
          icon={<Ticket className="h-8 w-8 text-muted-foreground" />}
          title={searchQuery ? "No matching promo codes" : "No promo codes created yet"}
          description={
            searchQuery
              ? `No discount vouchers match '${searchQuery}'. Try adjusting your search query.`
              : "Launch your first promotional coupon to drive store purchases and delight pet owners."
          }
          action={
            <Button onClick={handleOpenCreate} className="rounded-xl gap-2">
              <Plus className="h-4 w-4" />
              Create Promo Code
            </Button>
          }
        />
      ) : (
        <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-2xs">
          <DataTable
            columns={columns}
            data={promoCodes}
            getRowKey={(p) => p.id}
          />
        </div>
      )}

      {/* Add / Edit Promo Code Form Modal */}
      <PromoCodeFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        promoCode={editingPromoCode}
        onSubmit={handleSavePromoCode}
        loading={isCreating || isUpdating}
      />

      {/* Delete Promo Code Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deletingPromoCode)}
        onOpenChange={(open) => !open && setDeletingPromoCode(null)}
        title={`Delete promo code "${deletingPromoCode?.code}"?`}
        description="Are you sure you want to delete this promo code? Customers will no longer be able to apply or redeem this discount during checkout."
        confirmLabel="Yes, Delete Promo Code"
        variant="destructive"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
