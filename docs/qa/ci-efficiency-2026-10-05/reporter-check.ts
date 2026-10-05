import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type {
  FullConfig,
  FullResult,
  TestCase,
  TestResult,
  TestStep,
} from "@playwright/test/reporter";
import TimingReporter, {
  classifyTimingStep,
} from "../../../e2e/timing-reporter";

const started = new Date();
const output = join(
  mkdtempSync(join(tmpdir(), "chronoshift-timing-")),
  "timing.json",
);
const secret = "PRIVATE-FILL-SELECTION-ERROR-DO-NOT-EXPORT";
const project = { name: "chromium", outputDir: tmpdir() };
const config = {
  rootDir: process.cwd(),
  workers: 4,
  projects: [project],
} as unknown as FullConfig;
const test = {
  id: `private test title ${secret}`,
  title: secret,
  location: {
    file: join(process.cwd(), "e2e/controls.spec.ts"),
    line: 55,
    column: 0,
  },
  expectedStatus: "passed",
  parent: { project: () => project },
} as unknown as TestCase;
const result = (retry: number, status: TestResult["status"]) =>
  ({
    retry,
    status,
    startTime: started,
    duration: 1234,
    workerIndex: 2,
    parallelIndex: 1,
    error: { message: secret },
    stderr: [secret],
    stdout: [secret],
    attachments: [{ name: secret, path: secret }],
  }) as unknown as TestResult;
const step = (
  category: string,
  title: string,
  duration: number,
  children: TestStep[] = [],
  failed = false,
) =>
  ({
    category,
    title,
    subtitle: secret,
    duration,
    steps: children,
    error: failed ? { message: secret } : undefined,
  }) as unknown as TestStep;

// Includes the human-readable title spelling used by pinned Playwright 1.63.
assert.deepEqual(classifyTimingStep(step("pw:api", `Fill "${secret}"`, 10)), {
  category: "pw:api",
  operation: "fill",
});
assert.equal(
  classifyTimingStep(step("pw:api", `Select option ${secret}`, 1)).operation,
  "select",
);
assert.equal(
  classifyTimingStep(step("pw:api", "Navigate", 1)).operation,
  "navigate",
);
assert.equal(
  classifyTimingStep(step("pw:api", "POST", 1)).operation,
  "request",
);
assert.equal(
  classifyTimingStep(step("pw:api", secret, 1)).operation,
  "other-api",
);
assert.equal(classifyTimingStep(step(secret, secret, 1)).category, "other");
assert.equal(
  classifyTimingStep(step("test.step", `Click ${secret}`, 1)).operation,
  "test.step",
);
assert.equal(
  classifyTimingStep(step("pw:api", "Clickbait private", 1)).operation,
  "other-api",
);

const reporter = new TimingReporter({ outputFile: output });
reporter.onBegin(config);
const failed = result(0, "failed");
const child = step("pw:api", `Fill "${secret}"`, 10, [], true);
reporter.onStepEnd(test, failed, child);
reporter.onStepEnd(test, failed, step("test.step", secret, 20, [child], true));
reporter.onStepEnd(
  test,
  failed,
  step("pw:api", "Fill private second value", 5),
);
reporter.onStepEnd(test, failed, step("pw:api", secret, Number.NaN));
reporter.onStepEnd(test, failed, step("__proto__", secret, 3));
reporter.onTestEnd(test, failed);
const retry = result(1, "passed");
reporter.onStepEnd(test, retry, step("pw:api", `Screenshot ${secret}`, 7));
reporter.onTestEnd(test, retry);
reporter.onTestEnd(test, result(0, "skipped"));
const full = {
  status: "passed",
  startTime: started,
  duration: 3000,
} as FullResult;
reporter.onEnd(full);
let json = await Bun.file(output).text();
let data = JSON.parse(json);
assert.equal(json.includes(secret), false);
assert.equal(json.includes("private second value"), false);
assert.equal(json.includes("private test title"), false);
assert.equal(data.attempts.length, 3);
assert.deepEqual(
  data.attempts.map((a: any) => [a.retry, a.status]),
  [
    [0, "failed"],
    [1, "passed"],
    [0, "skipped"],
  ],
);
assert.equal(data.attempts[0].project, "chromium");
assert.equal(data.attempts[0].location.file, "e2e/controls.spec.ts");
assert.equal(data.attempts[0].durationMs, 1234);
assert.equal(data.attempts[0].startTime, started.toISOString());
assert.deepEqual(data.attempts[0].operations["pw:api/fill"], {
  count: 2,
  totalMs: 15,
  maxMs: 10,
  leafCount: 2,
  leafTotalMs: 15,
  failedCount: 1,
});
assert.equal(data.attempts[0].categories["test.step"].leafTotalMs, 0);
assert.equal(data.attempts[0].categories["test.step"].totalMs, 20);
assert.equal(data.attempts[0].categories.other.totalMs, 3);
assert.equal(data.attempts[0].operations["pw:api/other-api"].totalMs, 0);
assert.deepEqual(data.attempts[1].categories["pw:api"], {
  count: 1,
  totalMs: 7,
  maxMs: 7,
  leafCount: 1,
  leafTotalMs: 7,
  failedCount: 0,
});
assert.deepEqual(data.attempts[2].operations, {});

// Reset/reuse, outside-root paths and overflow remain explicit and bounded.
reporter.onBegin(config);
const external = {
  ...test,
  location: { file: "/outside/private.ts", line: 1, column: 0 },
} as TestCase;
for (let i = 0; i < 1003; i++)
  reporter.onTestEnd(external, result(0, "passed"));
reporter.onEnd(full);
json = await Bun.file(output).text();
data = JSON.parse(json);
assert.equal(data.attempts.length, 1000);
assert.equal(data.droppedAttempts, 3);
assert.equal(data.attempts[0].location.file, "<external>");
assert.equal(json.includes("/outside/private.ts"), false);
console.log(
  JSON.stringify({
    status: "passed",
    startedAt: started.toISOString(),
    completedAt: new Date().toISOString(),
    scope:
      "Synthetic public reporter events; no browser or performance measurement",
    checks: [
      "fixed operation labels",
      "private payload omission",
      "counts/sums/max/leaf/error aggregation",
      "attempt/retry isolation",
      "actual supplied result metadata",
      "skipped attempt",
      "state reset",
      "external path redaction",
      "bounded attempt overflow",
    ],
  }),
);
