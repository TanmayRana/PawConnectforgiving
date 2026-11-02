import type { Metadata } from "next";
import { AdminPaymentsClient } from "./admin-payments-client";

export const metadata: Metadata = {
  title: "Payments & Ledger - Admin Portal | PawConnect",
  description:
    "Real-time financial transactions, Razorpay gateway status, HMAC verification audits, and automated refund management.",
};

export default function AdminPaymentsPage() {
  return <AdminPaymentsClient />;
}
