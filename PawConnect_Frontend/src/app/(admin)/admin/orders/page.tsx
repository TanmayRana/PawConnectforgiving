import type { Metadata } from "next";
import { AdminOrdersClient } from "./admin-orders-client";

export const metadata: Metadata = {
  title: "Order Fulfillment - Admin Portal",
  description: "Monitor and process customer retail purchases, dispatch status, and delivery milestones.",
};

export default function AdminOrdersPage() {
  return <AdminOrdersClient />;
}
