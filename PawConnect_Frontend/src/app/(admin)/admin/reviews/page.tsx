import type { Metadata } from "next";
import { AdminReviewsClient } from "./admin-reviews-client";

export const metadata: Metadata = {
  title: "Review Moderation - Admin Portal",
  description: "Audit customer product ratings, service testimonials, spam flags, and community guidelines.",
};

export default function AdminReviewsPage() {
  return <AdminReviewsClient />;
}
