import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { RoleProvider } from "../context/RoleContext";
import { AskFinSight } from "./AskFinSight";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        sql: "SELECT name FROM accounts",
        rows: [{ name: "Acme" }],
        explanation: "There is one account named Acme.",
      }),
    })
  );
});

describe("AskFinSight", () => {
  it("shows the explanation after asking a question", async () => {
    render(
      <RoleProvider>
        <AskFinSight />
      </RoleProvider>
    );
    await userEvent.type(screen.getByPlaceholderText(/lowest margin/i), "List all accounts");
    await userEvent.click(screen.getByRole("button", { name: /ask/i }));
    await waitFor(() => expect(screen.getByText(/There is one account named Acme/)).toBeInTheDocument());
  });
});
