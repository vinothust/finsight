import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Accounts from "./Accounts";

describe("Accounts page", () => {
  it("renders the Accounts heading", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Accounts />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: "Accounts" })).toBeInTheDocument();
  });
});
