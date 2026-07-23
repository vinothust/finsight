import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { FilterState } from '@/types';
import { pnlService } from '@/services/pnlService';
import type { KpiSummary } from '@/services/pnlService';

export function useKpiData(filters: FilterState) {
  const [kpis, setKpis] = useState<KpiSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    pnlService
      .getKpis(filters)
      .then((result) => {
        if (!cancelled) setKpis(result);
      })
      .catch(() => {
        if (!cancelled) toast.error('Failed to load dashboard data');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  return { kpis, isLoading };
}
