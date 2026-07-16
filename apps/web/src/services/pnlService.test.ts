import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api";
import { pnlService } from "./pnlService";
import type { FilterState } from "@/types";

vi.mock("@/lib/api", () => ({ apiFetch: vi.fn() }));
const mockedApiFetch = vi.mocked(apiFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

const BASE_FILTERS: FilterState = {
  clusters: [],
  accounts: [],
  projects: [],
  analyzeBy: [],
  years: [],
  months: [],
  marginRange: [0, 100],
};

describe("pnlService", () => {
  it("getKpis sends no query params when filters are empty", async () => {
    mockedApiFetch.mockResolvedValue({
      revenue: 0, cost: 0, gross_profit: 0, margin: 0, headcount: 0, utilization: 0, revenue_per_head: 0, cost_per_head: 0,
    });
    await pnlService.getKpis(BASE_FILTERS);
    expect(mockedApiFetch).toHaveBeenCalledWith("/pnl/summary/kpis?");
  });

  it("getKpis joins selected cluster/account/project/year ids and converts month names to numbers", async () => {
    mockedApiFetch.mockResolvedValue({
      revenue: 0, cost: 0, gross_profit: 0, margin: 0, headcount: 0, utilization: 0, revenue_per_head: 0, cost_per_head: 0,
    });
    await pnlService.getKpis({
      ...BASE_FILTERS,
      clusters: ["1", "2"],
      accounts: ["3"],
      projects: ["4"],
      years: [2026],
      months: ["January", "March"],
    });
    const [path] = mockedApiFetch.mock.calls[0];
    expect(path).toContain("cluster_ids=1%2C2");
    expect(path).toContain("account_ids=3");
    expect(path).toContain("project_ids=4");
    expect(path).toContain("years=2026");
    expect(path).toContain("months=1%2C3");
  });

  it("getRevenueTrend unwraps the data array", async () => {
    mockedApiFetch.mockResolvedValue({ data: [{ month: "January 2026", revenue: 100, cost: 70, profit: 30 }] });
    const result = await pnlService.getRevenueTrend(BASE_FILTERS);
    expect(result).toEqual([{ month: "January 2026", revenue: 100, cost: 70, profit: 30 }]);
  });

  it("getRevenueByCluster unwraps the data array", async () => {
    mockedApiFetch.mockResolvedValue({ data: [{ name: "North America", value: 100 }] });
    const result = await pnlService.getRevenueByCluster(BASE_FILTERS);
    expect(result).toEqual([{ name: "North America", value: 100 }]);
  });

  it("getMarginByAccount unwraps the data array", async () => {
    mockedApiFetch.mockResolvedValue({ data: [{ name: "Acme Corp", margin: 0.3 }] });
    const result = await pnlService.getMarginByAccount(BASE_FILTERS);
    expect(result).toEqual([{ name: "Acme Corp", margin: 0.3 }]);
  });

  it("getUtilizationTrend unwraps the data array", async () => {
    mockedApiFetch.mockResolvedValue({ data: [{ month: "January 2026", utilization: 85, headcount: 2 }] });
    const result = await pnlService.getUtilizationTrend(BASE_FILTERS);
    expect(result).toEqual([{ month: "January 2026", utilization: 85, headcount: 2 }]);
  });
});
