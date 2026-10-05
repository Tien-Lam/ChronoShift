import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";
import type {
  FullConfig,
  Reporter,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";

// A successful retry must not discard the failed attempt's screenshots/context.
// Only unexpected attempts create the upload marker; successful runs stay quiet.
const MAX_LIFECYCLE_BYTES = 256 * 1024;
const MAX_RUN_LIFECYCLE_BYTES = 2 * 1024 * 1024;
export default class AttemptReporter implements Reporter {
  private readonly failures: object[] = [];
  private outputFile = "";
  private lifecycleBytes = 0;
  constructor(private readonly options: { outputFile?: string } = {}) {}
  onBegin(config: FullConfig) {
    this.outputFile =
      this.options.outputFile ||
      join(config.projects[0].outputDir, "attempt-failures.json");
    this.failures.length = 0;
    this.lifecycleBytes = 0;
    rmSync(this.outputFile, { force: true });
    rmSync(join(dirname(this.outputFile), "attempt-diagnostics"), {
      recursive: true,
      force: true,
    });
  }
  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status === "skipped" || result.status === test.expectedStatus)
      return;
    const attachments: object[] = result.attachments
      .filter((attachment) => attachment.path)
      .map(({ name, path }) => ({ name, path }));
    for (const attachment of result.attachments) {
      // Playwright keeps body attachments inline in its HTML report. Also
      // retain this fixed, input-free lifecycle snapshot as directly readable
      // bytes, tied to the failed attempt rather than its successful retry.
      if (
        attachment.name !== "offline-lifecycle" ||
        attachment.contentType !== "application/json" ||
        !attachment.body
      )
        continue;
      const bytes = attachment.body;
      const perAttemptLimit = bytes.byteLength > MAX_LIFECYCLE_BYTES;
      if (
        perAttemptLimit ||
        this.lifecycleBytes + bytes.byteLength > MAX_RUN_LIFECYCLE_BYTES
      ) {
        attachments.push({
          name: attachment.name,
          omitted: perAttemptLimit
            ? "lifecycle-byte-limit"
            : "lifecycle-run-byte-limit",
          bytes: bytes.byteLength,
          maxBytes: perAttemptLimit
            ? MAX_LIFECYCLE_BYTES
            : MAX_RUN_LIFECYCLE_BYTES,
        });
        continue;
      }
      const identity = createHash("sha256")
        .update(test.id)
        .digest("hex")
        .slice(0, 32);
      const path = join(
        dirname(this.outputFile),
        "attempt-diagnostics",
        `${identity}-retry-${result.retry}.json`,
      );
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, bytes);
      this.lifecycleBytes += bytes.byteLength;
      attachments.push({
        name: attachment.name,
        path,
        contentType: attachment.contentType,
        bytes: bytes.byteLength,
        sha256: createHash("sha256").update(bytes).digest("hex"),
      });
    }
    this.failures.push({
      test: test.titlePath(),
      testId: test.id,
      project: test.parent.project()?.name,
      location: test.location,
      expected: test.expectedStatus,
      status: result.status,
      retry: result.retry,
      startTime: result.startTime.toISOString(),
      durationMs: result.duration,
      workerIndex: result.workerIndex,
      parallelIndex: result.parallelIndex,
      attachments,
    });
    mkdirSync(dirname(this.outputFile), { recursive: true });
    writeFileSync(this.outputFile, JSON.stringify(this.failures, null, 2));
  }
}
