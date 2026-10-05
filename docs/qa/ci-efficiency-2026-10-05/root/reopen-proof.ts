import { writeFileSync } from 'node:fs';
const records = [];
for (const [variant, port] of [['before', '4276'], ['prototype', '4278']]) {
  const start = new Date().toISOString();
  const cmd = ['bunx', '--bun', 'playwright', 'test', '--config=docs/qa/ci-efficiency-2026-10-05/root/reopen.config.ts', '--grep', 'hovering timezone suggestions'];
  const p = Bun.spawn(cmd, {env: {...process.env, PLAYWRIGHT_PORT: port}, stdout: 'pipe', stderr: 'pipe'});
  const [out, err, code] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text(), p.exited]);
  writeFileSync(`${import.meta.dir}/reopen-${variant}-final.log`, out + err);
  records.push({variant, port, start, end: new Date().toISOString(), cmd, code});
  writeFileSync(`${import.meta.dir}/reopen-proof.json`, JSON.stringify(records, null, 2));
  console.log(JSON.stringify(records.at(-1)));
}
