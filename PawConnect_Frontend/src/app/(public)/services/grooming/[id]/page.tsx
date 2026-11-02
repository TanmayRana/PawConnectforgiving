import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PublicGroomingRedirectPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/app/services/grooming/${id}`);
}
