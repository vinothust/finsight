import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Projects from "./Projects";

describe("Projects page", () => {
  it("renders the Projects heading", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Projects />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: "Projects" })).toBeInTheDocument();
  });
});
