import { PortalPageTransition } from "@/lib/animations/portal-transition";

export default function CustomerPortalTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalPageTransition>{children}</PortalPageTransition>;
}
