import { test, expect } from "bun:test";
import {
  trustedRun,
  safeArchive,
  releaseMatches,
} from "../scripts/reuse-pages-artifact";
test("publication reuse requires a trusted complete PR verification and exact tree", () => {
  const run = {
    id: 1,
    workflow_id: 2,
    path: ".github/workflows/web.yml",
    event: "pull_request",
    status: "completed",
    conclusion: "success",
    head_sha: "a".repeat(40),
    head_repository: { id: 3 },
  };
  const job = {
    name: "web",
    conclusion: "success",
    steps: [
      "Run bun run format:check",
      "Unit tests and production build",
      "Verify the standalone conversion corpus audit",
      "Run bun run test:browser",
      "Verify repository-subpath deployment",
      "Upload the verified Pages build",
    ].map((name) => ({ name, conclusion: "success" })),
  };
  expect(trustedRun(run, 3, 2, [job])).toBe(true);
  for (const patch of [
    { head_repository: { id: 4 } },
    { workflow_id: 5 },
    { event: "push" },
    { conclusion: "failure" },
    { path: ".github/workflows/other.yml" },
  ])
    expect(trustedRun({ ...run, ...patch }, 3, 2, [job])).toBe(false);
  expect(
    trustedRun(run, 3, 2, [{ ...job, steps: job.steps.slice(0, -1) }]),
  ).toBe(false);
  expect(
    trustedRun(run, 3, 2, [
      {
        ...job,
        steps: job.steps.map((step) => ({ ...step, conclusion: "skipped" })),
      },
    ]),
  ).toBe(false);
  const release = { sourceCommit: "a".repeat(40), base: "/ChronoShift/" };
  expect(releaseMatches(release, "b".repeat(40), "b".repeat(40))).toBe(true);
  expect(releaseMatches(release, "c".repeat(40), "b".repeat(40))).toBe(false);
  expect(
    releaseMatches({ ...release, base: "/" }, "b".repeat(40), "b".repeat(40)),
  ).toBe(false);
  expect(
    safeArchive(
      ["./", "./index.html"],
      ["drwxr-xr-x root/root ./", "-rw-r--r-- root/root ./index.html"],
    ),
  ).toBe(true);
  for (const path of [
    "/absolute",
    "./../escape",
    "./assets/../../escape",
    "./back\\slash",
  ])
    expect(safeArchive([path], ["-rw-r--r-- root/root file"])).toBe(false);
  expect(safeArchive(["./link"], ["lrwxrwxrwx root/root link"])).toBe(false);
});
