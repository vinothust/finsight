import { render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import App from "./App";

beforeEach(() => localStorage.clear());

describe("App", () => {
  it("renders the FinSight header and nav links", () => {
    render(<App />);
    expect(screen.getByText("FinSight")).toBeInTheDocument();
    expect(screen.getByText("Ask FinSight")).toBeInTheDocument();
  });
});
