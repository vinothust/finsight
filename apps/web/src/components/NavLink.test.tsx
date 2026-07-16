import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { NavLink } from "./NavLink";

describe("NavLink", () => {
  it("renders a link with the given text", () => {
    render(
      <MemoryRouter>
        <NavLink to="/dashboard">Dashboard</NavLink>
      </MemoryRouter>
    );
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });
});
