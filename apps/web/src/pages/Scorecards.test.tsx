import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { RoleProvider } from "../context/RoleContext";
import { Scorecards } from "./Scorecards";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ program_id: 1, program_name: "Modernization", margin: 0.3, rag_status: "green" }],
    })
  );
});

describe("Scorecards", () => {
  it("renders a card per program with margin", async () => {
    render(
      <RoleProvider>
        <Scorecards />
      </RoleProvider>
    );
    await waitFor(() => expect(screen.getByText("Modernization")).toBeInTheDocument());
    expect(screen.getByText("Margin: 30.0%")).toBeInTheDocument();
  });
});
