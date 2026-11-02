import type { Metadata } from "next";
import { PetDetailClient } from "./pet-detail-client";

interface PetDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PetDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Pet Profile | PawConnect`,
    description: `Detailed care records, vaccinations, and appointments for pet ${id}.`,
  };
}

export default async function PetDetailPage({ params }: PetDetailPageProps) {
  const { id } = await params;
  return <PetDetailClient id={id} />;
}
