import type { Metadata } from "next";
import { PetsClient } from "./pets-client";

export const metadata: Metadata = {
  title: "My Pets | PawConnect",
  description: "Manage your registered companion pets, vaccination dates, and medical records.",
};

export default function PetsPage() {
  return <PetsClient />;
}
