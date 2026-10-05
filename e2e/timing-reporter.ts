import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative } from "node:path";
import type {
  FullConfig,
  FullResult,
  Reporter,
  TestCase,
  TestResult,
  TestStep,
} from "@playwright/test/reporter";

const categories = new Set([
  "expect",
  "fixture",
  "hook",
  "pw:api",
  "test.step",
  "test.attach",
]);
// Playwright 1.63 uses human-readable titles that can include filled text.
// Return only these fixed labels; never copy titles, subtitles or parameters.
const operations = new Map([
  ["Get bounding box", "bounds"],
  ["Set viewport size", "viewport"],
  ["Scroll into view", "scroll"],
  ["Select option", "select"],
  ["Get attribute", "attribute"],
  ["Get inner text", "text-read"],
  ["Get text content", "text-read"],
  ["Get input value", "value-read"],
  ["Wait for timeout", "wait"],
  ["Wait for function", "wait"],
  ["Wait for selector", "wait"],
  ["Wait for event", "wait"],
  ["Wait for load state", "wait"],
  ["Navigate", "navigate"],
  ["GET", "request"],
  ["POST", "request"],
  ["PUT", "request"],
  ["PATCH", "request"],
  ["DELETE", "request"],
  ["HEAD", "request"],
  ["Create context", "context-create"],
  ["Close context", "context-close"],
  ["Create page", "page-create"],
  ["Close page", "page-close"],
  ["Launch browser", "browser-launch"],
  ["Add init script", "init-script"],
  ["Set offline mode", "offline"],
  ["Route requests", "route"],
  ["Fulfill request", "route"],
  ["Abort request", "route"],
  ["Continue request", "route"],
  ["Evaluate", "evaluate"],
  ["Screenshot", "screenshot"],
  ["Reload", "reload"],
  ["Double click", "click"],
  ["Click", "click"],
  ["Tap", "tap"],
  ["Fill", "fill"],
  ["Press", "press"],
  ["Type", "type"],
  ["Insert", "type"],
  ["Hover", "hover"],
  ["Focus", "focus"],
  ["Mouse move", "pointer"],
  ["Mouse wheel", "pointer"],
]);

export function classifyTimingStep(step: Pick<TestStep, "category" | "title">) {
  const category = categories.has(step.category) ? step.category : "other";
  let operation = category === "pw:api" ? "other-api" : category;
  if (category === "pw:api") {
    for (const [prefix, label] of operations) {
      if (step.title === prefix || step.title.startsWith(prefix + " ")) {
        operation = label;
        break;
      }
    }
  }
  return { category, operation };
}

type Aggregate = {
  count: number;
  totalMs: number;
  maxMs: number;
  leafCount: number;
  leafTotalMs: number;
  failedCount: number;
};
type Attempt = {
  categories: Record<string, Aggregate>;
  operations: Record<string, Aggregate>;
};
function add(groups: Record<string, Aggregate>, label: string, step: TestStep) {
  const group = (groups[label] ||= {
    count: 0,
    totalMs: 0,
    maxMs: 0,
    leafCount: 0,
    leafTotalMs: 0,
    failedCount: 0,
  });
  const duration =
    Number.isFinite(step.duration) && step.duration >= 0 ? step.duration : 0;
  group.count++;
  group.totalMs += duration;
  group.maxMs = Math.max(group.maxMs, duration);
  if (step.steps.length === 0) {
    group.leafCount++;
    group.leafTotalMs += duration;
  }
  if (step.error) group.failedCount++;
}

const MAX_ATTEMPTS = 1000;
export default class TimingReporter implements Reporter {
  private config!: FullConfig;
  private pending = new WeakMap<TestResult, Attempt>();
  private attempts: object[] = [];
  private droppedAttempts = 0;
  constructor(private readonly options: { outputFile?: string } = {}) {}
  onBegin(config: FullConfig) {
    this.config = config;
    this.pending = new WeakMap();
    this.attempts = [];
    this.droppedAttempts = 0;
  }
  onStepEnd(_test: TestCase, result: TestResult, step: TestStep) {
    let attempt = this.pending.get(result);
    if (!attempt) {
      attempt = {
        categories: Object.create(null),
        operations: Object.create(null),
      };
      this.pending.set(result, attempt);
    }
    const { category, operation } = classifyTimingStep(step);
    add(attempt.categories, category, step);
    add(attempt.operations, `${category}/${operation}`, step);
  }
  onTestEnd(test: TestCase, result: TestResult) {
    const aggregate = this.pending.get(result) || {
      categories: {},
      operations: {},
    };
    this.pending.delete(result);
    if (this.attempts.length >= MAX_ATTEMPTS) {
      this.droppedAttempts++;
      return;
    }
    const file = relative(this.config.rootDir, test.location.file);
    const project = test.parent.project();
    const projectIndex = this.config.projects.indexOf(project!);
    // Project names are configured metadata, not step/input data. Bound them
    // and use an index if a future configuration uses arbitrary labels.
    const projectName = /^[a-zA-Z0-9_-]{0,64}$/.test(project?.name || "")
      ? project?.name || "default"
      : `project-${projectIndex}`;
    this.attempts.push({
      testId: createHash("sha256").update(test.id).digest("hex").slice(0, 16),
      project: projectName,
      projectIndex,
      location: {
        file:
          !isAbsolute(file) &&
          file !== ".." &&
          !file.startsWith("../") &&
          file.length <= 240
            ? file
            : "<external>",
        line: test.location.line,
        column: test.location.column,
      },
      retry: result.retry,
      status: result.status,
      expectedStatus: test.expectedStatus,
      startTime: result.startTime.toISOString(),
      durationMs: result.duration,
      workerIndex: result.workerIndex,
      parallelIndex: result.parallelIndex,
      ...aggregate,
    });
  }
  onEnd(result: FullResult) {
    const outputFile =
      this.options.outputFile ||
      join(this.config.projects[0].outputDir, "ci-timing.json");
    mkdirSync(dirname(outputFile), { recursive: true });
    writeFileSync(
      outputFile,
      JSON.stringify({
        schemaVersion: 1,
        status: result.status,
        startTime: result.startTime.toISOString(),
        durationMs: result.duration,
        workers: this.config.workers,
        maxAttempts: MAX_ATTEMPTS,
        droppedAttempts: this.droppedAttempts,
        durationSemantics:
          "Step totals are inclusive and overlap nested steps; leaf totals exclude parent steps. Neither is CPU time or test wall time.",
        attempts: this.attempts,
      }),
    );
    // One bounded line rather than event labels or one log per action/test.
    console.log(
      `[ci-timing] ${this.attempts.length} attempts recorded; ${this.droppedAttempts} omitted by the ${MAX_ATTEMPTS}-attempt limit`,
    );
  }
}
