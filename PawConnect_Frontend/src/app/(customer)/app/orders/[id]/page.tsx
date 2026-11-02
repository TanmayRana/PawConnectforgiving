import React from "react";
import type { Metadata } from "next";
import { OrderDetailClient } from "./order-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Order Details & Tracking - PawConnect",
  description: "Track shipment progress, view order receipt, and rate items delivered from PawConnect.",
};

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <OrderDetailClient orderId={id} />;
}
