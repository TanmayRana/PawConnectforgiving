import type { Metadata } from "next";
import { ShopClient } from "./shop-client";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "In-House Pet Shop - PawConnect",
  description:
    "Shop verified in-house pet nutrition, non-toxic chew toys, ergonomic harnesses, and hypoallergenic grooming essentials.",
};

export default function ShopPage() {
  return (
    <div className="py-10 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Page Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="cream" className="text-xs">
            PawConnect In-House Supply
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            The Pet Essentials Shop
          </h1>
          <p className="font-decorative text-2xl font-bold text-primary sm:text-3xl">
            Nutritious, durable, and veterinarian-approved
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Every product in our store is directly stocked, tested, and shipped by PawConnect.
            No unverified third-party sellers, no counterfeit items—only the highest standard for your companion.
          </p>
        </div>

        {/* Interactive Shop Discovery */}
        <ShopClient />
      </div>
    </div>
  );
}
