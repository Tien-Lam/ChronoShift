// A tested PR merge may publish the branch only when every file/blob/mode is
// identical. Never use an ancestry check as a substitute for this proof.
const source = Bun.argv[2];
if (!source || !/^[a-f0-9]{40}$/.test(source))
  throw new Error("Provide the full publishing branch commit SHA");
function tree(ref: string): string {
  const result = Bun.spawnSync(["git", "rev-parse", `${ref}^{tree}`]);
  if (result.exitCode !== 0) throw new Error(`Cannot resolve ${ref}`);
  return result.stdout.toString().trim();
}
const tested = tree("HEAD"),
  publishing = tree(source);
if (tested !== publishing)
  throw new Error(
    "The PR merge differs from the publishing branch. Update the branch from main before publishing its preview.",
  );
console.log(`Verified identical source tree ${tested} for ${source}`);
