import {
  webkit,
  devices,
} from "/Users/tien/Developer/ChronoShift/node_modules/@playwright/test/index.mjs";
const root = "http://127.0.0.1:4264/";
const browser = await webkit.launch();
const hybrid = process.argv[2] === "mouse";
const record: any = {
  start: new Date().toISOString(),
  browser: browser.version(),
  profile: hybrid ? "WebKit iPhone viewport, mouse capability" : "iPhone 13",
  cases: [],
};
const context = await browser.newContext({
  ...devices["iPhone 13"],
  ...(hybrid ? { hasTouch: false } : {}),
  locale: "en-AU",
  timezoneId: "Australia/Sydney",
});
await context.addInitScript(() => {
  (window as any).selectionEvents = [];
  for (const kind of [
    "input",
    "keydown",
    "blur",
    "pointerover",
    "pointerdown",
    "click",
  ])
    document.addEventListener(
      kind,
      (e: any) => {
        if (
          e.target?.id === "target-zone" ||
          e.target?.closest?.('[role="option"]')
        )
          (window as any).selectionEvents.push({
            at: performance.now(),
            kind,
            key: e.key,
            value: (document.querySelector("#target-zone") as HTMLInputElement)
              ?.value,
            target: e.target.id,
            option: e.target
              ?.closest?.('[role="option"]')
              ?.getAttribute("data-value"),
            focused: document
              .querySelector('[role="option"][data-focused]')
              ?.getAttribute("data-value"),
            active: (
              document.querySelector("#target-zone") as HTMLInputElement
            )?.getAttribute("aria-activedescendant"),
          });
      },
      true,
    );
});
for (const action of [
  "typed-canonical",
  "hover-then-tab",
  "hover-then-outside",
  "pointer-selection",
  "keyboard-selection",
  "typed-alias",
  "custom-offset",
]) {
  const page = await context.newPage();
  const c: any = { action, start: new Date().toISOString(), states: [] };
  record.cases.push(c);
  const snap = async (label: string) =>
    c.states.push({
      label,
      ...(await page.evaluate(() => ({
        value: (document.querySelector("#target-zone") as HTMLInputElement)
          ?.value,
        expanded: document
          .querySelector("#target-zone")
          ?.getAttribute("aria-expanded"),
        focused: document
          .querySelector('[role="option"][data-focused]')
          ?.getAttribute("data-value"),
        selected: Array.from(
          document.querySelectorAll('[role="option"][aria-selected="true"]'),
          (e) => e.getAttribute("data-value"),
        ),
        options: Array.from(
          document.querySelectorAll('[role="option"]'),
          (e) => ({
            value: e.getAttribute("data-value"),
            focused: e.hasAttribute("data-focused"),
          }),
        ),
        hero: document.querySelector(".hero-time")?.textContent,
      }))),
    });
  try {
    await page.goto(root);
    await page
      .getByLabel("Message with a date or time")
      .fill("April 9, 2026 3pm UTC");
    const input = page.getByLabel("Convert to", { exact: true });
    await input.fill("CST");
    await input.press("Tab");
    await input.fill(
      action === "typed-alias"
        ? "osaka"
        : action === "custom-offset"
          ? "UTC+05:45"
          : "Asia/Tokyo",
    );
    await snap("typed-before-leave");
    if (action.startsWith("hover-")) {
      await page.mouse.move(0, 0);
      await page.locator('[role="option"][data-value="osaka"]').hover();
      await snap("after-hover");
    }
    if (action === "hover-then-outside")
      await page.getByLabel("Message with a date or time").click();
    else if (action === "pointer-selection")
      await page.locator('[role="option"][data-value="osaka"]').click();
    else if (action === "keyboard-selection") {
      await input.press("ArrowDown");
      await snap("keyboard-focused");
      await input.press("Enter");
    } else await input.press("Tab");
    await snap("after-leave");
    c.events = await page.evaluate(() => (window as any).selectionEvents);
    c.result = "complete";
  } catch (e: any) {
    c.result = "error";
    c.error = e.message;
  }
  c.end = new Date().toISOString();
  await page.close();
}
record.end = new Date().toISOString();
await Bun.write(
  "/tmp/chronoshift-selection-adversarial/" +
    (hybrid ? "mouse-probe" : "probe") +
    ".json",
  JSON.stringify(record, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    record.cases.map((c) => ({
      action: c.action,
      result: c.result,
      error: c.error,
      states: c.states.map((s) => ({
        label: s.label,
        value: s.value,
        focused: s.focused,
        expanded: s.expanded,
      })),
    })),
    null,
    2,
  ),
);
await browser.close();
