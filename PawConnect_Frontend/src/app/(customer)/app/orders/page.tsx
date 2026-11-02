import type { Metadata } from "next";
import { OrdersClient } from "./orders-client";

export const metadata: Metadata = {
  title: "My Orders - PawConnect Pet Shop",
  description: "Track and manage your in-house PawConnect pet food, toy, and care orders.",
};

export default function OrdersPage() {
  return <OrdersClient />;
}
