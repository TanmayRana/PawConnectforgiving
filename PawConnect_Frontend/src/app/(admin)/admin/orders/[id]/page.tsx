import type { Metadata } from "next";
import { AdminOrderDetailClient } from "./admin-order-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await params;
  return {
    title: `Order #${resolved.id} - Admin Fulfillment`,
    description: "Detailed order breakdown, line item price snapshots, recipient address, and dispatch controls.",
  };
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const resolved = await params;
  return <AdminOrderDetailClient orderId={resolved.id} />;
}
