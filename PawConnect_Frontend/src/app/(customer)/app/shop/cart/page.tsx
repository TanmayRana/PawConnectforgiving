import type { Metadata } from "next";
import { CartClient } from "./cart-client";

export const metadata: Metadata = {
  title: "Shopping Cart - PawConnect",
  description: "Review items in your PawConnect cart and proceed to express checkout.",
};

export default function CartPage() {
  return <CartClient />;
}
