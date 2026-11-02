import type { Metadata } from "next";
import { AdminSettingsClient } from "./admin-settings-client";

export const metadata: Metadata = {
  title: "Platform Settings - Admin Portal",
  description: "Configure operating contacts, clinical booking cancellation buffers, and fulfillment policies.",
};

export default function AdminSettingsPage() {
  return <AdminSettingsClient />;
}
