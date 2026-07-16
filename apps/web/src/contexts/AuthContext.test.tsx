import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";

function Probe() {
  const { user, isAuthenticated } = useAuth();
  return (
    <div>
      <span>{isAuthenticated ? "authenticated" : "not authenticated"}</span>
      <span>{user?.name}</span>
    </div>
  );
}

describe("AuthContext stub", () => {
  it("provides a static authenticated user", () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    expect(screen.getByText("authenticated")).toBeInTheDocument();
    expect(screen.getByText("Preview User")).toBeInTheDocument();
  });
});
