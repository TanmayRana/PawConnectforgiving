import type { Metadata } from "next";
import { CustomerTopbar } from "@/components/customer/customer-topbar";

export const metadata: Metadata = {
  title: "Pet Parent Portal - PawConnect",
  description:
    "Manage your pets, schedule veterinary appointments, book grooming spa sessions, and organize positive training programs.",
};

import { RoleGuard } from "@/components/shared/role-guard";

export default function CustomerAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <CustomerTopbar />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <RoleGuard>{children}</RoleGuard>
      </main>
    </div>
  );
}
