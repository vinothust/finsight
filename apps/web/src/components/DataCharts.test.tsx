import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DataCharts from "./DataCharts";

describe("DataCharts", () => {
  it("renders all four chart section titles", () => {
    render(
      <DataCharts
        revenueTrend={[{ month: "January 2026", revenue: 100, cost: 70, profit: 30 }]}
        revenueByCluster={[{ name: "North America", value: 100 }]}
        marginByAccount={[{ name: "Acme Corp", margin: 0.3 }]}
        utilizationTrend={[{ month: "January 2026", utilization: 85, headcount: 2 }]}
      />
    );

    expect(screen.getByText("Revenue & Profit Trend")).toBeInTheDocument();
    expect(screen.getByText("Revenue by Cluster")).toBeInTheDocument();
    expect(screen.getByText("Margin by Account (Top 10)")).toBeInTheDocument();
    expect(screen.getByText("Utilization Trend")).toBeInTheDocument();
  });
});
