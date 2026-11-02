import React from "react";
import type { Metadata } from "next";
import { ProductDetailClient } from "./product-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Product Details - PawConnect Shop`,
    description: `Order verified in-house pet essentials directly from PawConnect. ID: ${id}`,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <ProductDetailClient productId={id} />;
}
