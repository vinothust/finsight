import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Logo from "./Logo";

describe("Logo", () => {
  it("renders the FinSight wordmark", () => {
    render(<Logo />);
    expect(screen.getByText("FinSight")).toBeInTheDocument();
  });
});
