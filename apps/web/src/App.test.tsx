import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import App from "./App";
import { authService } from "@/services/authService";

vi.mock("@/services/authService", () => ({
  authService: {
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  },
}));

const mockedAuthService = vi.mocked(authService);

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects an unauthenticated session to /login", async () => {
    mockedAuthService.getCurrentUser.mockRejectedValue(new Error("not authenticated"));
    render(<App />);
    await waitFor(() => expect(screen.getByText("Sign in")).toBeInTheDocument());
  });

  it("redirects an authenticated session's / to /dashboard", async () => {
    mockedAuthService.getCurrentUser.mockResolvedValue({
      id: "1",
      name: "Ada",
      email: "ada@test.dev",
      role: "admin",
    });
    render(<App />);
    await waitFor(() => expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument());
  });
});
