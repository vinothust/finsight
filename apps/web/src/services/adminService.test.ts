import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiFetch } from "@/lib/api";
import { clusterAdmin, accountAdmin, projectAdmin, userAdmin, roleAdmin } from "./adminService";

vi.mock("@/lib/api", () => ({ apiFetch: vi.fn() }));
const mockedApiFetch = vi.mocked(apiFetch);

describe("adminService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("clusterAdmin.list builds query params and calls /clusters", async () => {
    mockedApiFetch.mockResolvedValue({ clusters: [], total: 0, page: 1, page_size: 50 });
    await clusterAdmin.list({ search: "acme", page: 2, page_size: 20 });
    expect(mockedApiFetch).toHaveBeenCalledWith("/clusters?search=acme&page=2&page_size=20");
  });

  it("clusterAdmin.create POSTs to /clusters with JSON body", async () => {
    mockedApiFetch.mockResolvedValue({ cluster: { id: 1 } });
    await clusterAdmin.create({ name: "Acme", heads: [1, 2] });
    expect(mockedApiFetch).toHaveBeenCalledWith("/clusters", {
      method: "POST",
      body: JSON.stringify({ name: "Acme", heads: [1, 2] }),
    });
  });

  it("clusterAdmin.update PATCHes /clusters/{id}", async () => {
    mockedApiFetch.mockResolvedValue({ cluster: { id: 1 } });
    await clusterAdmin.update(1, { name: "Renamed" });
    expect(mockedApiFetch).toHaveBeenCalledWith("/clusters/1", {
      method: "PATCH",
      body: JSON.stringify({ name: "Renamed" }),
    });
  });

  it("clusterAdmin.remove DELETEs /clusters/{id}", async () => {
    mockedApiFetch.mockResolvedValue({ success: true, message: "cluster deleted" });
    await clusterAdmin.remove(1);
    expect(mockedApiFetch).toHaveBeenCalledWith("/clusters/1", { method: "DELETE" });
  });

  it("accountAdmin.list includes cluster_id when provided", async () => {
    mockedApiFetch.mockResolvedValue({ accounts: [], total: 0, page: 1, page_size: 50 });
    await accountAdmin.list({ cluster_id: 3 });
    expect(mockedApiFetch).toHaveBeenCalledWith("/accounts?cluster_id=3");
  });

  it("projectAdmin.list includes account_id when provided", async () => {
    mockedApiFetch.mockResolvedValue({ projects: [], total: 0, page: 1, page_size: 50 });
    await projectAdmin.list({ account_id: 7 });
    expect(mockedApiFetch).toHaveBeenCalledWith("/projects?account_id=7");
  });

  it("userAdmin.create returns user and temp_password", async () => {
    mockedApiFetch.mockResolvedValue({ user: { id: 1 }, temp_password: "abc123" });
    const result = await userAdmin.create({ name: "Ada", email: "ada@test.dev", role: "admin" });
    expect(result.temp_password).toBe("abc123");
    expect(mockedApiFetch).toHaveBeenCalledWith("/users", {
      method: "POST",
      body: JSON.stringify({ name: "Ada", email: "ada@test.dev", role: "admin" }),
    });
  });

  it("roleAdmin.list calls /roles with no params", async () => {
    mockedApiFetch.mockResolvedValue({ roles: [{ value: "admin", label: "Administrator" }] });
    await roleAdmin.list();
    expect(mockedApiFetch).toHaveBeenCalledWith("/roles");
  });
});
