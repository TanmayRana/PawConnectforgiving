import type { Metadata } from "next";
import { BookingDetailView } from "@/components/customer/booking-detail-view";

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: BookingDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Booking Details | PawConnect`,
    description: `Care session details and confirmation for booking ${id}.`,
  };
}

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
  const { id } = await params;
  return <BookingDetailView id={id} isClinicalAppointment={false} />;
}
