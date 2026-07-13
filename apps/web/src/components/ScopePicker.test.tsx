import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { RoleProvider } from "../context/RoleContext";
import { ScopePicker } from "./ScopePicker";

describe("ScopePicker", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ id: 1, name: "Acme Corp" }],
      })
    );
  });

  it("renders nothing for area_director", () => {
    localStorage.setItem("finsight_role", "area_director");
    render(
      <RoleProvider>
        <ScopePicker />
      </RoleProvider>
    );
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("fetches and shows account options for account_director and updates scope on selection", async () => {
    localStorage.setItem("finsight_role", "account_director");
    render(
      <RoleProvider>
        <ScopePicker />
      </RoleProvider>
    );

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/scope-options/accounts")));
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(await screen.findByText("Acme Corp"));
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });

  it("fetches program options for pm and shows the program placeholder", async () => {
    localStorage.setItem("finsight_role", "pm");
    render(
      <RoleProvider>
        <ScopePicker />
      </RoleProvider>
    );

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/scope-options/programs")));
    expect(screen.getByText("Select program...")).toBeInTheDocument();
  });
});
