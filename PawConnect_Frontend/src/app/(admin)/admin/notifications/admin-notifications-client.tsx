"use client";

import React, { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useAdminNotifications,
  useCreateAdminNotification,
  useResendAdminNotification,
  useDeleteAdminNotification,
} from "@/lib/api/hooks";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FormModal } from "@/components/shared/form-shells";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LoadingState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/utils/toast";
import {
  Bell,
  Plus,
  RotateCw,
  Trash2,
  Users,
} from "lucide-react";
import type { AdminNotificationItem } from "@/lib/mock/admin";

const notifSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  audience: z.enum(["all", "pet_owners", "veterinarians", "service_providers"]),
  type: z.enum(["system", "maintenance", "announcement", "alert"]),
});

type NotifFormData = z.infer<typeof notifSchema>;

export function AdminNotificationsClient() {
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const { data: notifications = [], isLoading, isError, refetch } = useAdminNotifications();
  const { mutateAsync: createNotif, isPending: isCreating } = useCreateAdminNotification();
  const { mutateAsync: resendNotif, isPending: isResending } = useResendAdminNotification();
  const { mutateAsync: deleteNotif, isPending: isDeleting } = useDeleteAdminNotification();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<NotifFormData>({
    resolver: zodResolver(notifSchema),
    defaultValues: {
      title: "",
      message: "",
      audience: "all",
      type: "announcement",
    },
  });

  const audienceValue = useWatch({ control, name: "audience" });
  const typeValue = useWatch({ control, name: "type" });

  const handleCreate = async (values: NotifFormData) => {
    try {
      await createNotif(values);
      toast.success("Broadcast Dispatched", {
        description: `Alert sent to target audience [${values.audience}].`,
      });
      reset();
      setModalOpen(false);
    } catch {
      toast.error("Dispatch Failed", {
        description: "Unable to deliver broadcast announcement. Please try again.",
      });
    }
  };

  const handleResend = async (id: string, title: string) => {
    try {
      await resendNotif(id);
      toast.success("Broadcast Resent", {
        description: `Re-dispatched "${title}" to target audience.`,
      });
    } catch {
      toast.error("Resend Failed", {
        description: "Unable to re-dispatch broadcast notification.",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteNotif(deleteTargetId);
      toast.success("Notification Removed", {
        description: "Broadcast announcement and linked notifications deleted.",
      });
      setDeleteTargetId(null);
    } catch {
      toast.error("Delete Failed", {
        description: "Unable to remove broadcast record.",
      });
    }
  };

  const audienceLabelMap: Record<string, string> = {
    all: "All Platform Members",
    pet_owners: "Pet Owners Only",
    veterinarians: "Licensed Veterinarians",
    service_providers: "Service Providers",
  };

  const columns: Column<AdminNotificationItem>[] = [
    {
      key: "notification",
      header: "Title & Message Content",
      render: (n) => (
        <div className="space-y-1 max-w-md">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground text-xs">{n.title}</span>
            <Badge variant="outline" className="text-[9px] capitalize py-0 px-1.5">
              {n.type}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {n.message}
          </p>
        </div>
      ),
    },
    {
      key: "audience",
      header: "Target Audience",
      render: (n) => (
        <div className="flex flex-col gap-1 items-start">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-primary" />
            {audienceLabelMap[n.audience] || n.audience}
          </span>
          {typeof n.recipientCount === "number" && (
            <Badge variant="secondary" className="text-[10px] font-medium py-0 px-1.5 text-muted-foreground">
              {n.recipientCount} {n.recipientCount === 1 ? "recipient" : "recipients"}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Dispatch Status",
      render: (n) => (
        <Badge
          variant="outline"
          className={`text-[10px] font-semibold capitalize ${
            n.status === "sent"
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
              : "bg-secondary text-muted-foreground"
          }`}
        >
          {n.status}
        </Badge>
      ),
    },
    {
      key: "date",
      header: "Sent Timestamp",
      render: (n) => (
        <span className="text-xs text-muted-foreground font-mono">
          {new Date(n.sentAt || n.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (n) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleResend(n.id, n.title)}
            disabled={isResending}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
            title="Resend Broadcast"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteTargetId(n.id)}
            disabled={isDeleting}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Delete Notification"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="py-6">
        <LoadingState variant="table" count={6} message="Loading platform broadcast notifications..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12">
        <ErrorState
          title="Could not load notifications"
          description="Failed to load notification history."
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
        title="Broadcast Notifications"
        description="Transmit platform-wide advisories, scheduled maintenance windows, and clinical updates directly to user apps."
      >
        <Button onClick={() => setModalOpen(true)} size="sm" className="rounded-xl text-xs font-semibold h-9 gap-1.5">
          <Plus className="h-4 w-4" />
          New Announcement
        </Button>
      </PageHeader>

      {/* Notifications DataTable */}
      <DataTable
        columns={columns}
        data={notifications}
        keyExtractor={(n) => n.id}
        emptyTitle="No broadcast notifications sent"
        emptyDescription="Create an announcement to dispatch alerts to pet parents or practitioners."
        emptyIcon={<Bell className="h-8 w-8 text-muted-foreground" />}
      />

      {/* Broadcast Creation Modal */}
      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Compose Platform Broadcast"
        description="Notify specific user groups or the entire PawConnect ecosystem."
        onSubmit={handleSubmit(handleCreate)}
        loading={isCreating}
        submitLabel="Send Broadcast Now"
        size="default"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Announcement Headline</label>
            <Input
              {...register("title")}
              placeholder="e.g. Seasonal Tick & Heartworm Prevention Advisory"
              className="rounded-xl h-10 text-xs"
            />
            {errors.title && (
              <p className="text-[11px] text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Target Recipient Audience</label>
              <Select
                value={audienceValue}
                onValueChange={(val: NotifFormData["audience"]) => setValue("audience", val)}
              >
                <SelectTrigger className="rounded-xl h-10 text-xs">
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Registered Users</SelectItem>
                  <SelectItem value="pet_owners">Pet Owners Only</SelectItem>
                  <SelectItem value="veterinarians">Veterinarians Only</SelectItem>
                  <SelectItem value="service_providers">Service Providers Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Alert Type</label>
              <Select
                value={typeValue}
                onValueChange={(val: NotifFormData["type"]) => setValue("type", val)}
              >
                <SelectTrigger className="rounded-xl h-10 text-xs">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="announcement">General Announcement</SelectItem>
                  <SelectItem value="maintenance">System Maintenance</SelectItem>
                  <SelectItem value="system">Feature Update</SelectItem>
                  <SelectItem value="alert">Priority Clinical Advisory</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Notification Message</label>
            <Textarea
              {...register("message")}
              placeholder="Provide context and recommendations for the pet community..."
              rows={3.5}
              className="rounded-xl text-xs resize-none"
            />
            {errors.message && (
              <p className="text-[11px] text-destructive">{errors.message.message}</p>
            )}
          </div>
        </div>
      </FormModal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        title="Delete Broadcast Notification"
        description="Are you sure you want to delete this broadcast announcement? This will remove the announcement record and linked system notifications."
        confirmLabel="Delete Broadcast"
        cancelLabel="Keep Announcement"
        variant="destructive"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
