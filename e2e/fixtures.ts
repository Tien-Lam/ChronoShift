import { test as base, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import type { BrowserContext } from "@playwright/test";
type Origin = { url: string; stop: () => Promise<void> };
export const test = base.extend<{
  origin: Origin | undefined;
  isolatedOrigin: boolean;
}>({
  isolatedOrigin: [false, { option: true }],
  // Playwright 1.63's WebKit offline flag rejects even literal SW responses:
  // https://github.com/microsoft/playwright/issues/42775
  // Stop a dedicated origin instead, and prove uncached network access fails.
  origin: async ({ browserName, isolatedOrigin }, use) => {
    if (browserName !== "webkit" && !isolatedOrigin) {
      await use(undefined);
      return;
    }
    const child = spawn("bun", ["scripts/serve-web.ts"], {
      env: { ...process.env, PORT: "0", CHRONOSHIFT_TEST_SERVER: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stopped = false;
    const stop = async () => {
      if (stopped) return;
      stopped = true;
      const done = new Promise<void>((resolve) =>
        child.once("close", () => resolve()),
      );
      child.kill("SIGTERM");
      await done;
    };
    try {
      const url = await new Promise<string>((resolve, reject) => {
        let output = "";
        child.stdout.on("data", (chunk) => {
          output += chunk;
          const match = output.match(/http:\/\/127\.0\.0\.1:\d+\//);
          if (match) resolve(match[0]);
        });
        child.once("error", reject);
        child.once("exit", (code) => {
          if (code) reject(new Error(`Preview exited: ${code}`));
        });
      });
      await use({ url, stop });
    } finally {
      await stop();
    }
  },
  baseURL: async ({ origin }, use) =>
    use(
      origin?.url ||
        `http://127.0.0.1:${process.env.PLAYWRIGHT_PORT || "4173"}`,
    ),
});
export async function disconnect(
  context: BrowserContext,
  origin: Origin | undefined,
) {
  if (origin) {
    await origin.stop();
    await expect(
      context.request.get(origin.url + "uncached", { timeout: 2000 }),
    ).rejects.toThrow();
  } else await context.setOffline(true);
}
export { expect };
