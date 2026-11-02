import type { Metadata } from "next";
import { AdminBookingsClient } from "./admin-bookings-client";

export const metadata: Metadata = {
  title: "Global Bookings Management - Admin Portal",
  description: "Unified oversight of clinical appointments, grooming treatments, and canine training programs.",
};

export default function AdminBookingsPage() {
  return <AdminBookingsClient />;
}
