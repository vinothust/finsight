import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Users from "./Users";

describe("Users page", () => {
  it("renders the Users heading", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Users />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: "Users" })).toBeInTheDocument();
  });
});
