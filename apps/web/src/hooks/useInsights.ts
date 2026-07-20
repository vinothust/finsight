import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { aiService } from '@/services/aiService';
import type { InsightItem } from '@/services/aiService';
import type { FilterState } from '@/types';

export function useInsights(filters: FilterState, focusArea: string | null) {
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    aiService
      .getInsights({
        cluster_ids: filters.clusters.length ? filters.clusters.map(Number) : undefined,
        account_ids: filters.accounts.length ? filters.accounts.map(Number) : undefined,
        years: filters.years.length ? filters.years : undefined,
        ...(focusArea ? { focus_area: focusArea } : {}),
      })
      .then((res) => {
        if (!cancelled) setInsights(res.insights);
      })
      .catch(() => {
        if (!cancelled) toast.error('Failed to load insights');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters.clusters, filters.accounts, filters.years, focusArea]);

  return { insights, isLoading };
}
