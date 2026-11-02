import type { Metadata } from "next";
import { VetAppointmentDetailClient } from "./vet-appointment-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Appointment ${id} - Veterinarian Portal`,
    description: "Clinical patient records, consult notes, and appointment management.",
  };
}

export default async function VetAppointmentDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <VetAppointmentDetailClient appointmentId={id} />;
}
