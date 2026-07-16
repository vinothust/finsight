import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "./api";

describe("apiFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("prefixes the configured base URL and includes credentials", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", mockFetch);

    const result = await apiFetch<{ ok: boolean }>("/health");

    expect(result).toEqual({ ok: true });
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("http://localhost:8001/health");
    expect(init.credentials).toBe("include");
  });

  it("adds X-Requested-With on non-GET requests but not on GET", async () => {
    const mockFetch = vi.fn().mockImplementation(
      async () =>
        new Response(JSON.stringify({}), { status: 200, headers: { "content-type": "application/json" } })
    );
    vi.stubGlobal("fetch", mockFetch);

    await apiFetch("/health");
    await apiFetch("/auth/login", { method: "POST", body: JSON.stringify({}) });

    const getHeaders = new Headers(mockFetch.mock.calls[0][1].headers);
    const postHeaders = new Headers(mockFetch.mock.calls[1][1].headers);
    expect(getHeaders.has("X-Requested-With")).toBe(false);
    expect(postHeaders.get("X-Requested-With")).toBe("XMLHttpRequest");
  });

  it("throws with the response's detail message on a non-2xx response", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: "invalid email or password" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", mockFetch);

    await expect(apiFetch("/auth/login", { method: "POST" })).rejects.toThrow("invalid email or password");
  });
});
