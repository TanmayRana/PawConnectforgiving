import { PortalPageTransition } from "@/lib/animations/portal-transition";

export default function AdminPortalTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalPageTransition>{children}</PortalPageTransition>;
}
