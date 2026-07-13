import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, beforeEach } from "vitest";
import { RoleProvider } from "../context/RoleContext";
import { RoleSwitcher } from "./RoleSwitcher";

describe("RoleSwitcher", () => {
  beforeEach(() => localStorage.clear());

  it("defaults to Area Director", () => {
    render(
      <RoleProvider>
        <RoleSwitcher />
      </RoleProvider>
    );
    expect(screen.getByText("Area Director")).toBeInTheDocument();
  });

  it("persists role selection to localStorage", async () => {
    render(
      <RoleProvider>
        <RoleSwitcher />
      </RoleProvider>
    );
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(await screen.findByText("Program Manager"));
    expect(localStorage.getItem("finsight_role")).toBe("pm");
  });
});
