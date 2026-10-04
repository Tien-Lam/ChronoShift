import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

test("first installation reports safe asset/release identity before a controller exists", async () => {
  const handlers = new Map<
    string,
    (event: { waitUntil: (pending: Promise<void>) => void }) => void
  >();
  const deleted: string[] = [];
  const fetched: string[] = [];
  const origin = "https://example.test";
  const asset = "/ChronoShift/index.html";
  const template = readFileSync("web/sw-template.js", "utf8")
    .replace("__VERSION__", "expected-release")
    .replace("__BASE__", '"/ChronoShift/"')
    .replace("__PRECACHE__", JSON.stringify([asset]))
    .replace("__INTEGRITY__", JSON.stringify({ [asset]: "0".repeat(64) }));
  const execute = new Function("self", "caches", "fetch", "Request", template);
  execute(
    {
      location: { origin },
      addEventListener: (name: string, listener: any) =>
        handlers.set(name, listener),
    },
    {
      open: async () => ({ match: async () => undefined }),
      delete: async (key: string) => {
        deleted.push(key);
      },
    },
    async (request: Request) => {
      fetched.push(request.url);
      return new Response("Private response body from another deployment", {
        headers: { "Content-Type": "text/html" },
      });
    },
    class extends Request {
      constructor(input: string | URL, init?: RequestInit) {
        super(new URL(input, origin), init);
      }
    },
  );
  let pending!: Promise<void>;
  handlers.get("install")!({
    waitUntil: (promise) => {
      pending = promise;
    },
  });
  const message = await pending.then(
    () => null,
    (error: Error) => error.message,
  );
  expect(message).toBe(
    "Offline preparation failed: release-mismatch, /ChronoShift/index.html (expected expected-release)",
  );
  expect(fetched).toEqual([
    "https://example.test/ChronoShift/index.html",
    "https://example.test/ChronoShift/index.html?chronoshift-release=expected-release",
  ]);
  expect(deleted).toEqual(["chronoshift-staging-expected-release"]);
});
