import { PortalPageTransition } from "@/lib/animations/portal-transition";

export default function ProviderPortalTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalPageTransition>{children}</PortalPageTransition>;
}
