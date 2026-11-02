import type { Metadata } from "next";
import { AdminNotificationsClient } from "./admin-notifications-client";

export const metadata: Metadata = {
  title: "Broadcast Notifications - Admin Portal",
  description: "Dispatch platform announcements, maintenance notices, and emergency clinical alerts to users.",
};

export default function AdminNotificationsPage() {
  return <AdminNotificationsClient />;
}
