import type { Metadata } from "next";
import { AdminProductsClient } from "./admin-products-client";

export const metadata: Metadata = {
  title: "In-House Products - Admin Portal",
  description: "Centralized inventory, pricing, and catalog control for in-house PawConnect pet essentials.",
};

export default function AdminProductsPage() {
  return <AdminProductsClient />;
}
