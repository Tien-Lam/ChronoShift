import { afterEach, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type {
  FullConfig,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";
import AttemptReporter from "../e2e/attempt-reporter";

const directories: string[] = [];
afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});
function fixture() {
  const directory = mkdtempSync(join(tmpdir(), "chronoshift-attempt-"));
  directories.push(directory);
  const outputFile = join(directory, "attempt-failures.json");
  const reporter = new AttemptReporter({ outputFile });
  reporter.onBegin({} as FullConfig);
  const testCase = {
    id: "chromium-legacy-update",
    titlePath: () => ["chromium", "legacy explicit update"],
    expectedStatus: "passed",
    parent: { project: () => ({ name: "chromium" }) },
    location: { file: "e2e/uncontrolled.spec.ts", line: 1, column: 1 },
  } as unknown as TestCase;
  const attempt = (overrides: Partial<TestResult> = {}) =>
    ({
      status: "failed",
      retry: 0,
      startTime: new Date("2026-10-05T19:26:50.123Z"),
      duration: 10001,
      workerIndex: 3,
      parallelIndex: 1,
      attachments: [],
      ...overrides,
    }) as TestResult;
  return { reporter, testCase, attempt, directory, outputFile };
}

test("first failed lifecycle bytes and runner identity survive a successful retry", () => {
  const { reporter, testCase, attempt, outputFile } = fixture();
  const body = Buffer.from(
    '{"snapshot":{"controller":{"state":"activated"},"ready":"false"},"logs":[],"captureFailed":false}',
  );
  const attachments = [
    { name: "offline-lifecycle", contentType: "application/json", body },
    {
      name: "screenshot",
      contentType: "image/png",
      path: "/first-attempt/screenshot.png",
    },
    {
      name: "unrelated-inline-payload",
      contentType: "application/json",
      body: Buffer.from("PRIVATE-SENTINEL"),
    },
  ];
  reporter.onTestEnd(testCase, attempt({ attachments }));
  reporter.onTestEnd(
    testCase,
    attempt({ status: "passed", retry: 1, attachments: [] }),
  );
  const marker = JSON.parse(readFileSync(outputFile, "utf8"));
  expect(marker).toHaveLength(1);
  expect(marker[0]).toMatchObject({
    project: "chromium",
    testId: "chromium-legacy-update",
    startTime: "2026-10-05T19:26:50.123Z",
    durationMs: 10001,
    workerIndex: 3,
    parallelIndex: 1,
    retry: 0,
    location: testCase.location,
  });
  expect(marker[0].attachments).toHaveLength(2);
  const retained = marker[0].attachments.find(
    (attachment: { name: string }) => attachment.name === "offline-lifecycle",
  );
  expect(readFileSync(retained.path)).toEqual(body);
  expect(retained).toMatchObject({
    bytes: body.byteLength,
    sha256: createHash("sha256").update(body).digest("hex"),
  });
  expect(attachments[0].body).toBe(body);
  expect(JSON.stringify(marker)).not.toContain("PRIVATE-SENTINEL");
});

test("failed retries keep distinct lifecycle files and new runs remove stale evidence", () => {
  const { reporter, testCase, attempt, directory, outputFile } = fixture();
  for (const retry of [0, 1]) {
    reporter.onTestEnd(
      testCase,
      attempt({
        retry,
        attachments: [
          {
            name: "offline-lifecycle",
            contentType: "application/json",
            body: Buffer.from(JSON.stringify({ retry })),
          },
        ],
      }),
    );
  }
  const marker = JSON.parse(readFileSync(outputFile, "utf8"));
  const paths = marker.map((entry: any) => entry.attachments[0].path);
  expect(new Set(paths).size).toBe(2);
  expect(
    paths.map((path: string) => JSON.parse(readFileSync(path, "utf8"))),
  ).toEqual([{ retry: 0 }, { retry: 1 }]);
  reporter.onBegin({} as FullConfig);
  expect(existsSync(outputFile)).toBe(false);
  expect(existsSync(join(directory, "attempt-diagnostics"))).toBe(false);
});

test("expected failures and skips create neither marker nor lifecycle files", () => {
  const { reporter, testCase, attempt, directory, outputFile } = fixture();
  const attachments = [
    {
      name: "offline-lifecycle",
      contentType: "application/json",
      body: Buffer.from("{}"),
    },
  ];
  reporter.onTestEnd(testCase, attempt({ status: "skipped", attachments }));
  reporter.onTestEnd(
    { ...testCase, expectedStatus: "failed" } as TestCase,
    attempt({ attachments }),
  );
  expect(existsSync(outputFile)).toBe(false);
  expect(readdirSync(directory)).toEqual([]);
});

test("lifecycle byte limits record omissions without clipping JSON or dropping the failure", () => {
  const { reporter, testCase, attempt, directory, outputFile } = fixture();
  const emit = (id: string, size: number) =>
    reporter.onTestEnd(
      { ...testCase, id } as TestCase,
      attempt({
        attachments: [
          {
            name: "offline-lifecycle",
            contentType: "application/json",
            body: Buffer.alloc(size, " "),
          },
        ],
      }),
    );
  emit("oversized", 256 * 1024 + 1);
  for (let i = 0; i < 9; i++) emit(`bounded-${i}`, 256 * 1024);
  const marker = JSON.parse(readFileSync(outputFile, "utf8"));
  expect(marker).toHaveLength(10);
  expect(marker[0].attachments[0]).toMatchObject({
    omitted: "lifecycle-byte-limit",
    maxBytes: 256 * 1024,
  });
  expect(marker[9].attachments[0]).toMatchObject({
    omitted: "lifecycle-run-byte-limit",
    maxBytes: 2 * 1024 * 1024,
  });
  expect(readdirSync(join(directory, "attempt-diagnostics"))).toHaveLength(8);
});
