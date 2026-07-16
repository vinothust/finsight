import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";
import Login from "./Login";

vi.mock("@/services/authService", () => ({
  authService: {
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  },
}));

const mockedAuthService = vi.mocked(authService);

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("Login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedAuthService.getCurrentUser.mockRejectedValue(new Error("not authenticated"));
  });

  it("renders the sign-in form", async () => {
    renderLogin();
    await waitFor(() => expect(screen.getByLabelText("Email")).toBeInTheDocument());
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("does not call login when fields are empty", async () => {
    renderLogin();
    await waitFor(() => expect(screen.getByLabelText("Email")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(mockedAuthService.login).not.toHaveBeenCalled();
  });

  it("navigates to /dashboard after a successful login", async () => {
    mockedAuthService.login.mockResolvedValue({ id: "1", name: "Ada", email: "ada@test.dev", role: "admin" });
    renderLogin();
    await waitFor(() => expect(screen.getByLabelText("Email")).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ada@test.dev" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "pw123" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(screen.getByText("Dashboard Page")).toBeInTheDocument());
    expect(mockedAuthService.login).toHaveBeenCalledWith("ada@test.dev", "pw123");
  });
});
