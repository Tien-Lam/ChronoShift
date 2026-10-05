import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import type {
  FullConfig,
  Reporter,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";

// A successful retry must not discard the failed attempt's screenshots/context.
// Only unexpected attempts create the upload marker; successful runs stay quiet.
export default class AttemptReporter implements Reporter {
  private readonly failures: object[] = [];
  private outputFile = "";
  constructor(private readonly options: { outputFile?: string } = {}) {}
  onBegin(config: FullConfig) {
    this.outputFile =
      this.options.outputFile ||
      join(config.projects[0].outputDir, "attempt-failures.json");
    this.failures.length = 0;
    rmSync(this.outputFile, { force: true });
  }
  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status === "skipped" || result.status === test.expectedStatus)
      return;
    this.failures.push({
      test: test.titlePath(),
      expected: test.expectedStatus,
      status: result.status,
      retry: result.retry,
      durationMs: result.duration,
      attachments: result.attachments
        .filter((attachment) => attachment.path)
        .map(({ name, path }) => ({ name, path })),
    });
    mkdirSync(dirname(this.outputFile), { recursive: true });
    writeFileSync(this.outputFile, JSON.stringify(this.failures, null, 2));
  }
}
