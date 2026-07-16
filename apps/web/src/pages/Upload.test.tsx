import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Upload from "./Upload";

describe("Upload page", () => {
  it("renders the Upload Data heading", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Upload />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: "Upload Data" })).toBeInTheDocument();
  });
});
