import { test, expect } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

test("preview publication accepts identical trees and rejects merged content differences", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "chronoshift-preview-"));
  const script = resolve("scripts/verify-preview-tree.ts");
  const git = (...args: string[]) => {
    const result = Bun.spawnSync(
      [
        "git",
        "-c",
        "commit.gpgsign=false",
        "-c",
        "core.hooksPath=/dev/null",
        ...args,
      ],
      { cwd },
    );
    if (result.exitCode !== 0) throw new Error(result.stderr.toString());
    return result.stdout.toString().trim();
  };
  const verify = (sha: string) =>
    Bun.spawnSync([process.execPath, script, sha], { cwd });
  try {
    git("init", "--quiet");
    git("config", "user.name", "ChronoShift test");
    git("config", "user.email", "fixture@example.invalid");
    await Bun.write(join(cwd, "app.txt"), "tested content");
    git("add", "app.txt");
    git("commit", "--quiet", "-m", "publishing branch");
    const source = git("rev-parse", "HEAD");
    git(
      "commit",
      "--quiet",
      "--allow-empty",
      "-m",
      "distinct commit, same tree",
    );
    expect(git("rev-parse", "HEAD")).not.toBe(source);
    expect(verify(source).exitCode).toBe(0);
    await Bun.write(join(cwd, "app.txt"), "different merged content");
    git("add", "app.txt");
    git("commit", "--quiet", "-m", "main introduced another change");
    expect(verify(source).exitCode).not.toBe(0);
    expect(verify("HEAD").exitCode).not.toBe(0);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
