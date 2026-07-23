import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";
import { filterService } from "@/services/filterService";
import { pnlService } from "@/services/pnlService";
import { aiService } from "@/services/aiService";
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
  },
}));
vi.mock("@/services/aiService", () => ({
  aiService: { getInsights: vi.fn(), sendChatMessage: vi.fn() },
}));

const mockedAuthService = vi.mocked(authService);
const mockedFilterService = vi.mocked(filterService);
const mockedPnlService = vi.mocked(pnlService);
const mockedAiService = vi.mocked(aiService);

describe("Dashboard page", () => {
  it("renders the heading, filters, and KPI cards (no charts)", async () => {
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
    mockedAiService.getInsights.mockResolvedValue({ insights: [], generated_at: "2026-01-01T00:00:00Z" });

    render(
      <MemoryRouter>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByText("Filters")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("AI Insights")).toBeInTheDocument());
    expect(screen.queryByText("Revenue & Profit Trend")).not.toBeInTheDocument();
  });
});
