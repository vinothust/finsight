import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { filterService } from "@/services/filterService";
import { useFilterOptions } from "./useFilterOptions";

vi.mock("@/services/filterService", () => ({
  filterService: {
    getClusters: vi.fn(),
    getAccounts: vi.fn(),
    getProjects: vi.fn(),
  },
}));

const mockedFilterService = vi.mocked(filterService);

describe("useFilterOptions", () => {
  it("loads clusters/accounts/projects once on mount", async () => {
    mockedFilterService.getClusters.mockResolvedValue([{ id: 1, name: "North America" }]);
    mockedFilterService.getAccounts.mockResolvedValue([{ id: 2, name: "Acme Corp" }]);
    mockedFilterService.getProjects.mockResolvedValue([{ id: 3, name: "Modernization", account_id: 2 }]);

    const { result } = renderHook(() => useFilterOptions());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.clusters).toEqual([{ id: 1, name: "North America" }]);
    expect(result.current.accounts).toEqual([{ id: 2, name: "Acme Corp" }]);
    expect(result.current.projects).toEqual([{ id: 3, name: "Modernization", account_id: 2 }]);
    expect(result.current.months).toHaveLength(12);
  });
});
