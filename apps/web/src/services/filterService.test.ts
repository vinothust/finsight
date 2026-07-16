import { describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api";
import { filterService } from "./filterService";

vi.mock("@/lib/api", () => ({ apiFetch: vi.fn() }));
const mockedApiFetch = vi.mocked(apiFetch);

describe("filterService", () => {
  it("getClusters fetches /scope-options/clusters", async () => {
    mockedApiFetch.mockResolvedValue([{ id: 1, name: "North America" }]);
    const result = await filterService.getClusters();
    expect(mockedApiFetch).toHaveBeenCalledWith("/scope-options/clusters");
    expect(result).toEqual([{ id: 1, name: "North America" }]);
  });

  it("getAccounts fetches /scope-options/accounts", async () => {
    mockedApiFetch.mockResolvedValue([{ id: 1, name: "Acme Corp" }]);
    const result = await filterService.getAccounts();
    expect(mockedApiFetch).toHaveBeenCalledWith("/scope-options/accounts");
    expect(result).toEqual([{ id: 1, name: "Acme Corp" }]);
  });

  it("getProjects fetches /scope-options/projects", async () => {
    mockedApiFetch.mockResolvedValue([{ id: 1, name: "Modernization", account_id: 1 }]);
    const result = await filterService.getProjects();
    expect(mockedApiFetch).toHaveBeenCalledWith("/scope-options/projects");
    expect(result).toEqual([{ id: 1, name: "Modernization", account_id: 1 }]);
  });
});
