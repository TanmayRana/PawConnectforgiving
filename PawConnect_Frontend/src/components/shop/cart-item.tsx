"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { ProductQuantity } from "./product-quantity";
import { formatMoney } from "@/lib/utils/money";
import { type CartItem as CartItemType, getProductMetaCache } from "@/lib/api/cart";

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (
    productId: string,
    quantity: number,
    cartItemId?: number
  ) => void;
  onRemove: (productId: string, cartItemId?: number) => void;
}

const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&auto=format&fit=crop&q=80";

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const metaCache = getProductMetaCache();
  const cachedMeta =
    metaCache[String(item.productId)] ||
    metaCache[String(item.productId).replace(/\D/g, "")];

  const itemImage =
    item.image && item.image.trim().length > 0 && item.image !== FALLBACK_PRODUCT_IMAGE
      ? item.image
      : cachedMeta?.image || FALLBACK_PRODUCT_IMAGE;

  const itemCategory =
    item.category && item.category.trim().length > 0 && item.category !== "Pet Supplies"
      ? item.category
      : cachedMeta?.category || "Pet Supplies";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl border border-border/80 bg-card shadow-2xs">
      {/* Product Image & Info */}
      <div className="flex items-center gap-4 min-w-0">
        <Link
          href={`/app/shop/products/${item.productId}`}
          className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-2xl border border-border/70 bg-surface dark:bg-muted/30"
        >
          <Image
            src={itemImage}
            alt={item.name}
            fill
            sizes="96px"
            className="object-cover transition-transform duration-300 hover:scale-105"
          />
        </Link>

        <div className="space-y-1 min-w-0 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
            {itemCategory}
          </span>
          <Link
            href={`/app/shop/products/${item.productId}`}
            className="block no-underline hover:no-underline"
            style={{ textDecoration: "none" }}
          >
            <h4 className="text-sm sm:text-base font-bold text-foreground truncate no-underline">
              {item.name}
            </h4>
          </Link>
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-semibold text-muted-foreground">
              {formatMoney(item.price)} each
            </span>
            {item.originalPrice && (
              <span className="text-[11px] text-muted-foreground line-through">
                {formatMoney(item.originalPrice)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Controls & Line Total */}
      <div className="flex items-center justify-between sm:justify-end gap-5 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/50">
        <ProductQuantity
          quantity={item.quantity}
          max={item.stock}
          min={1}
          onChange={(newQty) =>
            onUpdateQuantity(item.productId, newQty, item.cartItemId)
          }
          size="sm"
        />

        <div className="text-right min-w-[70px]">
          <span className="text-sm sm:text-base font-extrabold text-foreground tabular-nums">
            {formatMoney(item.lineTotal)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onRemove(item.productId, item.cartItemId)}
          className="p-1.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          aria-label={`Remove ${item.name} from cart`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
