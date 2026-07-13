import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { RoleProvider } from "../context/RoleContext";
import { Dashboard } from "./Dashboard";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ period: "2026-01-01", revenue: 100000, cost: 70000, margin: 0.3 }],
    })
  );
});

describe("Dashboard", () => {
  it("renders the revenue & margin heading after fetching data", async () => {
    render(
      <RoleProvider>
        <Dashboard />
      </RoleProvider>
    );
    await waitFor(() => expect(screen.getByText("Revenue & Margin")).toBeInTheDocument());
  });
});
