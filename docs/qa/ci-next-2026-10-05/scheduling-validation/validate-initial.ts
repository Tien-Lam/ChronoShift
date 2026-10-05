import { createHash } from "node:crypto";
import { join, resolve } from "node:path";

const root = process.cwd();
const evidence = resolve("docs/qa/ci-next-2026-10-05/scheduling-validation");
const dependencies = process.env.CHRONOSHIFT_VALIDATION_DEPENDENCIES;
if (!dependencies)
  throw new Error(
    "Set CHRONOSHIFT_VALIDATION_DEPENDENCIES to the temporary dependency checkout",
  );
const { Lexer, Parser, Evaluator, data } = await import(
  join(dependencies, "node_modules/@actions/expressions/dist/index.js")
);
const { parseDocument } = await import(
  join(dependencies, "node_modules/yaml/dist/index.js")
);
const began = new Date().toISOString();
const started = performance.now();
console.log(`begin ${began}`);
const sourceFiles = [
  ".github/workflows/web.yml",
  ".github/workflows/pages.yml",
];
const source = await Promise.all(
  sourceFiles.map((file) => Bun.file(file).text()),
);
const documents = source.map((text) => {
  const document = parseDocument(text, { version: "1.2", uniqueKeys: true });
  if (document.errors.length)
    throw new Error(document.errors.map((e) => e.message).join("\n"));
  return document.toJS();
});
const [web, pages] = documents;
const blob = (text: string) =>
  createHash("sha1")
    .update(`blob ${Buffer.byteLength(text)}\0`)
    .update(text)
    .digest("hex");
const sha256 = (text: string) =>
  createHash("sha256").update(text).digest("hex");
const pins = [
  "fb5b017a40bfb2c189aae4563a05988b29b3be7a",
  "d92bca178f4596f578bb4e915924ba3d7fb83082",
];
const identities = sourceFiles.map((file, i) => ({
  file,
  blob: blob(source[i]),
  sha256: sha256(source[i]),
  expectedBlob: pins[i],
}));
for (const identity of identities)
  if (identity.blob !== identity.expectedBlob)
    throw new Error(`Source changed: ${identity.file}`);
await Bun.write(join(evidence, "source-web.yml"), source[0]);
await Bun.write(join(evidence, "source-pages.yml"), source[1]);
const matrix = await Bun.file(join(evidence, "matrix.json")).json();
const defaults = Object.fromEntries(
  Object.entries(web.on.workflow_call.inputs).map(
    ([name, definition]: [string, any]) => [name, definition.default],
  ),
);
const expressions = {
  jobIf: web.jobs.web.if,
  name: web.jobs.web.name,
  timing: web.jobs.web.env.CHRONOSHIFT_CI_TIMING,
  prepare: pages.jobs.prepare.if,
  reuse: pages.jobs.prepare.steps.find((step: any) => step.id === "reuse").if,
  verify: pages.jobs.verify.if,
  deploy: pages.jobs.deploy.if,
};
function expression(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("${{")) {
    if (!trimmed.endsWith("}}"))
      throw new Error("Incomplete expression envelope");
    return trimmed.slice(3, -2).trim();
  }
  return trimmed;
}
function evaluate(text: string, context: any, cancelled = false): any {
  const statuses = new Map([
    [
      "always",
      {
        name: "always",
        minArgs: 0,
        maxArgs: 0,
        call: () => new data.BooleanData(true),
      },
    ],
    [
      "cancelled",
      {
        name: "cancelled",
        minArgs: 0,
        maxArgs: 0,
        call: () => new data.BooleanData(cancelled),
      },
    ],
  ]);
  const tokens = new Lexer(expression(text)).lex().tokens;
  const ast = new Parser(tokens, Object.keys(context), [
    ...statuses.values(),
  ]).parse();
  const converted = JSON.parse(JSON.stringify(context), data.reviver);
  const result = new Evaluator(ast, converted, statuses).evaluate();
  return JSON.parse(JSON.stringify(result, data.replacer));
}
const failures: any[] = [];
function check(id: string, actual: any, expected: any) {
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    failures.push({ id, actual, expected });
}
check("trigger-types", web.on.pull_request.types, matrix.expectedTypes);
check("main-branch-filter", web.on.pull_request.branches, ["main"]);
check("called-web-path", pages.jobs.verify.uses, "./.github/workflows/web.yml");
check("fallback-publication-input", pages.jobs.verify.with, {
  "publish-pages": true,
});
check(
  "job-concurrency-is-canceling",
  web.jobs.web.concurrency["cancel-in-progress"],
  true,
);
check(
  "web-has-no-workflow-concurrency",
  Object.hasOwn(web, "concurrency"),
  false,
);
check("pages-publication-serialization", pages.concurrency, {
  group: "pages-publication",
  "cancel-in-progress": false,
});
check(
  "browser-step-present",
  web.jobs.web.steps.some(
    (step: any) => step.name === "Run bun run test:browser",
  ),
  true,
);

const results = matrix.rows.map((row: any) => {
  const event: any = {};
  if (row.action !== null) event.action = row.action;
  if (row.eventName === "pull_request") {
    event.pull_request = {
      draft: row.draft,
      number: 42,
      labels: row.labels.map((name: string) => ({ name })),
      head: { repo: { full_name: "Tien-Lam/ChronoShift" } },
    };
    if (row.newLabel !== null) event.label = { name: row.newLabel };
  }
  const inherited =
    row.eventName !== "pull_request" ? pages.jobs.verify.with : {};
  const context = {
    github: {
      event_name: row.eventName,
      event,
      repository: "Tien-Lam/ChronoShift",
      ref: row.ref,
    },
    inputs: { ...defaults, ...inherited, ...row.inputs },
  };
  // This checks the parsed subscription for synthetic changed-runtime PRs.
  // Branch/path filters and hosted event delivery are not reimplemented here.
  const trigger =
    row.eventName === "pull_request"
      ? web.on.pull_request.types.includes(row.action)
      : Object.hasOwn(web.on, "workflow_call") &&
        Object.hasOwn(pages.on, row.eventName);
  const actual = {
    trigger,
    jobIf: evaluate(expressions.jobIf, context),
    name: evaluate(expressions.name, context),
    timing: evaluate(expressions.timing, context),
  };
  check(row.id, actual, row.expected);
  const scheduled = trigger && actual.jobIf;
  console.log(
    `${row.id}: trigger=${trigger} if=${actual.jobIf} name=${actual.name} timing=${actual.timing} scheduled=${scheduled}`,
  );
  return {
    ...row,
    context,
    actual,
    scheduled,
    effectiveTiming: scheduled ? actual.timing : "not-running",
  };
});
const pageResults = matrix.pagesCases.map((row: any) => {
  const context = {
    github: {
      event_name: row.event || "push",
      event: {},
      ref: row.ref || "refs/heads/main",
    },
    needs: {
      prepare: {
        result: row.prepare,
        outputs: row.reused === undefined ? {} : { reused: row.reused },
      },
      verify: { result: row.verify },
    },
    inputs: defaults,
  };
  const actual = Object.fromEntries(
    ["prepare", "reuse", "verify", "deploy"].map((key) => [
      key,
      evaluate(
        expressions[key as keyof typeof expressions],
        context,
        row.cancelled,
      ),
    ]),
  );
  check(row.id, actual, row.expected);
  console.log(`${row.id}: ${JSON.stringify(actual)}`);
  return { ...row, context, actual };
});
const versions: any = {};
for (const [name, path] of [
  ["expressions", "@actions/expressions"],
  ["yaml", "yaml"],
]) {
  const pkg = await Bun.file(
    join(dependencies, "node_modules", path, "package.json"),
  ).json();
  versions[name] = {
    name: pkg.name,
    version: pkg.version,
    gitHead: pkg.gitHead || null,
  };
  await Bun.write(
    join(evidence, `dependency-${name}-package.json`),
    JSON.stringify(pkg, null, 2) + "\n",
  );
}
for (const file of ["package.json", "bun.lock"])
  await Bun.write(
    join(evidence, `dependencies-${file}`),
    Bun.file(join(dependencies, file)),
  );
for (let i = 0; i < sourceFiles.length; i++)
  if ((await Bun.file(sourceFiles[i]).text()) !== source[i])
    throw new Error(`Source changed during validation: ${sourceFiles[i]}`);
const ended = new Date().toISOString();
const output = {
  began,
  ended,
  durationMs: performance.now() - started,
  environment: {
    platform: process.platform,
    architecture: process.arch,
    bun: Bun.version,
    dependencies,
    root,
  },
  identities,
  versions,
  expressions,
  triggerTypes: web.on.pull_request.types,
  rows: results,
  pageRows: pageResults,
  failures,
  limits: [
    "Official expression evaluation and YAML parsing only, not GitHub's complete server/workflow compiler.",
    "No implicit success() wrapping, event delivery, path-filter engine, approvals, branch checks, runner allocation, display-name evaluation ordering or concurrency scheduling is simulated.",
    "always()/cancelled() are injected from each declared synthetic row; no other status functions are used.",
    "Raw expression values for unsubscribed events do not imply that a workflow is scheduled.",
    "Inherited push/manual payloads are modeled from official caller-context semantics and actual parsed caller inputs.",
  ],
};
await Bun.write(
  join(evidence, "results.json"),
  JSON.stringify(output, null, 2) + "\n",
);
console.log(
  `end ${ended}; rows=${results.length}; pages=${pageResults.length}; failures=${failures.length}`,
);
if (failures.length) console.error(JSON.stringify(failures, null, 2));
process.exitCode = failures.length ? 1 : 0;
