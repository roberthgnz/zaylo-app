import { apiRequest } from "@/lib/api/client";
import type { BusinessAnalyticsSummary } from "@/lib/domains/analytics/types";

export async function getBusinessAnalyticsSummary(days = 7) {
  const params = new URLSearchParams({ days: String(days) });
  const { summary } = await apiRequest<{ summary: BusinessAnalyticsSummary }>(
    `/api/analytics/summary?${params.toString()}`
  );
  return summary;
}
