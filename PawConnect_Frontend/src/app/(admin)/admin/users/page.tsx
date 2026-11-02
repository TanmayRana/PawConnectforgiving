import type { Metadata } from "next";
import { AdminUsersClient } from "./admin-users-client";

export const metadata: Metadata = {
  title: "User Management - Admin Portal",
  description: "Oversee registered pet owners, clinical veterinarians, service providers, and administrative staff.",
};

export default function AdminUsersPage() {
  return <AdminUsersClient />;
}
