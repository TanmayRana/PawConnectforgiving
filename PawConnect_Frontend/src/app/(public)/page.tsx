import type { Metadata } from "next";
import { HomeClient } from "./home-client";

export const metadata: Metadata = {
  title: "PawConnect - Complete Care for Your Pets",
  description:
    "Discover certified veterinary clinics, stress-free pet grooming, certified positive trainers, and premium in-house pet essentials all in one place.",
};

export default function HomePage() {
  return <HomeClient />;
}
