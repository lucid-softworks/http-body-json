# `@lucid-softworks/http-body-json`

JSON request parsing with media-type and encoded-size checks.

```ts
import { jsonResponse, readJsonBody } from "@lucid-softworks/http-body-json";

const request = new Request("https://example.com/users", {
  body: JSON.stringify({ name: "Ada" }),
  headers: { "content-type": "application/json" },
  method: "POST",
});
const input = await readJsonBody(request, { maxBytes: 64_000 });
const response = jsonResponse(input, { status: 201 });
```

`application/json` and structured `+json` types are accepted. Invalid media
types, syntax, and limits have distinct `HttpJsonBodyError` codes.
