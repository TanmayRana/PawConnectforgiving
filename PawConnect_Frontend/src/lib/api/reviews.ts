import type { CustomerOrder } from "./orders";

export interface ProductReview {
  id: string;
  productId: string;
  authorName: string;
  avatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
  verifiedPurchase: boolean;
}

import { apiPost } from "./client";
import { fetchPublicReviews, type BackendPublicReview } from "./discovery";

export async function fetchReviewsByProductId(productId: string): Promise<ProductReview[]> {
  try {
    const numId = Number(productId);
    if (isNaN(numId) || numId <= 0) return [];
    const reviews = await fetchPublicReviews({ productId: numId });
    return reviews.map((r: BackendPublicReview) => ({
      id: String(r.id),
      productId: String(r.targetId ?? productId),
      authorName: r.reviewerName || "Verified Pet Owner",
      avatar: undefined,
      rating: r.rating,
      comment: r.reviewText,
      createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recent",
      verifiedPurchase: true,
    }));
  } catch (err) {
    console.warn("Failed to fetch product reviews from backend API:", err);
    return [];
  }
}

export interface AddReviewInput {
  productId: string;
  rating: number;
  comment: string;
  authorName?: string;
}

export async function addReview(input: AddReviewInput): Promise<ProductReview> {
  const targetIdNum = Number(input.productId);
  const payload = {
    rating: input.rating,
    reviewText: input.comment,
    orderItemId: isNaN(targetIdNum) ? undefined : targetIdNum,
  };

  const saved = await apiPost<BackendPublicReview>("/reviews", payload);
  return {
    id: String(saved?.id ?? Date.now()),
    productId: String(saved?.targetId ?? input.productId),
    authorName: saved?.reviewerName ?? input.authorName ?? "Customer",
    avatar: undefined,
    rating: saved?.rating ?? input.rating,
    comment: saved?.reviewText ?? input.comment,
    createdAt: "Just now",
    verifiedPurchase: true,
  };
}

/**
 * Check if the user is eligible to review a product
 * (Rule: Only eligible delivered orders qualify)
 */
export function checkReviewEligibility(
  productId: string,
  orders: CustomerOrder[]
): { isEligible: boolean; orderId?: string } {
  const matchingOrder = orders.find(
    (o) =>
      o.status === "delivered" &&
      o.items.some((item) => item.productId === productId)
  );

  return {
    isEligible: Boolean(matchingOrder),
    orderId: matchingOrder?.id,
  };
}
