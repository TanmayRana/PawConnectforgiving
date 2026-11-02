"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RatingStars } from "./rating-stars";
import { SafeImage } from "./safe-image";
import { ShoppingBag, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGlobalCart } from "@/providers/CartProvider";
import { toast } from "@/lib/utils/toast";
import type { ProductItem } from "@/lib/mock/data";

interface ProductCardProps {
  product: ProductItem;
  href?: string;
  onAddToCart?: (product: ProductItem) => void;
  className?: string;
}

const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&auto=format&fit=crop&q=80";

export function ProductCard({
  product,
  href,
  onAddToCart,
  className,
}: ProductCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const { getItemQuantity, addToCart, increment, decrement } = useGlobalCart();
  const [isUpdating, setIsUpdating] = React.useState(false);

  const effectiveQty = getItemQuantity(product.id);

  const maxStock =
    (product as { stockQuantity?: number }).stockQuantity ??
    product.stock ??
    50;

  const isOutOfStock =
    (product.stock !== undefined && product.stock <= 0) ||
    (product as { stockStatus?: string }).stockStatus === "out-of-stock" ||
    maxStock <= 0;

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || isUpdating) return;

    setIsUpdating(true);
    try {
      await addToCart(product, 1);
      onAddToCart?.(product);
    } catch {
      toast.error("Could not add to cart", {
        description: "Please check your network and try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleIncrement = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUpdating) return;

    if (effectiveQty >= maxStock) {
      toast.warning(`Maximum stock reached`, {
        description: `Only ${maxStock} items available in stock.`,
      });
      return;
    }

    setIsUpdating(true);
    try {
      await increment(product.id, maxStock, product);
    } catch {
      toast.error("Could not update quantity");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDecrement = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      await decrement(product.id);
    } catch {
      toast.error("Could not update quantity");
    } finally {
      setIsUpdating(false);
    }
  };

  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  const targetHref = href ?? `/app/shop/products/${product.id}`;
  const productImage =
    product.images?.[0] ||
    (product as { image?: string }).image ||
    FALLBACK_PRODUCT_IMAGE;

  return (
    <motion.div
      whileHover={shouldReduceMotion ? undefined : { y: -6, scale: 1.012 }}
      transition={{ duration: 0.25, ease: [0.215, 0.61, 0.355, 1] }}
      className={cn(
        "group relative flex h-full flex-col justify-between overflow-hidden rounded-[28px] border border-border/70 bg-card p-5 shadow-xs transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:will-change-transform",
        className
      )}
    >
      <div className="flex flex-col flex-1">
        {/* Product Image + Badges */}
        <div className="relative mb-4 h-52 w-full overflow-hidden rounded-2xl bg-surface dark:bg-muted/40 shrink-0">
          <Link href={targetHref} className="relative block w-full h-full">
            <SafeImage
              src={productImage}
              fallbackSrc={FALLBACK_PRODUCT_IMAGE}
              alt={product.name || "Pet Product"}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          </Link>

          {/* Top badges */}
          <div className="absolute left-3 top-3 flex flex-col gap-1 z-10">
            <Badge variant="secondary" size="sm" className="bg-background/90 shadow-xs backdrop-blur-sm">
              {product.category || "General Care"}
            </Badge>
            {product.badge && (
              <Badge variant="default" size="sm" className="bg-primary text-primary-foreground shadow-xs">
                {product.badge}
              </Badge>
            )}
          </div>

          {discountPercent && discountPercent > 0 && discountPercent < 100 && (
            <div className="absolute right-3 top-3 z-10 rounded-full bg-destructive px-2 py-0.5 text-[11px] font-bold text-white shadow-xs">
              -{discountPercent}%
            </div>
          )}

          {/* In-House Guarantee Tag */}
          <div className="absolute bottom-2.5 left-3 z-10 rounded-full bg-cream/95 px-2.5 py-0.5 text-[10px] font-semibold text-cream-foreground shadow-xs backdrop-blur-sm border border-cream-border/60">
            PawConnect In-House
          </div>
        </div>

        {/* Product Details */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <RatingStars rating={product.rating} reviewCount={product.reviewCount} size="sm" />
            <span
              className={cn(
                "text-[11px] font-medium",
                isOutOfStock
                  ? "text-destructive font-semibold"
                  : product.stock > 10
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400 font-semibold"
              )}
            >
              {isOutOfStock
                ? "Out of Stock"
                : product.stock > 10
                ? "In Stock"
                : `Only ${product.stock} left`}
            </span>
          </div>

          <Link
            href={targetHref}
            className="no-underline hover:no-underline focus:no-underline group-hover:no-underline block"
            style={{ textDecoration: "none" }}
          >
            <h3 className="text-base font-bold text-foreground line-clamp-2 leading-snug transition-colors group-hover:text-primary min-h-[2.5rem] no-underline">
              {product.name}
            </h3>
          </Link>

          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground min-h-[2rem]">
            {product.description || "PawConnect verified premium pet supply."}
          </p>
        </div>
      </div>

      {/* Pricing & Add to Cart */}
      <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-4">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-extrabold text-foreground">
            ₹{product.price.toFixed(2)}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-xs text-muted-foreground line-through">
              ₹{product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {isOutOfStock ? (
          <Button
            size="sm"
            disabled
            variant="outline"
            className="rounded-full px-3.5 text-xs text-muted-foreground"
            aria-label={`${product.name} is out of stock`}
          >
            <span>Unavailable</span>
          </Button>
        ) : effectiveQty > 0 ? (
          <div
            className={cn(
              "inline-flex h-9 items-center justify-between rounded-full bg-primary text-primary-foreground shadow-xs px-1 min-w-[104px] border border-primary/20 select-none transition-opacity",
              isUpdating && "opacity-80 pointer-events-none"
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <button
              type="button"
              disabled={isUpdating}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDecrement(e);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full text-primary-foreground transition-all duration-150 hover:bg-black/15 dark:hover:bg-white/20 active:scale-90 disabled:opacity-40"
              aria-label={`Decrease quantity of ${product.name}`}
            >
              <Minus className="h-3.5 w-3.5 stroke-[2.5]" />
            </button>

            <span
              className="px-1 text-xs font-extrabold tabular-nums text-primary-foreground min-w-[1.25rem] text-center"
              aria-live="polite"
            >
              {effectiveQty}
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleIncrement(e);
              }}
              disabled={isUpdating || effectiveQty >= maxStock}
              className="flex h-7 w-7 items-center justify-center rounded-full text-primary-foreground transition-all duration-150 hover:bg-black/15 dark:hover:bg-white/20 active:scale-90 disabled:opacity-40 disabled:hover:bg-transparent"
              aria-label={`Increase quantity of ${product.name}`}
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            </button>
          </div>
        ) : (
          <Button
            size="sm"
            type="button"
            disabled={isUpdating}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAdd(e);
            }}
            variant="primary"
            className="rounded-full px-3.5 transition-[background-color,color,transform] active:scale-95 group/btn motion-reduce:transition-none disabled:opacity-60"
            aria-label={`Add ${product.name} to cart`}
          >
            <span className="flex items-center">
              <ShoppingBag className="mr-1.5 h-3.5 w-3.5 transition-transform duration-200 group-hover/btn:-translate-y-0.5" />
              <span>{isUpdating ? "Adding..." : "Add"}</span>
            </span>
          </Button>
        )}
      </div>
    </motion.div>
  );
}
