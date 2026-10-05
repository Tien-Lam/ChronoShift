import { join } from "node:path";
const root = "/Users/tien/Developer/ChronoShift/docs/qa/copy-focus-2026-10-05/code-runtime";
const reports = [];
for (const name of ["initial-report.json", "report.json"]) {
  const report = await Bun.file(join(root, name)).json();
  const attempts: unknown[] = [];
  function walk(suites: any[]) {
    for (const suite of suites) {
      for (const spec of suite.specs || []) for (const test of spec.tests || [])
        for (const result of test.results || []) attempts.push({
          title: spec.title, outcome: test.status, status: result.status,
          retry: result.retry, startTime: result.startTime, duration: result.duration,
          errors: result.errors?.map((error: any) => error.message),
        });
      walk(suite.suites || []);
    }
  }
  walk(report.suites);
  reports.push({ name, stats: report.stats, attempts });
}
const diagnostics = [];
for (const directory of ["initial-results", "results"]) {
  for await (const relative of new Bun.Glob("*/probe-evidence.json").scan(join(root, directory))) {
    const evidence = await Bun.file(join(root, directory, relative)).json();
    for (const [event, fields] of evidence.copyLogs) {
      if (!["[ChronoShift] copy.started", "[ChronoShift] copy.focus-scheduled", "[ChronoShift] copy.focus-skipped", "[ChronoShift] copy.focus-applied"].includes(event)) throw new Error("unexpected event");
      if (Object.keys(fields).some(key => !["at", "requestId", "reason"].includes(key))) throw new Error("unexpected diagnostic field");
      if (typeof fields.requestId !== "number" || !Number.isFinite(fields.requestId)) throw new Error("missing numeric request ID");
      if (fields.reason && !["superseded", "new-interaction", "no-field"].includes(fields.reason)) throw new Error("unexpected reason");
      if (JSON.stringify(fields).includes("April 9") || JSON.stringify(fields).includes("Asia/Tokyo")) throw new Error("input leaked into diagnostic metadata");
    }
    diagnostics.push({ evidence: join(directory, relative), environment: evidence.environment, retry: evidence.retry, status: evidence.status, eventCount: evidence.copyLogs.length, events: evidence.copyLogs.map(([event, fields]: any[]) => ({ event, requestId: fields.requestId, reason: fields.reason })) });
  }
}
const existing = [];
for await (const relative of new Bun.Glob("*/existing-case-environment.json").scan(join(root, "results")))
  existing.push(await Bun.file(join(root, "results", relative)).json());
const summary = { capturedAt: new Date().toISOString(), reports, diagnostics, existing, privacyAudit: "All observed copy diagnostic payloads use only at/requestId/fixed reason; disabled case emitted none. No application storage/network implementation changes are inferred from this console check." };
await Bun.write(join(root, "runtime-summary.json"), JSON.stringify(summary, null, 2) + "\n");
console.log(JSON.stringify({ capturedAt: summary.capturedAt, reports: reports.map(r => ({ name: r.name, stats: r.stats })), diagnosticCases: diagnostics.length, existingOrigin: existing.map(e => e.environment.origin) }));
