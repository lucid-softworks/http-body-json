export class HttpJsonBodyError extends Error {
  override readonly name = "HttpJsonBodyError";

  constructor(
    message: string,
    readonly code: "invalid-content-type" | "invalid-json" | "too-large",
    options: ErrorOptions = {},
  ) {
    super(message, options);
  }
}

export type ReadJsonOptions = Readonly<{
  maxBytes?: number;
  requireContentType?: boolean;
}>;

/** Reads and parses a JSON body with optional media-type and size checks. */
export async function readJsonBody<T = unknown>(
  request: Request,
  options: ReadJsonOptions = {},
): Promise<T> {
  const requireContentType = options.requireContentType ?? true;
  const contentType = request.headers.get("content-type") ?? "";
  if (
    requireContentType &&
    !/^application\/(?:[\w.+-]+\+)?json(?:;|$)/iu.test(contentType)
  ) {
    throw new HttpJsonBodyError(
      "Expected a JSON content type",
      "invalid-content-type",
    );
  }
  const text = await request.text();
  const bytes = new TextEncoder().encode(text).byteLength;
  if (options.maxBytes !== undefined && bytes > options.maxBytes) {
    throw new HttpJsonBodyError(
      "JSON body exceeds the configured limit",
      "too-large",
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch (cause) {
    throw new HttpJsonBodyError(
      "Request body is not valid JSON",
      "invalid-json",
      { cause },
    );
  }
}

/** Creates a JSON response without replacing caller-provided headers. */
export function jsonResponse(
  value: unknown,
  init: ResponseInit = {},
): Response {
  const headers = new Headers(init.headers);
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json; charset=utf-8");
  }
  return new Response(JSON.stringify(value), { ...init, headers });
}
