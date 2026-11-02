"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toast";
import { AuthModalProvider } from "@/components/shared/auth-modal-provider";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

interface AppProvidersProps {
  children: React.ReactNode;
}

import { NavigationProgressBar } from "@/components/shared/navigation-progress";
import { CartProvider } from "./CartProvider";

export function AppProviders({ children }: AppProvidersProps) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationProgressBar />
      <AuthModalProvider>
        <CartProvider>
          {children}
          <Toaster />
        </CartProvider>
      </AuthModalProvider>
    </QueryClientProvider>
  );
}
