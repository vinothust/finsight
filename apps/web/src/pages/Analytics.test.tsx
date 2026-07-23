import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";
import { filterService } from "@/services/filterService";
import { pnlService } from "@/services/pnlService";
import Analytics from "./Analytics";

vi.mock("@/services/authService", () => ({
  authService: { getCurrentUser: vi.fn(), login: vi.fn(), logout: vi.fn() },
}));
vi.mock("@/services/filterService", () => ({
  filterService: { getClusters: vi.fn(), getAccounts: vi.fn(), getProjects: vi.fn() },
}));
vi.mock("@/services/pnlService", () => ({
  pnlService: {
    getRevenueTrend: vi.fn(),
    getRevenueByCluster: vi.fn(),
    getMarginByAccount: vi.fn(),
    getUtilizationTrend: vi.fn(),
  },
}));

const mockedAuthService = vi.mocked(authService);
const mockedFilterService = vi.mocked(filterService);
const mockedPnlService = vi.mocked(pnlService);

describe("Analytics page", () => {
  it("renders the heading, filters, and charts (no KPI cards or insights)", async () => {
    mockedAuthService.getCurrentUser.mockResolvedValue({ id: "1", name: "Ada", email: "ada@test.dev", role: "admin" });
    mockedFilterService.getClusters.mockResolvedValue([]);
    mockedFilterService.getAccounts.mockResolvedValue([]);
    mockedFilterService.getProjects.mockResolvedValue([]);
    mockedPnlService.getRevenueTrend.mockResolvedValue([]);
    mockedPnlService.getRevenueByCluster.mockResolvedValue([]);
    mockedPnlService.getMarginByAccount.mockResolvedValue([]);
    mockedPnlService.getUtilizationTrend.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <AuthProvider>
          <Analytics />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Analytics" })).toBeInTheDocument();
    expect(screen.getByText("Filters")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Revenue & Profit Trend")).toBeInTheDocument());
    expect(screen.queryByText("AI Insights")).not.toBeInTheDocument();
  });
});
