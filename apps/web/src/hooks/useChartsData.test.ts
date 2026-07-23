import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { pnlService } from "@/services/pnlService";
import { useChartsData } from "./useChartsData";
import type { FilterState } from "@/types";

vi.mock("@/services/pnlService", () => ({
  pnlService: {
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

describe("useChartsData", () => {
  it("fetches all 4 chart series in parallel and returns them", async () => {
    mockedPnlService.getRevenueTrend.mockResolvedValue([{ month: "January 2026", revenue: 100, cost: 70, profit: 30 }]);
    mockedPnlService.getRevenueByCluster.mockResolvedValue([{ name: "North America", value: 100 }]);
    mockedPnlService.getMarginByAccount.mockResolvedValue([{ name: "Acme Corp", margin: 0.3 }]);
    mockedPnlService.getUtilizationTrend.mockResolvedValue([{ month: "January 2026", utilization: 85, headcount: 2 }]);

    const { result } = renderHook(() => useChartsData(FILTERS));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.revenueTrend).toHaveLength(1);
    expect(result.current.revenueByCluster).toHaveLength(1);
    expect(result.current.marginByAccount).toHaveLength(1);
    expect(result.current.utilizationTrend).toHaveLength(1);
  });
});
