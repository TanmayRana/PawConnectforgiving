import type { Metadata } from "next";
import { BookingDetailView } from "@/components/customer/booking-detail-view";

interface AppointmentDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: AppointmentDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Veterinary Appointment | PawConnect`,
    description: `Clinical appointment details and medical consultation confirmation for ${id}.`,
  };
}

export default async function AppointmentDetailPage({
  params,
}: AppointmentDetailPageProps) {
  const { id } = await params;
  return <BookingDetailView id={id} isClinicalAppointment={true} />;
}
