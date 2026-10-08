import { test, expect } from "bun:test";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

test("preview publication accepts identical trees and rejects merged content differences", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "chronoshift-preview-"));
  const script = resolve("scripts/verify-preview-tree.ts");
  const build = resolve("scripts/build-offline.ts");
  const template = Bun.file("web/sw-template.js");
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
    await mkdir(join(cwd, "dist"));
    await mkdir(join(cwd, "web"));
    await Bun.write(join(cwd, "dist/index.html"), "<head></head>");
    await Bun.write(join(cwd, "web/sw-template.js"), template);
    const built = Bun.spawnSync([process.execPath, build], {
      cwd,
      env: {
        ...process.env,
        BASE_PATH: "/ChronoShift/",
        GITHUB_SHA: git("rev-parse", "HEAD"),
        CHRONOSHIFT_SOURCE_COMMIT: source,
      },
    });
    expect(built.exitCode).toBe(0);
    expect(await Bun.file(join(cwd, "dist/release.json")).json()).toEqual({
      sourceCommit: source,
      base: "/ChronoShift/",
    });
    const worker = await Bun.file(join(cwd, "dist/sw.js")).text();
    // Cloudflare consumes these configuration files instead of serving them.
    // Precaching them would make every fresh offline installation fail.
    expect(worker).not.toContain("/ChronoShift/_headers");
    expect(worker).not.toContain("/ChronoShift/_redirects");
    expect(worker).not.toContain("/ChronoShift/robots.txt");
    expect(worker).not.toContain("/ChronoShift/sitemap.xml");
    expect(await Bun.file(join(cwd, "dist/robots.txt")).text()).toContain(
      "Sitemap: https://timetolocal.com/sitemap.xml",
    );
    expect(await Bun.file(join(cwd, "dist/_headers")).text()).toContain(
      "frame-ancestors 'none'",
    );
    expect(await Bun.file(join(cwd, "dist/_headers")).text()).toContain(
      "/ChronoShift/assets/*",
    );
    await Bun.write(join(cwd, "app.txt"), "different merged content");
    git("add", "app.txt");
    git("commit", "--quiet", "-m", "main introduced another change");
    expect(verify(source).exitCode).not.toBe(0);
    expect(verify("HEAD").exitCode).not.toBe(0);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
