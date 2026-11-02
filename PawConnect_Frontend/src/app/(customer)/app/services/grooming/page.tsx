import type { Metadata } from "next";
import { GroomingClient } from "./grooming-client";

export const metadata: Metadata = {
  title: "Pet Grooming & Spa | PawConnect",
  description: "Book pet styling, baths, nail trimming, and luxury spa sessions.",
};

export default function CustomerGroomingPage() {
  return <GroomingClient />;
}
