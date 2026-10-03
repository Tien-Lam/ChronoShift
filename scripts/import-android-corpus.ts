export {};
// Preserve the Android corpus as input/metadata, not as an accuracy oracle:
// its count expectations predate ambiguity expansion and date-only behavior.
const sourcePath = "app/src/test/java/com/chronoshift/TestData.kt";
const source = await Bun.file(sourcePath).text();
function args(body: string): string[] {
  const out: string[] = [];
  let start = 0,
    depth = 0,
    string = false,
    escape = false;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (string) {
      if (escape) escape = false;
      else if (c === "\\") escape = true;
      else if (c === '"') string = false;
      continue;
    }
    if (c === '"') string = true;
    else if ("([{".includes(c)) depth++;
    else if (")]}".includes(c)) depth--;
    else if (c === "," && depth === 0) {
      out.push(body.slice(start, i).trim());
      start = i + 1;
    }
  }
  if (body.slice(start).trim()) out.push(body.slice(start).trim());
  return out;
}
const cases = [];
let cursor = source.indexOf("internal val testCases");
while ((cursor = source.indexOf("TimestampTestCase(", cursor)) >= 0) {
  const start = cursor + "TimestampTestCase(".length;
  let end = start,
    depth = 1,
    string = false,
    escape = false;
  for (; end < source.length; end++) {
    const c = source[end];
    if (string) {
      if (escape) escape = false;
      else if (c === "\\") escape = true;
      else if (c === '"') string = false;
      continue;
    }
    if (c === '"') string = true;
    else if (c === "(") depth++;
    else if (c === ")" && --depth === 0) break;
  }
  const values = args(source.slice(start, end));
  if (values.length !== 4)
    throw new Error(`Unexpected Kotlin fixture at ${start}`);
  const input = JSON.parse(values[0]),
    description = JSON.parse(values[3]);
  const category =
    [...source.slice(0, cursor).matchAll(/Category\s+(\d+)\s+—\s+([^\n]+)/g)]
      .at(-1)?.[2]
      ?.trim() || "Uncategorized";
  const expected = [...values[2].matchAll(/ExpectedTimestamp\(([^)]*)\)/g)].map(
    (m) => {
      const p = args(m[1]);
      return {
        hour: +p[0],
        minute: p[1] ? +p[1] : 0,
        timezone: p[2] ? JSON.parse(p[2]) : null,
      };
    },
  );
  cases.push({
    id: `android-${String(cases.length + 1).padStart(3, "0")}`,
    input,
    category,
    intendedCoverage:
      /\b(?:EOD|COB|(?:half|quarter)\s+(?:past|to)|\d{1,2}ish)\b/i.test(input)
        ? "correction-required"
        : "deterministic-baseline",
    legacyExpectedCount: +values[1],
    expected,
    description,
  });
  cursor = end + 1;
}
await Bun.write(
  "tests/fixtures/android-corpus.json",
  JSON.stringify(
    {
      source: sourcePath,
      sourceSha256: new Bun.CryptoHasher("sha256").update(source).digest("hex"),
      cases,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Imported ${cases.length} Android inputs and their original metadata.`,
);
