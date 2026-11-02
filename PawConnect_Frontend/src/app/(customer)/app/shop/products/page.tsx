import { Suspense } from "react";
import type { Metadata } from "next";
import { ProductsClient } from "./products-client";
import { LoadingState } from "@/components/shared/states";

export const metadata: Metadata = {
  title: "Pet Products Catalog - PawConnect In-House Shop",
  description:
    "Browse premium veterinarian-verified foods, toys, accessories, and grooming essentials for dogs and cats.",
};

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-6">
          <LoadingState variant="cards" count={8} columns={4} />
        </div>
      }
    >
      <ProductsClient />
    </Suspense>
  );
}
