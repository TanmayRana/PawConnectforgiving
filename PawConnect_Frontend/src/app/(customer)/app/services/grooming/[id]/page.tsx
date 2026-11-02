import type { Metadata } from "next";
import { GroomingDetailClient } from "./grooming-detail-client";

interface GroomingDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: GroomingDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Grooming Salon Details | PawConnect`,
    description: `Book grooming and spa services for pet provider ${id} on PawConnect.`,
  };
}

export default async function GroomingDetailPage({ params }: GroomingDetailPageProps) {
  const { id } = await params;
  return <GroomingDetailClient id={id} />;
}
