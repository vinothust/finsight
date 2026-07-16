import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Analytics from "./Analytics";

describe("Analytics page", () => {
  it("renders the Analytics heading", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Analytics />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByText("Analytics")).toBeInTheDocument();
  });
});
