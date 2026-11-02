"use client";

import * as React from "react";

export default function PublicTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
