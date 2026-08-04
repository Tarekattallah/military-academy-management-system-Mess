import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      gcTime: 10 * 60 * 1000, // 10 minutes - garbage collection for cached queries
      staleTime: 30_000 // 30 seconds - consider data fresh
    }
  }
});