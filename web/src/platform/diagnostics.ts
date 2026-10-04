// Opt-in console diagnostics. Only this flag is stored; no event history is kept.
const key = "chronoshift-detailed-logs";
let enabled = false;
try {
  enabled = sessionStorage.getItem(key) === "true";
} catch {}
const listeners = new Set<() => void>();
export const detailedLogsEnabled = () => enabled;
export function onDetailedLogsEnabled(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function setDetailedLogs(value: boolean) {
  enabled = value;
  try {
    if (value) sessionStorage.setItem(key, "true");
    else sessionStorage.removeItem(key);
  } catch {}
  if (value) {
    diagnostic("diagnostics.enabled");
    listeners.forEach((listener) => listener());
  }
}
type Fields = {
  reason?: string;
  attempt?: number;
  ready?: boolean;
  online?: boolean;
  controlled?: boolean;
  activeMatches?: boolean;
  controllerMatches?: boolean;
  scopeMatches?: boolean;
  updateAvailable?: boolean;
  state?: ServiceWorkerState;
  activeState?: ServiceWorkerState | "absent";
  controllerState?: ServiceWorkerState | "absent";
  installingState?: ServiceWorkerState | "absent";
  waitingState?: ServiceWorkerState | "absent";
  claim?: unknown;
  version?: string;
  elapsedMs?: number;
  requestId?: number;
  characters?: number;
  results?: number;
  warnings?: number;
  field?: "source-zone" | "target-zone";
  assets?: unknown;
  repair?: unknown;
};
// Copy a bounded whitelist into the console, never arbitrary worker payloads,
// Error objects, input, parsed values, preferences or navigation/query URLs.
export function diagnostic(event: string, fields: Fields = {}) {
  if (!enabled) return;
  const safe: Record<string, unknown> = { at: new Date().toISOString() };
  for (const name of [
    "ready",
    "online",
    "controlled",
    "activeMatches",
    "controllerMatches",
    "scopeMatches",
    "updateAvailable",
  ] as const)
    if (typeof fields[name] === "boolean") safe[name] = fields[name];
  for (const name of [
    "attempt",
    "elapsedMs",
    "requestId",
    "characters",
    "results",
    "warnings",
  ] as const)
    if (typeof fields[name] === "number" && Number.isFinite(fields[name]))
      safe[name] = Math.max(0, Math.round(fields[name]));
  for (const name of [
    "reason",
    "version",
    "state",
    "field",
    "activeState",
    "controllerState",
    "installingState",
    "waitingState",
  ] as const)
    if (
      typeof fields[name] === "string" &&
      /^[a-zA-Z0-9_.-]{1,80}$/.test(fields[name])
    )
      safe[name] = fields[name];
  if (["claimed", "failed", "not-requested"].includes(fields.claim as string))
    safe.claim = fields.claim;
  if (Array.isArray(fields.assets))
    safe.assets = fields.assets
      .filter(
        (path): path is string =>
          typeof path === "string" &&
          path.length < 240 &&
          /^\/(?:[a-zA-Z0-9_-]+\/)*(?:assets\/[a-zA-Z0-9_.-]+|fonts\/[a-zA-Z0-9_.-]+|index\.html|release\.json|manifest\.webmanifest|third-party-notices\.txt|icon(?:-[0-9]+)?\.(?:png|svg))$/.test(
            path,
          ),
      )
      .slice(0, 32);
  if (fields.repair && typeof fields.repair === "object") {
    const repair = fields.repair as Record<string, unknown>;
    safe.repair = {};
    for (const name of ["reused", "fetched"])
      if (typeof repair[name] === "number" && Number.isFinite(repair[name]))
        (safe.repair as Record<string, unknown>)[name] = Math.max(
          0,
          Math.round(repair[name]),
        );
    if (
      typeof repair.failure === "string" &&
      [
        "fetch-failed",
        "http-error",
        "unexpected-type",
        "release-mismatch",
        "storage-error",
      ].includes(repair.failure)
    )
      (safe.repair as Record<string, unknown>).failure = repair.failure;
  }
  console.info(`[ChronoShift] ${event}`, safe);
}
