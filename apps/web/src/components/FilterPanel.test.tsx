import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FilterPanel from "./FilterPanel";
import type { FilterState } from "@/types";

const FILTERS: FilterState = {
  clusters: [],
  accounts: [],
  projects: [],
  analyzeBy: [],
  years: [],
  months: [],
  marginRange: [0, 100],
};

describe("FilterPanel", () => {
  it("calls onFilterChange with the toggled cluster id when a cluster option is selected", async () => {
    const onFilterChange = vi.fn();
    render(
      <FilterPanel
        filters={FILTERS}
        onFilterChange={onFilterChange}
        availableClusters={[{ id: 1, name: "North America" }]}
        availableAccounts={[]}
        availableProjects={[]}
        availableYears={[2026]}
        availableMonths={["January"]}
      />
    );

    fireEvent.click(screen.getByText("Select Clusters"));
    await waitFor(() => expect(screen.getByText("North America")).toBeInTheDocument());
    fireEvent.click(screen.getByText("North America"));

    expect(onFilterChange).toHaveBeenCalledWith({ ...FILTERS, clusters: ["1"] });
  });

  it("shows the active filter count and clears all filters on Clear", () => {
    const onFilterChange = vi.fn();
    render(
      <FilterPanel
        filters={{ ...FILTERS, clusters: ["1"], years: [2026] }}
        onFilterChange={onFilterChange}
        availableClusters={[{ id: 1, name: "North America" }]}
        availableAccounts={[]}
        availableProjects={[]}
        availableYears={[2026]}
        availableMonths={["January"]}
      />
    );

    expect(screen.getByText("2")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Clear"));
    expect(onFilterChange).toHaveBeenCalledWith({ ...FILTERS, clusters: [], accounts: [], projects: [], years: [], months: [] });
  });
});
