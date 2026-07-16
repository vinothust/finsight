import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import KPICards from "./KPICards";

describe("KPICards", () => {
  it("renders formatted values from the injected summary", () => {
    render(
      <KPICards
        kpis={{
          revenue: 1500000,
          cost: 1000000,
          gross_profit: 500000,
          margin: 0.3333,
          headcount: 12,
          utilization: 85.5,
          revenue_per_head: 125000,
          cost_per_head: 83333,
        }}
      />
    );

    expect(screen.getByText("$1.5M")).toBeInTheDocument();
    expect(screen.getByText("33.3%")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("85.5%")).toBeInTheDocument();
  });

  it("renders zero-state when kpis is null", () => {
    render(<KPICards kpis={null} />);
    expect(screen.getAllByText("$0").length).toBeGreaterThan(0);
  });
});
