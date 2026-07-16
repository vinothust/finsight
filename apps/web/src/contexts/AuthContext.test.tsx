import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";
import { authService } from "@/services/authService";

vi.mock("@/services/authService", () => ({
  authService: {
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  },
}));

const mockedAuthService = vi.mocked(authService);

function Probe() {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <span>loading</span>;
  return <span>{isAuthenticated ? `authenticated:${user?.name}` : "not authenticated"}</span>;
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading then authenticated state on a successful session check", async () => {
    mockedAuthService.getCurrentUser.mockResolvedValue({
      id: "1",
      name: "Ada",
      email: "ada@test.dev",
      role: "admin",
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    expect(screen.getByText("loading")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("authenticated:Ada")).toBeInTheDocument());
  });

  it("shows unauthenticated after a failed session check", async () => {
    mockedAuthService.getCurrentUser.mockRejectedValue(new Error("not authenticated"));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText("not authenticated")).toBeInTheDocument());
  });

  it("login() returns true and sets the user on success", async () => {
    mockedAuthService.getCurrentUser.mockRejectedValue(new Error("not authenticated"));
    mockedAuthService.login.mockResolvedValue({ id: "1", name: "Ada", email: "ada@test.dev", role: "admin" });

    let authRef: ReturnType<typeof useAuth> | undefined;
    function Capture() {
      authRef = useAuth();
      return null;
    }

    render(
      <AuthProvider>
        <Capture />
      </AuthProvider>
    );
    await waitFor(() => expect(authRef?.isLoading).toBe(false));

    const success = await authRef!.login("ada@test.dev", "pw");
    expect(success).toBe(true);
  });

  it("login() returns false on failure", async () => {
    mockedAuthService.getCurrentUser.mockRejectedValue(new Error("not authenticated"));
    mockedAuthService.login.mockRejectedValue(new Error("invalid email or password"));

    let authRef: ReturnType<typeof useAuth> | undefined;
    function Capture() {
      authRef = useAuth();
      return null;
    }

    render(
      <AuthProvider>
        <Capture />
      </AuthProvider>
    );
    await waitFor(() => expect(authRef?.isLoading).toBe(false));

    const success = await authRef!.login("ada@test.dev", "wrong");
    expect(success).toBe(false);
  });
});
