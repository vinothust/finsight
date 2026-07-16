import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Clusters from "./Clusters";

describe("Clusters page", () => {
  it("renders the Clusters heading", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Clusters />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: "Clusters" })).toBeInTheDocument();
  });
});
