import type { Metadata } from "next";
import { ShopHomeClient } from "./shop-home-client";

export const metadata: Metadata = {
  title: "In-House Pet Shop - PawConnect",
  description:
    "Explore veterinarian-approved diets, enrichment toys, accessories, and grooming essentials guaranteed in-house by PawConnect.",
};

export default function ShopHomePage() {
  return <ShopHomeClient />;
}
