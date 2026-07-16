import { apiFetch } from '@/lib/api';
import { MONTHS } from '@/types';
import type { FilterState } from '@/types';

export interface KpiSummary {
  revenue: number;
  cost: number;
  gross_profit: number;
  margin: number;
  headcount: number;
  utilization: number;
  revenue_per_head: number;
  cost_per_head: number;
}

export interface RevenueTrendPoint {
  month: string;
  revenue: number;
  cost: number;
  profit: number;
}

export interface BreakdownPoint {
  name: string;
  value?: number;
  margin?: number;
}

export interface UtilizationTrendPoint {
  month: string;
  utilization: number;
  headcount: number;
}

function buildParams(filters: FilterState): string {
  const params = new URLSearchParams();
  if (filters.clusters.length) params.set('cluster_ids', filters.clusters.join(','));
  if (filters.accounts.length) params.set('account_ids', filters.accounts.join(','));
  if (filters.projects.length) params.set('project_ids', filters.projects.join(','));
  if (filters.years.length) params.set('years', filters.years.join(','));
  if (filters.months.length) {
    const monthNumbers = filters.months.map((name) => MONTHS.indexOf(name) + 1);
    params.set('months', monthNumbers.join(','));
  }
  return params.toString();
}

export const pnlService = {
  getKpis: (filters: FilterState): Promise<KpiSummary> =>
    apiFetch<KpiSummary>(`/pnl/summary/kpis?${buildParams(filters)}`),

  getRevenueTrend: async (filters: FilterState): Promise<RevenueTrendPoint[]> => {
    const response = await apiFetch<{ data: RevenueTrendPoint[] }>(`/pnl/summary/revenue-trend?${buildParams(filters)}`);
    return response.data;
  },

  getRevenueByCluster: async (filters: FilterState): Promise<BreakdownPoint[]> => {
    const response = await apiFetch<{ data: BreakdownPoint[] }>(`/pnl/summary/revenue-by-cluster?${buildParams(filters)}`);
    return response.data;
  },

  getMarginByAccount: async (filters: FilterState): Promise<BreakdownPoint[]> => {
    const response = await apiFetch<{ data: BreakdownPoint[] }>(`/pnl/summary/margin-by-account?${buildParams(filters)}`);
    return response.data;
  },

  getUtilizationTrend: async (filters: FilterState): Promise<UtilizationTrendPoint[]> => {
    const response = await apiFetch<{ data: UtilizationTrendPoint[] }>(
      `/pnl/summary/utilization-trend?${buildParams(filters)}`
    );
    return response.data;
  },
};
