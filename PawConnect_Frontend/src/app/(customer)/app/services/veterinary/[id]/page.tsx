import type { Metadata } from "next";
import { VeterinarianDetailClient } from "./veterinarian-detail-client";

interface VeterinarianDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: VeterinarianDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Veterinarian Profile | PawConnect`,
    description: `Book clinical consultations with specialist ${id} on PawConnect.`,
  };
}

export default async function VeterinarianDetailPage({
  params,
}: VeterinarianDetailPageProps) {
  const { id } = await params;
  return <VeterinarianDetailClient id={id} />;
}
