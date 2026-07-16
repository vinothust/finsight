import { describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api";
import { authService } from "./authService";

vi.mock("@/lib/api", () => ({ apiFetch: vi.fn() }));

const mockedApiFetch = vi.mocked(apiFetch);

describe("authService", () => {
  it("login posts credentials and returns the user", async () => {
    mockedApiFetch.mockResolvedValue({ user: { id: "1", name: "Ada", email: "ada@test.dev", role: "admin" } });

    const user = await authService.login("ada@test.dev", "pw");

    expect(mockedApiFetch).toHaveBeenCalledWith("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "ada@test.dev", password: "pw" }),
    });
    expect(user.name).toBe("Ada");
  });

  it("logout posts to /auth/logout", async () => {
    mockedApiFetch.mockResolvedValue(undefined);
    await authService.logout();
    expect(mockedApiFetch).toHaveBeenCalledWith("/auth/logout", { method: "POST" });
  });

  it("getCurrentUser fetches /auth/me and returns the user", async () => {
    mockedApiFetch.mockResolvedValue({
      user: { id: "2", name: "Bo", email: "bo@test.dev", role: "project_manager" },
    });
    const user = await authService.getCurrentUser();
    expect(mockedApiFetch).toHaveBeenCalledWith("/auth/me");
    expect(user.name).toBe("Bo");
  });
});
