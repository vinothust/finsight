import { useEffect, useState } from 'react';
import { filterService } from '@/services/filterService';
import type { ScopeOption } from '@/services/filterService';
import { MONTHS } from '@/types';

function currentYearRange(): number[] {
  const currentYear = new Date().getFullYear();
  return [currentYear - 1, currentYear, currentYear + 1];
}

export function useFilterOptions() {
  const [clusters, setClusters] = useState<ScopeOption[]>([]);
  const [accounts, setAccounts] = useState<ScopeOption[]>([]);
  const [projects, setProjects] = useState<(ScopeOption & { account_id: number })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([filterService.getClusters(), filterService.getAccounts(), filterService.getProjects()])
      .then(([clusterList, accountList, projectList]) => {
        if (cancelled) return;
        setClusters(clusterList);
        setAccounts(accountList);
        setProjects(projectList);
      })
      .catch(() => {
        if (!cancelled) {
          setClusters([]);
          setAccounts([]);
          setProjects([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { clusters, accounts, projects, years: currentYearRange(), months: MONTHS, isLoading };
}
