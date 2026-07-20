import { useState } from 'react';
import FilterPanel from '@/components/FilterPanel';
import KPICards from '@/components/KPICards';
import DataCharts from '@/components/DataCharts';
import { InsightsPanel } from '@/components/InsightsPanel';
import { useFilterOptions } from '@/hooks/useFilterOptions';
import { usePnLDashboardData } from '@/hooks/usePnLDashboardData';
import type { FilterState } from '@/types';

const EMPTY_FILTERS: FilterState = {
  clusters: [],
  accounts: [],
  projects: [],
  analyzeBy: [],
  years: [],
  months: [],
  marginRange: [0, 100],
};

const PnLOverview = () => {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const { clusters, accounts, projects, years, months } = useFilterOptions();
  const { kpis, revenueTrend, revenueByCluster, marginByAccount, utilizationTrend } = usePnLDashboardData(filters);

  return (
    <div className="space-y-6">
      <FilterPanel
        filters={filters}
        onFilterChange={setFilters}
        availableClusters={clusters}
        availableAccounts={accounts}
        availableProjects={projects}
        availableYears={years}
        availableMonths={months}
      />
      <KPICards kpis={kpis} />
      <DataCharts
        revenueTrend={revenueTrend}
        revenueByCluster={revenueByCluster}
        marginByAccount={marginByAccount}
        utilizationTrend={utilizationTrend}
      />
      <InsightsPanel filters={filters} />
    </div>
  );
};

export default PnLOverview;
