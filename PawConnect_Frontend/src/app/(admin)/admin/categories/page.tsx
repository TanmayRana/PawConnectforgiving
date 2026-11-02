import type { Metadata } from "next";
import { AdminCategoriesClient } from "./admin-categories-client";

export const metadata: Metadata = {
  title: "Product Categories - Admin Portal",
  description: "Organize taxonomy, search navigation slugs, and catalog departments for storefront retail.",
};

export default function AdminCategoriesPage() {
  return <AdminCategoriesClient />;
}
