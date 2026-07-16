import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Login from "./Login";

describe("Login page", () => {
  it("renders the sign-in heading", () => {
    render(<Login />);
    expect(screen.getByText("Sign in")).toBeInTheDocument();
  });
});
