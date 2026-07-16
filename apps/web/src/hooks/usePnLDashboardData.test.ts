import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { pnlService } from "@/services/pnlService";
import { usePnLDashboardData } from "./usePnLDashboardData";
import type { FilterState } from "@/types";

vi.mock("@/services/pnlService", () => ({
  pnlService: {
    getKpis: vi.fn(),
    getRevenueTrend: vi.fn(),
    getRevenueByCluster: vi.fn(),
    getMarginByAccount: vi.fn(),
    getUtilizationTrend: vi.fn(),
  },
}));

const mockedPnlService = vi.mocked(pnlService);

const FILTERS: FilterState = {
  clusters: [],
  accounts: [],
  projects: [],
  analyzeBy: [],
  years: [],
  months: [],
  marginRange: [0, 100],
};

describe("usePnLDashboardData", () => {
  it("fetches all 5 summaries in parallel and returns them", async () => {
    mockedPnlService.getKpis.mockResolvedValue({
      revenue: 100,
      cost: 70,
      gross_profit: 30,
      margin: 0.3,
      headcount: 2,
      utilization: 85,
      revenue_per_head: 50,
      cost_per_head: 35,
    });
    mockedPnlService.getRevenueTrend.mockResolvedValue([{ month: "January 2026", revenue: 100, cost: 70, profit: 30 }]);
    mockedPnlService.getRevenueByCluster.mockResolvedValue([{ name: "North America", value: 100 }]);
    mockedPnlService.getMarginByAccount.mockResolvedValue([{ name: "Acme Corp", margin: 0.3 }]);
    mockedPnlService.getUtilizationTrend.mockResolvedValue([{ month: "January 2026", utilization: 85, headcount: 2 }]);

    const { result } = renderHook(() => usePnLDashboardData(FILTERS));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.kpis?.revenue).toBe(100);
    expect(result.current.revenueTrend).toHaveLength(1);
    expect(result.current.revenueByCluster).toHaveLength(1);
    expect(result.current.marginByAccount).toHaveLength(1);
    expect(result.current.utilizationTrend).toHaveLength(1);
  });
});
