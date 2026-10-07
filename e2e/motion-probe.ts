import { expect, type Page, type TestInfo } from "@playwright/test";

export type MotionFrame = {
  time: number;
  frameTime: number;
  scrollX: number;
  scrollY: number;
  viewport: {
    width: number;
    height: number;
    layoutWidth: number;
    visualScale: number | null;
  };
  elements: {
    selector: string;
    identity: number;
    x: number;
    y: number;
    width: number;
    height: number;
    opacity: number;
    foreground: string;
    backgrounds: string[];
    layers: { background: string; opacity: number; image: string }[];
    transforms: string[];
    runningAnimations: string[];
    animations: {
      identity: number;
      name: string;
      state: string;
      currentTimeMilliseconds: number | null;
      startTimeMilliseconds: number | null;
      durationMilliseconds: number | string | null;
      delayMilliseconds: number | null;
      iterations: number | null;
      endTimeMilliseconds: number | null;
    }[];
  }[];
};
export type MotionEvidence = {
  timeOrigin: number;
  started: number;
  ended: number;
  frames: MotionFrame[];
  checkpoints: (Omit<MotionFrame, "frameTime"> & { label: string })[];
  actionCompletedAt: number | null;
  observationMilliseconds: number;
  stopReason: "actions-observed" | "limit" | "superseded";
  initialAnimations: MotionFrame["elements"][number]["animations"];
  clock?: {
    units: string;
    performanceNowZeroIntervals: number;
    animationFrameZeroIntervals: number;
    note: string;
  };
  events: {
    time: number;
    type: string;
    name: string;
    target: string;
    elapsedTimeSeconds: number;
    animations: unknown[];
  }[];
  preferences: { time: number; matches: boolean; currentMatches: boolean }[];
};

// Retain the action lifecycle, then a bounded observation tail. A fixed window
// beginning before a slow click/worker commit can miss the presentation entirely.
// This waits only when collecting the completed record, after interaction.
export async function installMotionProbe(
  page: Page,
  initialSelectors: string[] = [],
) {
  await page.addInitScript((selectors) => {
    const state = window as any;
    const identities = new WeakMap<Element, number>();
    let nextIdentity = 1;
    const animationIdentities = new WeakMap<Animation, number>();
    let nextAnimationIdentity = 1;
    const animationInfo = (animation: Animation) => {
      if (!animationIdentities.has(animation))
        animationIdentities.set(animation, nextAnimationIdentity++);
      return {
        identity: animationIdentities.get(animation),
        name:
          (animation as CSSAnimation).animationName ||
          (animation as CSSTransition).transitionProperty ||
          "animation",
        state: animation.playState,
        currentTimeMilliseconds: animation.currentTime,
        startTimeMilliseconds: animation.startTime,
        durationMilliseconds: animation.effect?.getTiming().duration ?? null,
        delayMilliseconds: animation.effect?.getTiming().delay ?? null,
        iterations: animation.effect?.getTiming().iterations ?? null,
        endTimeMilliseconds:
          animation.effect?.getComputedTiming().endTime ?? null,
      };
    };
    let record: any;
    let done: Promise<any>;
    state.beginMotionProbe = (selectors: string[], duration = 500) => {
      record = {
        timeOrigin: performance.timeOrigin,
        started: performance.now(),
        ended: 0,
        frames: [],
        checkpoints: [],
        actionCompletedAt: null,
        observationMilliseconds: duration,
        maximumLifecycleMilliseconds: 10000,
        events: [],
        preferences: [],
        initialAnimations: document.getAnimations().map(animationInfo),
        animationClockUnits:
          "CSS event elapsedTime seconds; Animation currentTime/startTime milliseconds in the document timeline. Raw values retained.",
      };
      const current = record;
      const snapshot = () => ({
        scrollX,
        scrollY,
        viewport: {
          width: innerWidth,
          height: innerHeight,
          layoutWidth: document.documentElement.clientWidth,
          visualScale: visualViewport?.scale ?? null,
        },
        elements: selectors.flatMap((selector) =>
          [...document.querySelectorAll(selector)].map((element) => {
            if (!identities.has(element))
              identities.set(element, nextIdentity++);
            const rect = element.getBoundingClientRect();
            const transforms = [];
            const backgrounds = [];
            const layers = [];
            for (
              let node: Element | null = element;
              node;
              node = node.parentElement
            ) {
              const css = getComputedStyle(node);
              backgrounds.push(css.backgroundColor);
              layers.push({
                background: css.backgroundColor,
                opacity: Number(css.opacity),
                image: css.backgroundImage,
              });
              if (css.transform !== "none") transforms.push(css.transform);
              if (css.translate !== "none")
                transforms.push(`translate:${css.translate}`);
              if (css.scale !== "none") transforms.push(`scale:${css.scale}`);
            }
            return {
              selector,
              identity: identities.get(element),
              x: rect.x + scrollX,
              y: rect.y + scrollY,
              width: rect.width,
              height: rect.height,
              opacity: Number(getComputedStyle(element).opacity),
              foreground: getComputedStyle(element).color,
              backgrounds,
              layers,
              transforms,
              animations: element.getAnimations().map(animationInfo),
              runningAnimations: element
                .getAnimations()
                .filter((animation) => animation.playState === "running")
                .map(
                  (animation) =>
                    (animation as CSSAnimation).animationName || "transition",
                ),
            };
          }),
        ),
      });
      state.captureMotionCheckpoint = (label: string) => {
        if (record !== current || current.ended) return;
        current.checkpoints.push({
          label,
          time: performance.now(),
          ...snapshot(),
        });
      };
      done = new Promise((resolve) => {
        const sample = (frameTime: number) => {
          const time = performance.now();
          if (record !== current) {
            current.ended = time;
            current.stopReason = "superseded";
            resolve(current);
            return;
          }
          current.frames.push({
            time,
            frameTime,
            ...snapshot(),
          });
          const observed =
            current.actionCompletedAt !== null &&
            time - current.actionCompletedAt >= duration;
          if (observed || time - current.started >= 10000) {
            current.ended = time;
            current.stopReason = observed ? "actions-observed" : "limit";
            resolve(current);
          } else requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      });
    };
    state.finishMotionProbe = () => {
      if (!record.ended && record.actionCompletedAt === null) {
        record.actionCompletedAt = performance.now();
        state.captureMotionCheckpoint("actions-complete");
      }
      return done;
    };
    state.motionPreferences = () => record?.preferences ?? [];
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion.addEventListener("change", (event) => {
      if (!record || record.ended) return;
      record.preferences.push({
        time: performance.now(),
        matches: event.matches,
        currentMatches: reducedMotion.matches,
      });
    });
    for (const type of [
      "animationstart",
      "animationend",
      "animationcancel",
      "transitionrun",
      "transitionend",
      "transitioncancel",
    ]) {
      document.addEventListener(
        type,
        (event: Event) => {
          if (!record || record.ended) return;
          const motion = event as AnimationEvent & TransitionEvent;
          record.events.push({
            time: performance.now(),
            type,
            name: motion.animationName || motion.propertyName,
            target:
              (event.target as Element).getAttribute("class") ||
              (event.target as Element).tagName,
            elapsedTimeSeconds: motion.elapsedTime,
            animations: (event.target as Element)
              .getAnimations()
              .map(animationInfo),
          });
        },
        true,
      );
    }
    if (selectors.length) {
      // Start from actual app mount, not navigation/network startup. The first
      // field exists before its entrance animation is sampled or interacted with.
      const mounted = new MutationObserver(() => {
        if (!document.querySelector(selectors[0])) return;
        state.beginMotionProbe(selectors, 650);
        mounted.disconnect();
      });
      mounted.observe(document, { childList: true, subtree: true });
    }
  }, initialSelectors);
}

export async function beginMotionProbe(
  page: Page,
  selectors: string[],
  duration = 500,
) {
  await page.evaluate(
    ({ selectors, duration }) => {
      (window as any).beginMotionProbe(selectors, duration);
    },
    { selectors, duration },
  );
}

export async function captureMotionCheckpoint(page: Page, label: string) {
  await page.evaluate(
    (label) => (window as any).captureMotionCheckpoint(label),
    label,
  );
}

export async function finishMotionProbe(
  page: Page,
  info: TestInfo,
  name: string,
) {
  const record = await page.evaluate<MotionEvidence>(() =>
    (window as any).finishMotionProbe(),
  );
  const pairs = record.frames.slice(1).map((frame, index) => ({
    now: frame.time - record.frames[index].time,
    raf: frame.frameTime - record.frames[index].frameTime,
  }));
  record.clock = {
    units:
      "milliseconds; both raw DOMHighResTimeStamp clock readings preserved",
    performanceNowZeroIntervals: pairs.filter((pair) => pair.now === 0).length,
    animationFrameZeroIntervals: pairs.filter((pair) => pair.raf === 0).length,
    note: "Equal timer readings can reflect browser clock precision; no clamping, time weighting or frame rankings are derived from zero intervals.",
  };
  await info.attach(name, {
    body: JSON.stringify(record, null, 2),
    contentType: "application/json",
  });
  expect(Number.isFinite(record.timeOrigin)).toBe(true);
  expect(record.stopReason).toBe("actions-observed");
  expect(Number.isFinite(record.actionCompletedAt)).toBe(true);
  expect(record.actionCompletedAt!).toBeGreaterThanOrEqual(record.started);
  expect(record.ended - record.actionCompletedAt!).toBeGreaterThanOrEqual(
    record.observationMilliseconds,
  );
  expect(record.ended).toBeGreaterThan(record.started);
  expect(record.frames.length).toBeGreaterThan(2);
  for (let i = 1; i < record.frames.length; i++) {
    // Keep both raw millisecond clocks. Browser timer precision can produce
    // equal readings; preserve zero intervals rather than inventing elapsed time.
    expect(
      record.frames[i].time - record.frames[i - 1].time,
    ).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(record.frames[i].frameTime)).toBe(true);
    expect(
      record.frames[i].frameTime - record.frames[i - 1].frameTime,
    ).toBeGreaterThanOrEqual(0);
  }
  for (const event of record.events) {
    expect(Number.isFinite(event.time)).toBe(true);
    expect(event.time).toBeGreaterThanOrEqual(record.started);
    expect(event.time).toBeLessThanOrEqual(record.ended);
  }
  for (const preference of record.preferences) {
    expect(Number.isFinite(preference.time)).toBe(true);
    expect(preference.time).toBeGreaterThanOrEqual(record.started);
    expect(preference.time).toBeLessThanOrEqual(record.ended);
  }
  for (const [index, checkpoint] of record.checkpoints.entries()) {
    expect(Number.isFinite(checkpoint.time)).toBe(true);
    expect(checkpoint.time).toBeGreaterThanOrEqual(record.started);
    expect(checkpoint.time).toBeLessThanOrEqual(record.ended);
    if (index > 0)
      expect(
        checkpoint.time - record.checkpoints[index - 1].time,
      ).toBeGreaterThanOrEqual(0);
  }
  for (const frame of record.frames) {
    expect(Number.isFinite(frame.time)).toBe(true);
    expect(Number.isFinite(frame.frameTime)).toBe(true);
  }
  for (const frame of [...record.frames, ...record.checkpoints])
    for (const element of frame.elements)
      for (const value of [
        element.x,
        element.y,
        element.width,
        element.height,
        element.opacity,
      ])
        expect(Number.isFinite(value)).toBe(true);
  return record;
}

export function expectStationary(record: MotionEvidence, selectors: string[]) {
  for (const selector of selectors) {
    // Checkpoints are actual synchronous style/geometry measurements, not
    // synthetic rAF timestamps. They retain immediately interrupted owners.
    const elements = [...record.frames, ...record.checkpoints].flatMap(
      (frame) =>
        frame.elements.filter((element) => element.selector === selector),
    );
    expect(elements.length, `${selector} was sampled`).toBeGreaterThan(2);
    for (const identity of new Set(
      elements.map((element) => element.identity),
    )) {
      const same = elements.filter((element) => element.identity === identity);
      for (const property of ["x", "y", "width", "height"] as const) {
        const values = same.map((element) => element[property]);
        expect(
          Math.max(...values) - Math.min(...values),
          `${selector} ${property}`,
        ).toBeLessThanOrEqual(1);
      }
      for (const element of same)
        expect(element.transforms, `${selector} ancestors`).toEqual([]);
    }
  }
}
