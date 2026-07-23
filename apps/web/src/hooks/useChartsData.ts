import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { FilterState } from '@/types';
import { pnlService } from '@/services/pnlService';
import type { BreakdownPoint, RevenueTrendPoint, UtilizationTrendPoint } from '@/services/pnlService';

export function useChartsData(filters: FilterState) {
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrendPoint[]>([]);
  const [revenueByCluster, setRevenueByCluster] = useState<BreakdownPoint[]>([]);
  const [marginByAccount, setMarginByAccount] = useState<BreakdownPoint[]>([]);
  const [utilizationTrend, setUtilizationTrend] = useState<UtilizationTrendPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    Promise.all([
      pnlService.getRevenueTrend(filters),
      pnlService.getRevenueByCluster(filters),
      pnlService.getMarginByAccount(filters),
      pnlService.getUtilizationTrend(filters),
    ])
      .then(([revenueTrendResult, revenueByClusterResult, marginByAccountResult, utilizationTrendResult]) => {
        if (cancelled) return;
        setRevenueTrend(revenueTrendResult);
        setRevenueByCluster(revenueByClusterResult);
        setMarginByAccount(marginByAccountResult);
        setUtilizationTrend(utilizationTrendResult);
      })
      .catch(() => {
        if (!cancelled) toast.error('Failed to load chart data');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  return { revenueTrend, revenueByCluster, marginByAccount, utilizationTrend, isLoading };
}
