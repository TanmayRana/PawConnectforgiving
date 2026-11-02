import type { Metadata } from "next";
import { ProfileClient } from "./profile-client";

export const metadata: Metadata = {
  title: "My Profile & Settings | PawConnect",
  description: "View and update your personal details, emergency contacts, security, and addresses.",
};

export default function ProfilePage() {
  return <ProfileClient />;
}
