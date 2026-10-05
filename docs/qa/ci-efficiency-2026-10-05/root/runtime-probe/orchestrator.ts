import { readdir, readFile } from 'node:fs/promises';
const cwd = '/Users/tien/Developer/ChronoShift';
const out = cwd + '/docs/qa/ci-efficiency-2026-10-05/root/runtime-probe';
const records: any[] = [];
const hash = (bytes: Uint8Array) => new Bun.CryptoHasher('sha256').update(bytes).digest('hex');
async function files(dir: string, prefix = ''): Promise<any[]> {
  const all: any[] = [];
  for (const entry of await readdir(dir + '/' + prefix, { withFileTypes: true })) {
    const path = prefix + entry.name;
    if (entry.isDirectory()) all.push(...await files(dir, path + '/'));
    else all.push({ path, sha256: hash(await readFile(dir + '/' + path)) });
  }
  return all.sort((a, b) => a.path.localeCompare(b.path));
}
const before = await files(cwd + '/dist');
const base = { began: new Date().toISOString(), environment: { platform: process.platform, arch: process.arch, bun: Bun.version }, scope: 'Local matched CLI runtime hypothesis only. Same locked Playwright, five normal-motion profiles, four workers, the unchanged complete themed-choice journey at three widths and two themes, same fixed root-base local artifact. Does not establish hosted runner savings or monthly target.', build: before, config: await readFile(cwd + '/.ci-runtime-probe.config.ts', 'utf8'), runs: records };
await Bun.write(out + '/orchestrator.ts', await readFile(import.meta.path));
for (const [index, runtime] of ['bun', 'node', 'node', 'bun'].entries()) {
  const output = out + '/' + (index + 1) + '-' + runtime;
  const args = ['mise', 'exec', '--', runtime, 'node_modules/@playwright/test/cli.js', 'test', '--config=.ci-runtime-probe.config.ts', 'e2e/controls.spec.ts', '--grep=themed choices align'];
  const began = new Date().toISOString();
  const start = performance.now();
  const child = Bun.spawn(args, { cwd, env: { ...process.env, CI: '1', PLAYWRIGHT_PORT: '4294', RUNTIME_PROBE_OUTPUT: output }, stdout: Bun.file(output + '.log'), stderr: Bun.file(output + '.stderr') });
  const code = await child.exited;
  records.push({ index: index + 1, runtime, args, output, began, ended: new Date().toISOString(), elapsedMs: performance.now() - start, exitCode: code });
  await Bun.write(out + '/summary.json', JSON.stringify({ ...base, ended: new Date().toISOString(), afterBuild: await files(cwd + '/dist') }, null, 2));
  console.log(JSON.stringify(records.at(-1)));
  if (code) { process.exitCode = code; break; }
}
