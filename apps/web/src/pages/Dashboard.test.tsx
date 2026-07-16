import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";
import { filterService } from "@/services/filterService";
import { pnlService } from "@/services/pnlService";
import Dashboard from "./Dashboard";

vi.mock("@/services/authService", () => ({
  authService: { getCurrentUser: vi.fn(), login: vi.fn(), logout: vi.fn() },
}));
vi.mock("@/services/filterService", () => ({
  filterService: { getClusters: vi.fn(), getAccounts: vi.fn(), getProjects: vi.fn() },
}));
vi.mock("@/services/pnlService", () => ({
  pnlService: {
    getKpis: vi.fn(),
    getRevenueTrend: vi.fn(),
    getRevenueByCluster: vi.fn(),
    getMarginByAccount: vi.fn(),
    getUtilizationTrend: vi.fn(),
  },
}));

const mockedAuthService = vi.mocked(authService);
const mockedFilterService = vi.mocked(filterService);
const mockedPnlService = vi.mocked(pnlService);

describe("Dashboard page", () => {
  it("renders the heading, filters, KPI cards, and charts", async () => {
    mockedAuthService.getCurrentUser.mockResolvedValue({ id: "1", name: "Ada", email: "ada@test.dev", role: "admin" });
    mockedFilterService.getClusters.mockResolvedValue([]);
    mockedFilterService.getAccounts.mockResolvedValue([]);
    mockedFilterService.getProjects.mockResolvedValue([]);
    mockedPnlService.getKpis.mockResolvedValue({
      revenue: 100000,
      cost: 70000,
      gross_profit: 30000,
      margin: 0.3,
      headcount: 2,
      utilization: 85,
      revenue_per_head: 50000,
      cost_per_head: 35000,
    });
    mockedPnlService.getRevenueTrend.mockResolvedValue([]);
    mockedPnlService.getRevenueByCluster.mockResolvedValue([]);
    mockedPnlService.getMarginByAccount.mockResolvedValue([]);
    mockedPnlService.getUtilizationTrend.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByText("Filters")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Revenue & Profit Trend")).toBeInTheDocument());
  });
});
