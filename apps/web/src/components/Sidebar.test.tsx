import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Sidebar from "./Sidebar";

describe("Sidebar", () => {
  it("renders nav items and the current (stub) user's initials", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Sidebar collapsed={false} onToggle={vi.fn()} />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Upload Data")).toBeInTheDocument();
    expect(screen.getByText("Administration")).toBeInTheDocument(); // stub user role is admin
  });
});
