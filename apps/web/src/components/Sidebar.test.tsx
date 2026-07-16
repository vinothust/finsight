import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";
import Sidebar from "./Sidebar";

vi.mock("@/services/authService", () => ({
  authService: {
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  },
}));

const mockedAuthService = vi.mocked(authService);

describe("Sidebar", () => {
  it("renders nav items and the admin-only Administration section for an admin user", async () => {
    mockedAuthService.getCurrentUser.mockResolvedValue({
      id: "1",
      name: "Ada Admin",
      email: "ada@test.dev",
      role: "admin",
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <Sidebar collapsed={false} onToggle={vi.fn()} />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Upload Data")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Administration")).toBeInTheDocument());
  });
});
