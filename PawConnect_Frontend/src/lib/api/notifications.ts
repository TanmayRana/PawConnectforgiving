/**
 * Persistent Notifications API
 * Connects to Spring Boot /api/me/notifications endpoints.
 */

import { apiGet, apiPatch, apiDelete, type PageResponse } from "./client";
import type { NotificationItem } from "@/lib/mock/notifications";

export type { NotificationItem };

export interface BackendNotification {
  id: number;
  userId: number;
  notificationType: string;
  dedupeKey?: string;
  title: string;
  message: string;
  referenceType?: string;
  referenceId?: number;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return "Just now";
  const date = new Date(dateStr);
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

export function mapBackendNotificationToUi(n: BackendNotification): NotificationItem {
  const typeStr = n.notificationType?.toLowerCase() || "";
  const notifType: NotificationItem["type"] =
    typeStr.includes("book") || typeStr.includes("appoint")
      ? "booking"
      : typeStr.includes("order")
      ? "order"
      : typeStr.includes("health") || typeStr.includes("vaccin")
      ? "health"
      : "system";

  let link: string | undefined;
  if (n.referenceType === "APPOINTMENT" || n.referenceType === "BOOKING") {
    link = `/app/bookings/${n.referenceId || ""}`;
  } else if (n.referenceType === "ORDER") {
    link = `/app/orders/${n.referenceId || ""}`;
  } else if (n.referenceType === "PET") {
    link = `/app/pets/${n.referenceId || ""}`;
  }

  return {
    id: String(n.id),
    title: n.title,
    message: n.message,
    time: formatRelativeTime(n.createdAt),
    read: Boolean(n.isRead),
    link,
    type: notifType,
    createdAt: n.createdAt,
  };
}

export async function fetchNotifications(unreadOnly = false): Promise<NotificationItem[]> {
  try {
    const res = await apiGet<PageResponse<BackendNotification>>("/me/notifications", {
      params: { unreadOnly, size: 50, sort: "createdAt,desc" },
    });
    const items = (res?.content || []).map(mapBackendNotificationToUi);
    // Explicitly guarantee latest message first
    return items.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (timeB !== timeA) return timeB - timeA;
      return Number(b.id) - Number(a.id);
    });
  } catch {
    return [];
  }
}

export async function fetchUnreadCount(): Promise<number> {
  try {
    const res = await apiGet<{ unreadCount: number }>("/me/notifications/unread-count");
    return Number(res?.unreadCount || 0);
  } catch {
    return 0;
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  const numericId = Number(id.replace(/\D/g, ""));
  if (!isNaN(numericId) && numericId > 0) {
    await apiPatch<BackendNotification>(`/me/notifications/${numericId}/read`, {});
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiPatch<void>("/me/notifications/read-all", {});
}

export async function deleteNotification(id: string): Promise<void> {
  const numericId = Number(id.replace(/\D/g, ""));
  if (!isNaN(numericId) && numericId > 0) {
    await apiDelete<void>(`/me/notifications/${numericId}`);
  }
}
