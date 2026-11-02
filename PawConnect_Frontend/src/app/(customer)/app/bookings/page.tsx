import type { Metadata } from "next";
import { BookingsClient } from "./bookings-client";

export const metadata: Metadata = {
  title: "My Bookings & Appointments | PawConnect",
  description: "View and manage all your scheduled veterinary, grooming, and training sessions.",
};

export default function BookingsPage() {
  return <BookingsClient />;
}
