import { useQuery } from "@tanstack/react-query";

export function useTokenBalance() {
  return useQuery<{ balance: number; lcBalance: number; freeLookupUsed: boolean }>({
    queryKey: ["/api/tokens/balance"],
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });
}
