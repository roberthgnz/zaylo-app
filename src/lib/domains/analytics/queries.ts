import { useQuery } from "@tanstack/react-query";
import { getBusinessAnalyticsSummary } from "@/lib/domains/analytics/client";

export const analyticsQueryKeys = {
  analyticsSummary: (days: number) => ["analytics", "summary", days] as const,
};

export function useBusinessAnalyticsSummaryQuery(days = 7) {
  return useQuery({
    queryKey: analyticsQueryKeys.analyticsSummary(days),
    queryFn: () => getBusinessAnalyticsSummary(days),
  });
}
