"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  useProduct,
  useOrders,
  useProductReviews,
  useAddProductReview,
} from "@/lib/api/hooks";
import { useGlobalCart } from "@/providers/CartProvider";
import { checkReviewEligibility } from "@/lib/api/reviews";
import { formatMoney } from "@/lib/utils/money";
import { PageHeader } from "@/components/shared/page-header";
import { RatingStars } from "@/components/shared/rating-stars";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/lib/utils/toast";
import { LoadingState, ErrorState } from "@/components/shared/states";
import { ProductImageGallery } from "@/components/shop/product-image-gallery";
import { ProductQuantity } from "@/components/shop/product-quantity";
import { ProductReviewModal } from "@/components/shop/product-review-modal";
import {
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  HeartHandshake,
  CheckCircle2,
  AlertCircle,
  Star,
  MessageSquarePlus,
} from "lucide-react";

interface ProductDetailClientProps {
  productId: string;
}

export function ProductDetailClient({ productId }: ProductDetailClientProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const { data: product, isLoading, isError, refetch } = useProduct(productId);
  const { data: orders = [] } = useOrders();
  const { data: reviews = [] } = useProductReviews(productId);
  const { addToCart, getItemQuantity } = useGlobalCart();
  const inCartQty = getItemQuantity(product?.id || productId);
  const { mutateAsync: addReview, isPending: isSubmittingReview } =
    useAddProductReview();

  if (isLoading) {
    return (
      <div className="py-8">
        <LoadingState variant="detail" message="Loading product details..." />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="py-12">
        <ErrorState
          title="Product Not Found"
          description="We couldn't locate this in-house item in our inventory catalog."
          action={
            <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
              Retry
            </Button>
          }
        />
        <div className="text-center mt-6">
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/app/shop/products">Browse Catalog</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stockStatus === "out-of-stock" || product.stockQuantity === 0;
  const isLowStock = product.stockStatus === "low-stock";
  const maxAvailable = Math.max(1, product.stockQuantity || product.stock);
  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  // Review eligibility check: user must have a delivered order containing this product
  const { isEligible: canReview } = checkReviewEligibility(product.id, orders);

  const handleAddToCart = async () => {
    if (isOutOfStock || !product) return;
    setIsAdding(true);
    try {
      await addToCart(product, quantity);
      toast.success(`${product.name} added to cart`);
    } catch {
      toast.error("Error", {
        description: "Could not add item to cart.",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleReviewSubmit = async (formData: { rating: number; comment: string }) => {
    try {
      await addReview({
        productId: product.id,
        authorName: "PawConnect Pet Parent",
        rating: formData.rating,
        comment: formData.comment,
      });
      setReviewModalOpen(false);
      toast.success("Review Submitted", {
        description: "Thank you for sharing your feedback on this in-house product!",
      });
    } catch {
      toast.error("Error submitting review", {
        description: "Please try again later.",
      });
    }
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Breadcrumb Header */}
      <PageHeader
        title={product.name}
        description={`PawConnect In-House ${product.category} • Certified for ${product.petType || "all pets"}`}
      />

      {/* Main Product Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Gallery Column */}
        <div className="lg:col-span-6">
          <ProductImageGallery
            images={product.images}
            productName={product.name}
          />
        </div>

        {/* Product Details & Actions Column */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            {/* Badges Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="font-semibold text-xs rounded-full px-3 py-0.5">
                {product.category}
              </Badge>
              {product.featured && (
                <Badge className="bg-cream text-cream-foreground font-semibold text-xs border border-cream-border">
                  <Sparkles className="h-3 w-3 mr-1 text-primary" />
                  Staff Pick
                </Badge>
              )}
              {isOutOfStock ? (
                <Badge variant="destructive" className="font-semibold text-xs">
                  Out of Stock
                </Badge>
              ) : isLowStock ? (
                <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-xs">
                  Only {product.stockQuantity || product.stock} Left
                </Badge>
              ) : (
                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                  In Stock ({product.stockQuantity || product.stock} available)
                </Badge>
              )}
            </div>

            {/* Title & Rating */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {product.name}
              </h1>

              <div className="flex items-center gap-3 mt-2.5">
                <RatingStars rating={product.rating} max={5} size="sm" />
                <span className="text-sm font-bold text-foreground">
                  {product.rating.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({product.reviewCount + reviews.length} customer reviews)
                </span>
              </div>
            </div>

            {/* Price section */}
            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-3xl font-black text-foreground">
                {formatMoney(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatMoney(product.originalPrice)}
                  </span>
                  <Badge variant="destructive" className="rounded-full font-bold text-xs">
                    Save {discountPercent}%
                  </Badge>
                </>
              )}
            </div>

            {/* Short Description */}
            <p className="text-sm text-muted-foreground leading-relaxed pt-1">
              {product.description}
            </p>

            <Separator />

            {/* Highlights List */}
            {product.highlights && product.highlights.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Key Formulation & Benefits
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {product.highlights.map((h, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs text-foreground font-medium"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Purchasing / Quantity Controls */}
            <div className="pt-4 space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Quantity:
                  </span>
                  <ProductQuantity
                    quantity={quantity}
                    max={maxAvailable}
                    min={1}
                    onChange={setQuantity}
                    disabled={isOutOfStock}
                    size="md"
                  />
                </div>

                <Button
                  size="lg"
                  className="flex-1 rounded-2xl h-12 font-bold shadow-xs text-sm gap-2"
                  disabled={isOutOfStock || isAdding}
                  onClick={handleAddToCart}
                >
                  <ShoppingBag className="h-4 w-4" />
                  {isOutOfStock
                    ? "Out of Stock"
                    : inCartQty > 0
                    ? `Add More (${inCartQty} in cart)`
                    : "Add to Cart"}
                </Button>
              </div>

              {isOutOfStock && (
                <p className="text-xs text-destructive flex items-center gap-1.5 font-medium">
                  <AlertCircle className="h-3.5 w-3.5" />
                  This item is currently awaiting warehouse replenishment.
                </p>
              )}
            </div>
          </div>

          {/* In-House PawConnect Guarantee Card */}
          <div className="rounded-2xl border border-border/80 bg-secondary/40 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              <HeartHandshake className="h-4 w-4" />
              <span>PawConnect Direct Guarantee</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>100% In-House Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-sky-600 shrink-0" />
                <span>Free delivery over ₹500</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-amber-600 shrink-0" />
                <span>30-Day Happiness Guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications & Detailed Info */}
      {product.specifications && Object.keys(product.specifications).length > 0 && (
        <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-foreground">
            Product Specifications
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            {Object.entries(product.specifications).map(([key, val]) => (
              <div
                key={key}
                className="rounded-xl border border-border/60 bg-surface/50 p-3.5"
              >
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {key}
                </div>
                <div className="text-xs font-bold text-foreground mt-1">
                  {String(val)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customer Reviews Section */}
      <section className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              Customer Reviews ({reviews.length})
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Verified feedback from pet owners who purchased this item.
            </p>
          </div>

          {canReview ? (
            <Button
              onClick={() => setReviewModalOpen(true)}
              className="rounded-xl font-semibold gap-1.5 text-xs h-10"
            >
              <MessageSquarePlus className="h-4 w-4" />
              Write a Review
            </Button>
          ) : (
            <div className="text-xs text-muted-foreground bg-muted/40 rounded-xl px-3.5 py-2 border border-border/60">
              Only verified purchasers with delivered orders can review this product.
            </div>
          )}
        </div>

        {reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center space-y-2">
            <Star className="h-8 w-8 text-muted-foreground/40 mx-auto" />
            <p className="text-sm font-medium text-foreground">
              No reviews yet for this product
            </p>
            <p className="text-xs text-muted-foreground">
              Delivered customers will be invited to leave the first verified rating.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="rounded-2xl border border-border/70 bg-card p-5 space-y-3 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-foreground">
                      {rev.authorName}
                    </span>
                    {rev.verifiedPurchase && (
                      <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified Purchase
                      </Badge>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {rev.createdAt}
                  </span>
                </div>

                <RatingStars rating={rev.rating} max={5} size="sm" />

                <p className="text-xs text-muted-foreground leading-relaxed">
                  &ldquo;{rev.comment}&rdquo;
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal for Writing a Review */}
      <ProductReviewModal
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        productName={product.name}
        onSubmit={handleReviewSubmit}
        isSubmitting={isSubmittingReview}
      />
    </div>
  );
}
