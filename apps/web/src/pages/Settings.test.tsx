import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Settings } from "./Settings";

const SAMPLE_SETTINGS = {
  gcp_project: "acme-gcp",
  gcp_location: "us-central1",
  model_simple: "gemini-2.5-flash-lite",
  model_complex: "gemini-2.5-flash",
  model_fallback: "gemini-2.5-pro",
};

describe("Settings", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => SAMPLE_SETTINGS,
      })
    );
  });

  it("loads and displays the current LLM settings", async () => {
    render(<Settings />);
    await waitFor(() => expect(screen.getByDisplayValue("acme-gcp")).toBeInTheDocument());
    expect(screen.getByDisplayValue("gemini-2.5-flash-lite")).toBeInTheDocument();
    expect(screen.getByDisplayValue("gemini-2.5-flash")).toBeInTheDocument();
    expect(screen.getByDisplayValue("gemini-2.5-pro")).toBeInTheDocument();
  });

  it("saves updated settings on Save click", async () => {
    render(<Settings />);
    await waitFor(() => expect(screen.getByDisplayValue("acme-gcp")).toBeInTheDocument());

    const projectInput = screen.getByDisplayValue("acme-gcp");
    await userEvent.clear(projectInput);
    await userEvent.type(projectInput, "new-project");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(screen.getByText("Saved.")).toBeInTheDocument());
    const putCall = (fetch as ReturnType<typeof vi.fn>).mock.calls.find(([, init]) => init?.method === "PUT");
    expect(putCall).toBeTruthy();
    expect(JSON.parse(putCall![1].body).gcp_project).toBe("new-project");
  });
});
