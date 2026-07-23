import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { pnlService } from "@/services/pnlService";
import { useKpiData } from "./useKpiData";
import type { FilterState } from "@/types";

vi.mock("@/services/pnlService", () => ({
  pnlService: {
    getKpis: vi.fn(),
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

describe("useKpiData", () => {
  it("fetches the KPI summary and returns it", async () => {
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

    const { result } = renderHook(() => useKpiData(FILTERS));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.kpis?.revenue).toBe(100);
  });

  it("toasts and clears loading on failure", async () => {
    mockedPnlService.getKpis.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useKpiData(FILTERS));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.kpis).toBeNull();
  });
});
