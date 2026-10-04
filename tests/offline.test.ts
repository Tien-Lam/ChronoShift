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
  const asset = "/ChronoShift/assets/worker-broken.js";
  const template = readFileSync("web/sw-template.js", "utf8")
    .replace("__VERSION__", "expected-release")
    .replace("__BASE__", '"/ChronoShift/"')
    .replace("__PRECACHE__", JSON.stringify([asset]))
    .replace("__INTEGRITY__", JSON.stringify({ [asset]: "0".repeat(64) }));
  const generated = template.replace("__SHELL__", '"unused"');
  const execute = new Function("self", "caches", "fetch", "Request", generated);
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
        headers: { "Content-Type": "text/javascript" },
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
    "Offline preparation failed: release-mismatch, /ChronoShift/assets/worker-broken.js (expected expected-release)",
  );
  expect(fetched).toEqual([
    "https://example.test/ChronoShift/assets/worker-broken.js",
    "https://example.test/ChronoShift/assets/worker-broken.js?chronoshift-release=expected-release",
  ]);
  expect(deleted).toEqual(["chronoshift-staging-expected-release"]);
});

for (const corrupted of [false, true]) {
  test(`embedded navigation shell ${corrupted ? "rejects inconsistent build bytes" : "installs exact HTML without a network document"}`, async () => {
    const html =
      '<!doctype html><html><head><meta name="referrer" content="no-referrer"></head><body>Trusted $& shell</body></html>';
    const path = "/ChronoShift/index.html";
    const digest = new Bun.CryptoHasher("sha256").update(html).digest("hex");
    const stored = new Map<string, Response>();
    const temporary = new Map<string, Response>();
    let install!: (event: {
      waitUntil: (promise: Promise<void>) => void;
    }) => void;
    let fetches = 0;
    const template = readFileSync("web/sw-template.js", "utf8")
      .replace("__VERSION__", "shell-release")
      .replace("__BASE__", '"/ChronoShift/"')
      .replace("__PRECACHE__", JSON.stringify([path]))
      .replace("__INTEGRITY__", JSON.stringify({ [path]: digest }))
      .replace("__SHELL__", () =>
        JSON.stringify(corrupted ? html + "changed" : html),
      );
    new Function("self", "caches", "fetch", template)(
      {
        addEventListener: (name: string, handler: typeof install) => {
          if (name === "install") install = handler;
        },
      },
      {
        open: async (key: string) => {
          const entries = key.includes("staging") ? temporary : stored;
          return {
            match: async (path: string) => entries.get(path)?.clone(),
            put: async (path: string, response: Response) => {
              entries.set(path, response.clone());
            },
          };
        },
        delete: async () => {
          temporary.clear();
        },
      },
      async () => {
        fetches++;
        throw new Error("Network HTML must not be needed");
      },
    );
    let pending!: Promise<void>;
    install({
      waitUntil: (promise) => {
        pending = promise;
      },
    });
    if (corrupted) {
      await expect(pending).rejects.toThrow(
        "release-mismatch, /ChronoShift/index.html",
      );
      expect(stored.size).toBe(0);
    } else {
      await pending;
      expect(await stored.get(path)!.text()).toBe(html);
      expect(stored.get(path)!.headers.get("content-type")).toBe(
        "text/html; charset=utf-8",
      );
    }
    expect(fetches).toBe(0);
    expect(temporary.size).toBe(0);
  });
}
