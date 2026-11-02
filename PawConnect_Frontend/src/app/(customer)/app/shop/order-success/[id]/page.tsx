import React from "react";
import type { Metadata } from "next";
import { OrderSuccessClient } from "./order-success-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Order Confirmed - PawConnect",
  description: "Your in-house PawConnect order has been confirmed and scheduled for packing.",
};

export default async function OrderSuccessPage({ params }: PageProps) {
  const { id } = await params;
  return <OrderSuccessClient orderId={id} />;
}
