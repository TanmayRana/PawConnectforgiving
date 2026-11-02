import type { Metadata } from "next";
import { TrainerDetailClient } from "./trainer-detail-client";

interface TrainerDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: TrainerDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Dog Trainer Profile | PawConnect`,
    description: `Book canine coaching and agility training with specialist ${id} on PawConnect.`,
  };
}

export default async function TrainerDetailPage({ params }: TrainerDetailPageProps) {
  const { id } = await params;
  return <TrainerDetailClient id={id} />;
}
