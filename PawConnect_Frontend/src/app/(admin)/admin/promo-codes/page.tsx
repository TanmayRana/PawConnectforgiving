import type { Metadata } from "next";
import { AdminPromoCodesClient } from "./admin-promo-codes-client";

export const metadata: Metadata = {
  title: "Promo Codes & Discounts - Admin Portal",
  description:
    "Manage promo codes, discount percentages, order minimums, and usage limits across PawConnect.",
};

export default function AdminPromoCodesPage() {
  return <AdminPromoCodesClient />;
}
