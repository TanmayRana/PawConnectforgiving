"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  useAdminUsers,
  useCreateAdminUser,
  useUpdateAdminUser,
  useToggleUserBlockStatus,
} from "@/lib/api/hooks";
import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserFormModal, type UserFormData } from "@/components/admin/user-form-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState } from "@/components/shared/states";
import { RefreshIndicator } from "@/components/ui/paw-spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/lib/utils/toast";
import {
  Plus,
  Edit2,
  Ban,
  CheckCircle,
  Users,
} from "lucide-react";
import type { AdminUser, PlatformRole } from "@/lib/mock/admin";

type RoleFilter = "all" | PlatformRole;

export function AdminUsersClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [blockingUser, setBlockingUser] = useState<AdminUser | null>(null);

  const { data: users = [], isLoading, isFetching, isError, refetch } = useAdminUsers();
  const { mutateAsync: createUser, isPending: isCreating } = useCreateAdminUser();
  const { mutateAsync: updateUser, isPending: isUpdating } = useUpdateAdminUser();
  const { mutateAsync: toggleBlock, isPending: isTogglingBlock } = useToggleUserBlockStatus();

  const filteredUsers = useMemo(() => {
    let result = [...users];

    if (roleFilter !== "all") {
      result = result.filter((u) => u.role === roleFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.includes(q)
      );
    }

    return result;
  }, [users, roleFilter, searchQuery]);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (user: AdminUser) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const handleFormSubmit = async (formData: UserFormData) => {
    try {
      if (editingUser) {
        await updateUser({ id: editingUser.id, input: formData });
        toast.success("User Updated", {
          description: `Account credentials for ${formData.name} updated.`,
        });
      } else {
        await createUser(formData);
        toast.success("User Created", {
          description: `Account created for ${formData.email}. An automatic password has been generated and sent to their email.`,
        });
      }
    } catch (err) {
      toast.error("Operation Failed", {
        description: "Could not save user data. Please retry.",
      });
      throw err;
    }
  };

  const handleConfirmToggleBlock = async () => {
    if (!blockingUser) return;
    try {
      await toggleBlock(blockingUser.id);
      const isBlocking = blockingUser.status === "active";
      toast.success(isBlocking ? "Account Suspended" : "Account Reactivated", {
        description: `${blockingUser.name}'s access status has been modified.`,
      });
      setBlockingUser(null);
    } catch {
      toast.error("Status Change Failed");
    }
  };

  const roleBadgeMap: Record<PlatformRole, { label: string; className: string }> = {
    pet_owner: { label: "Pet Owner", className: "bg-surface border-border text-foreground" },
    veterinarian: { label: "Veterinarian", className: "bg-primary/10 text-primary border-primary/20" },
    service_provider: { label: "Service Provider", className: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20" },
    admin: { label: "Admin", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  };

  const columns: Column<AdminUser>[] = [
    {
      key: "user",
      header: "Member Profile",
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 rounded-xl overflow-hidden bg-secondary shrink-0 border border-border">
            {u.avatar ? (
              <Image src={u.avatar} alt={u.name} fill sizes="36px" className="object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center font-bold text-xs text-primary">
                {u.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <span className="font-bold text-foreground text-xs block truncate">{u.name}</span>
            <span className="text-[11px] text-muted-foreground block truncate">{u.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "System Role",
      render: (u) => {
        const badge = roleBadgeMap[u.role];
        return (
          <Badge variant="outline" className={badge.className + " text-[10px] font-semibold"}>
            {badge.label}
          </Badge>
        );
      },
    },
    {
      key: "phone",
      header: "Contact Telephone",
      render: (u) => <span className="text-xs text-muted-foreground font-mono">{u.phone}</span>,
    },
    {
      key: "activity",
      header: "Activity / Records",
      render: (u) => (
        <span className="text-xs text-muted-foreground">
          {u.petCount} pets • {u.bookingCount} bookings
        </span>
      ),
    },
    {
      key: "status",
      header: "Access Status",
      render: (u) => (
        <StatusBadge
          status={u.status === "active" ? "confirmed" : "blocked"}
          label={u.status === "active" ? "Active" : "Blocked"}
          size="sm"
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (u) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenEdit(u)}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
            title="Edit User"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setBlockingUser(u)}
            className={`h-8 w-8 rounded-lg ${
              u.status === "active"
                ? "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                : "text-emerald-600 hover:bg-emerald-500/10"
            }`}
            title={u.status === "active" ? "Block Access" : "Unblock Access"}
          >
            {u.status === "active" ? (
              <Ban className="h-3.5 w-3.5" />
            ) : (
              <CheckCircle className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      ),
    },
  ];

  if (isError) {
    return (
      <div className="py-12">
        <ErrorState
          title="Could not load users"
          description="Encountered an issue loading member registry records."
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
        title="User & Membership Registry"
        description="Comprehensive account management, access entitlement governance, and profile administration."
      >
        <div className="flex items-center gap-3">
          <RefreshIndicator isRefreshing={isFetching && !isLoading} label="Refreshing..." />
          <Button onClick={handleOpenCreate} size="sm" className="rounded-xl text-xs font-semibold h-9 gap-1.5">
            <Plus className="h-4 w-4" />
            Register User
          </Button>
        </div>
      </PageHeader>

      {/* Filter Tabs by Role */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs
          value={roleFilter}
          onValueChange={(val) => setRoleFilter(val as RoleFilter)}
          className="w-full sm:w-auto"
        >
          <TabsList className="bg-secondary/60 p-1 rounded-2xl h-10">
            <TabsTrigger value="all" className="rounded-xl text-xs px-3">
              All Users ({users.length})
            </TabsTrigger>
            <TabsTrigger value="pet_owner" className="rounded-xl text-xs px-3">
              Pet Owners
            </TabsTrigger>
            <TabsTrigger value="veterinarian" className="rounded-xl text-xs px-3">
              Veterinarians
            </TabsTrigger>
            <TabsTrigger value="service_provider" className="rounded-xl text-xs px-3">
              Service Providers
            </TabsTrigger>
            <TabsTrigger value="admin" className="rounded-xl text-xs px-3">
              Admins
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search */}
        <div className="w-full sm:w-72">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by name, email, phone..."
            className="w-full"
          />
        </div>
      </div>

      {/* Users DataTable */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        keyExtractor={(u) => u.id}
        loading={isLoading}
        emptyTitle="No platform users found"
        emptyDescription="Try clearing your search query or switching active role filter tabs."
        emptyIcon={<Users className="h-8 w-8 text-muted-foreground" />}
      />

      {/* Create / Edit User Modal */}
      <UserFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        user={editingUser}
        onSubmit={handleFormSubmit}
        loading={isCreating || isUpdating}
      />

      {/* Block / Unblock Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(blockingUser)}
        onOpenChange={(op) => !op && setBlockingUser(null)}
        title={
          blockingUser?.status === "active"
            ? `Suspend access for ${blockingUser?.name}?`
            : `Reactivate account for ${blockingUser?.name}?`
        }
        description={
          blockingUser?.status === "active"
            ? "Suspended users will be prohibited from creating new bookings, placing retail orders, or modifying profiles."
            : "Reactivating this account will restore standard privileges and platform access."
        }
        confirmLabel={blockingUser?.status === "active" ? "Suspend Account" : "Reactivate Account"}
        variant={blockingUser?.status === "active" ? "destructive" : "default"}
        loading={isTogglingBlock}
        onConfirm={handleConfirmToggleBlock}
      />
    </div>
  );
}
