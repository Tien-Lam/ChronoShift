import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

for (const failure of [
  "none",
  "commit",
  "request",
  "explicit",
  "transaction-setup",
  "put-setup",
] as const) {
  test(`POST share ${failure} storage outcome settles with one database close`, async () => {
    let fetch!: (event: {
      request: Request;
      respondWith: (response: Promise<Response>) => void;
    }) => void;
    let created!: () => void;
    const transactionCreated = new Promise<void>(
      (resolve) => (created = resolve),
    );
    const operations: string[] = [];
    let closes = 0,
      aborts = 0;
    const error = new DOMException("Storage write failed", "UnknownError");
    const tx: any = {
      error: null,
      abort() {
        aborts++;
        queueMicrotask(() => tx.onabort?.());
      },
      objectStore: () => ({
        clear: () => operations.push("clear-request-success"),
        put(value: { text: string }, key: string) {
          expect(value.text).toBe("April 9, 2026 3pm UTC");
          expect(key).toMatch(/^[a-zA-Z0-9-]+$/);
          if (failure === "put-setup") throw error;
          operations.push("put-request-success");
        },
      }),
    };
    const db = {
      transaction() {
        if (failure === "transaction-setup") throw error;
        created();
        return tx;
      },
      close: () => closes++,
    };
    const template = readFileSync("web/sw-template.js", "utf8")
      .replace("__VERSION__", "share-release")
      .replace("__BASE__", '"/ChronoShift/"')
      .replace("__PRECACHE__", "[]")
      .replace("__INTEGRITY__", "{}")
      .replace("__SHELL__", '"unused"');
    new Function("self", "indexedDB", template)(
      {
        location: { origin: "https://example.test" },
        addEventListener(name: string, handler: typeof fetch) {
          if (name === "fetch") fetch = handler;
        },
      },
      {
        open() {
          const request: any = { result: db };
          queueMicrotask(() => request.onsuccess());
          return request;
        },
      },
    );
    let pending!: Promise<Response>;
    fetch({
      request: new Request("https://example.test/ChronoShift/share", {
        method: "POST",
        body: new URLSearchParams({ text: "April 9, 2026 3pm UTC" }),
      }),
      respondWith: (response) => (pending = response),
    });
    if (failure !== "transaction-setup" && failure !== "put-setup") {
      await transactionCreated;
      expect(operations).toEqual([
        "clear-request-success",
        "put-request-success",
      ]);
      expect(closes).toBe(0);
      if (failure === "none") tx.oncomplete();
      else {
        // Commit failures need not fire any request error. A request error,
        // when present, bubbles before the terminal abort event instead.
        if (failure === "request") {
          tx.onerror?.();
          expect(closes).toBe(0);
        }
        tx.error = failure === "explicit" ? null : error;
        tx.onabort?.();
      }
    }
    const response = await Promise.race([
      pending,
      new Promise<Response>((_resolve, reject) => {
        setTimeout(() => reject(new Error("POST share did not settle")), 100);
      }),
    ]);
    if (failure === "none") {
      expect(response.status).toBe(303);
      expect(response.headers.get("Location")).toMatch(
        /^https:\/\/example\.test\/ChronoShift\/\?share=[a-zA-Z0-9-]+$/,
      );
      expect(response.headers.get("Location")).not.toContain("April");
    } else {
      expect(response.status).toBe(503);
      expect(await response.text()).toBe(
        "This browser cannot receive shared text. Open ChronoShift and paste it.",
      );
    }
    // A setup failure can later dispatch an abort event too. A stale callback
    // must not close or settle the response a second time.
    await Promise.resolve();
    expect(closes).toBe(1);
    expect(aborts).toBe(failure === "put-setup" ? 1 : 0);
  });
}

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

for (const [complete, inside, expectedClaims] of [
  [true, true, 1],
  [false, true, 0],
  [true, false, 0],
] as const) {
  test(`claim requires a verified cache and scoped window: complete=${complete}, inside=${inside}`, async () => {
    const html = "<html>Trusted shell</html>";
    const path = "/ChronoShift/index.html";
    const digest = new Bun.CryptoHasher("sha256").update(html).digest("hex");
    let receive!: (event: any) => void;
    let claims = 0;
    let answer: any;
    const template = readFileSync("web/sw-template.js", "utf8")
      .replace("__VERSION__", "claim-release")
      .replace("__BASE__", '"/ChronoShift/"')
      .replace("__PRECACHE__", JSON.stringify([path]))
      .replace("__INTEGRITY__", JSON.stringify({ [path]: digest }))
      .replace("__SHELL__", () => JSON.stringify(html));
    new Function("self", "caches", template)(
      {
        location: { origin: "https://example.test" },
        clients: {
          claim: async () => {
            claims++;
          },
        },
        addEventListener: (name: string, handler: typeof receive) => {
          if (name === "message") receive = handler;
        },
      },
      {
        open: async () => ({
          match: async () => (complete ? new Response(html) : undefined),
        }),
      },
    );
    let pending!: Promise<void>;
    receive({
      data: { type: "CHECK_READY", claimUncontrolled: true },
      source: {
        type: "window",
        url: `https://example.test/${inside ? "ChronoShift/" : "outside/"}`,
      },
      ports: [
        {
          postMessage: (message: any) => {
            answer = message;
          },
        },
      ],
      waitUntil: (promise: Promise<void>) => {
        pending = promise;
      },
    });
    await pending;
    expect(claims).toBe(expectedClaims);
    expect(answer.ready).toBe(complete);
    expect(answer.claim).toBe(expectedClaims ? "claimed" : "not-requested");
  });
}
