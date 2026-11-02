import React from "react";
import { ProductCard } from "@/components/shared/product-card";
import { EmptyState } from "@/components/shared/states";
import { Search } from "lucide-react";
import type { ProductItem } from "@/lib/mock/data";

interface ProductGridProps {
  products: ProductItem[];
  onAddToCart?: (product: ProductItem) => void;
  className?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function ProductGrid({
  products,
  onAddToCart,
  className = "",
  emptyTitle = "No products found",
  emptyDescription = "Try adjusting your search terms or filter criteria.",
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={<Search className="h-8 w-8 text-muted-foreground" />}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          href={`/app/shop/products/${product.id}`}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
}
