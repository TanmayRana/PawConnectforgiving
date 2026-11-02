import type { Metadata } from "next";
import { CheckoutClient } from "./checkout-client";

export const metadata: Metadata = {
  title: "Checkout - PawConnect In-House Shop",
  description: "Secure and swift checkout for in-house verified pet supplies.",
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
