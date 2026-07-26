import { describe, expect, it } from "vitest";

import { HttpJsonBodyError, jsonResponse, readJsonBody } from "../src/index.js";

const request = (body: string, contentType?: string): Request =>
  new Request("https://example.com", {
    body,
    ...(contentType === undefined
      ? {}
      : { headers: { "content-type": contentType } }),
    method: "POST",
  });

describe("JSON HTTP bodies", () => {
  it("reads JSON and structured suffix content types", async () => {
    await expect(
      readJsonBody(request('{"ok":true}', "application/json")),
    ).resolves.toEqual({
      ok: true,
    });
    await expect(
      readJsonBody(request("1", "application/problem+json; charset=utf-8")),
    ).resolves.toBe(1);
    await expect(
      readJsonBody(request("null"), { requireContentType: false }),
    ).resolves.toBeNull();
  });

  it("reports media type, size, and syntax errors", async () => {
    await expect(
      readJsonBody(new Request("https://example.com", { method: "POST" })),
    ).rejects.toMatchObject({ code: "invalid-content-type" });
    await expect(
      readJsonBody(request("{}", "text/plain")),
    ).rejects.toMatchObject({
      code: "invalid-content-type",
    });
    await expect(
      readJsonBody(request('{"wide":"💡"}', "application/json"), {
        maxBytes: 4,
      }),
    ).rejects.toMatchObject({ code: "too-large" });
    const error = await readJsonBody(request("{", "application/json")).catch(
      (caught: unknown) => caught,
    );
    expect(error).toBeInstanceOf(HttpJsonBodyError);
    expect((error as HttpJsonBodyError).code).toBe("invalid-json");
    expect((error as HttpJsonBodyError).cause).toBeInstanceOf(SyntaxError);
  });

  it("creates JSON responses with default or custom content types", async () => {
    const response = jsonResponse({ ok: true }, { status: 201 });
    expect(response.status).toBe(201);
    expect(response.headers.get("content-type")).toBe(
      "application/json; charset=utf-8",
    );
    expect(await response.json()).toEqual({ ok: true });

    const custom = jsonResponse("x", {
      headers: { "content-type": "application/problem+json" },
    });
    expect(custom.headers.get("content-type")).toBe("application/problem+json");
  });
});
