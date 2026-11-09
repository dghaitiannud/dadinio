import { QueryClient } from "@tanstack/react-query";

// 🔐 SECURITY FIX #10: Configure React Query with proper cache times
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed queries once
      retry: 1,
      // No automatic refetching
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry mutations once on network error
      retry: 1,
    },
  },
});
