import { useState } from 'react';
import FilterPanel from '@/components/FilterPanel';
import DataCharts from '@/components/DataCharts';
import { useFilterOptions } from '@/hooks/useFilterOptions';
import { useChartsData } from '@/hooks/useChartsData';
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

const ChartsOverview = () => {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const { clusters, accounts, projects, years, months } = useFilterOptions();
  const { revenueTrend, revenueByCluster, marginByAccount, utilizationTrend } = useChartsData(filters);

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
      <DataCharts
        revenueTrend={revenueTrend}
        revenueByCluster={revenueByCluster}
        marginByAccount={marginByAccount}
        utilizationTrend={utilizationTrend}
      />
    </div>
  );
};

export default ChartsOverview;
