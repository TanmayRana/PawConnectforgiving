"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusVariant =
  | "success"
  | "warning"
  | "pending"
  | "error"
  | "neutral"
  | "info"
  | "default";

type StatusConfig = {
  label: string;
  variant: StatusVariant;
};

const STATUS_MAP: Record<string, StatusConfig> = {
  // Order statuses
  confirmed: { label: "Confirmed", variant: "success" },
  packed: { label: "Packed", variant: "info" },
  shipped: { label: "Shipped", variant: "pending" },
  delivered: { label: "Delivered", variant: "success" },
  cancelled: { label: "Cancelled", variant: "error" },
  // Booking statuses
  scheduled: { label: "Scheduled", variant: "pending" },
  completed: { label: "Completed", variant: "success" },
  "no-show": { label: "No Show", variant: "warning" },
  // Payment statuses
  pending: { label: "Pending", variant: "warning" },
  processing: { label: "Processing", variant: "info" },
  success: { label: "Success", variant: "success" },
  paid: { label: "Paid", variant: "success" },
  refunded: { label: "Refunded", variant: "info" },
  created: { label: "Created", variant: "neutral" },
  captured: { label: "Captured", variant: "success" },
  failed: { label: "Failed", variant: "error" },
  // User statuses
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "neutral" },
  suspended: { label: "Suspended", variant: "error" },
  verified: { label: "Verified", variant: "success" },
  unverified: { label: "Unverified", variant: "warning" },
  "in-progress": { label: "In Progress", variant: "info" },
  rejected: { label: "Rejected", variant: "error" },
  blocked: { label: "Blocked", variant: "error" },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
  children?: React.ReactNode;
}

export function StatusBadge({
  status,
  className,
  size = "md",
  label,
  children,
}: StatusBadgeProps) {
  const normalized = status.toLowerCase().replace(/\s+/g, "-");
  const config = STATUS_MAP[normalized] ?? {
    label: status,
    variant: "neutral" as StatusVariant,
  };

  return (
    <Badge
      variant={config.variant as StatusVariant}
      size={size}
      className={cn("capitalize", className)}
    >
      {children ?? label ?? config.label}
    </Badge>
  );
}
