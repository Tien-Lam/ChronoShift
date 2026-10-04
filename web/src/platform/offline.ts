import {
  diagnostic,
  detailedLogsEnabled,
  onDetailedLogsEnabled,
} from "./diagnostics";
export interface OfflineState {
  ready: boolean;
  update?: ServiceWorker;
  error?: string;
}
function retryDelay(delay: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, delay);
    const abort = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
  });
}
export async function setupOffline(
  report: (state: OfflineState) => void,
  signal: AbortSignal,
): Promise<void> {
  if (
    !("serviceWorker" in navigator) ||
    !import.meta.env.PROD ||
    signal.aborted
  )
    return;
  try {
    const scope = new URL(import.meta.env.BASE_URL, location.href).href;
    const script = new URL("sw.js", scope).href;
    let registration: ServiceWorkerRegistration;
    let retries = 0;
    for (;;) {
      try {
        diagnostic("offline.register-attempt", {
          attempt: retries + 1,
          online: navigator.onLine,
        });
        registration = await navigator.serviceWorker.register(script, {
          scope,
          updateViaCache: "none",
        });
        break;
      } catch (error) {
        // An update check can fail while the existing offline app is intact.
        const existing = await navigator.serviceWorker.getRegistration(scope);
        if (existing?.scope === scope) {
          registration = existing;
          break;
        }
        if (!navigator.onLine || retries >= 2 || signal.aborted) throw error;
        await retryDelay(retries === 0 ? 1000 : 3000, signal);
        retries++;
      }
    }
    if (signal.aborted) return;
    diagnostic("offline.registered", {
      controlled: !!navigator.serviceWorker.controller,
      online: navigator.onLine,
    });
    let confirmed = false;
    let lastState: OfflineState = { ready: false };
    const publish = (state: OfflineState, reason: string) => {
      const { update: _ignored, ...rest } = state;
      const update = pendingUpdate();
      lastState = { ...rest, ...(update ? { update } : {}) };
      diagnostic("offline.state", {
        reason,
        ready: state.ready,
        updateAvailable: !!update,
      });
      report(lastState);
    };
    let startupExpired = false;
    let installedUpdate: ServiceWorker | undefined;
    let cancelInspection = () => {};
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    // A slow or rejected first installation must not stop lifecycle observers.
    const readyTimer = setTimeout(() => {
      if (!signal.aborted && !confirmed) {
        startupExpired = true;
        publish(
          {
            ready: false,
            error:
              "Offline setup is incomplete. Reconnect and reload to try again.",
          },
          "startup-deadline",
        );
      }
    }, 15000);
    signal.addEventListener(
      "abort",
      () => {
        cancelInspection();
        clearTimeout(readyTimer);
        clearTimeout(retryTimer);
      },
      { once: true },
    );
    const retryInstall = () => {
      if (
        signal.aborted ||
        navigator.serviceWorker.controller ||
        !navigator.onLine ||
        retryTimer ||
        retries >= 2
      )
        return;
      retryTimer = setTimeout(
        async () => {
          retryTimer = undefined;
          if (signal.aborted || navigator.serviceWorker.controller) return;
          retries++;
          try {
            // A rejected first install can unregister itself; update() then
            // rejects forever. Register again to recover that initial failure.
            registration = await navigator.serviceWorker.register(script, {
              scope,
              updateViaCache: "none",
            });
            if (signal.aborted) return;
            registration.addEventListener("updatefound", watchInstall, {
              signal,
            });
            watchInstall();
          } catch {
            retryInstall();
          }
        },
        retries === 0 ? 1000 : 3000,
      );
    };
    const pendingUpdate = () =>
      registration.waiting ||
      (installedUpdate?.state === "installed" &&
      navigator.serviceWorker.controller &&
      installedUpdate !== navigator.serviceWorker.controller
        ? installedUpdate
        : undefined);
    const inspect = (reason = "lifecycle") => {
      if (signal.aborted) return;
      diagnostic("offline.probe-start", {
        reason,
        controlled: !!navigator.serviceWorker.controller,
        online: navigator.onLine,
      });
      // A waiting update is usable even while the current cache check is slow
      // or fails. Never couple this recovery action to its response/deadline.
      if (pendingUpdate()) publish(lastState, "update-available");
      // Installation and pageshow may overlap. Only the latest probe may
      // change readiness; close superseded ports and their timeout together.
      cancelInspection();
      const controller = navigator.serviceWorker.controller;
      if (controller?.scriptURL === script) {
        const channel = new MessageChannel();
        let settled = false;
        const current = () =>
          !settled &&
          !signal.aborted &&
          navigator.serviceWorker.controller === controller;
        const close = () => {
          settled = true;
          clearTimeout(timeout);
          channel.port1.close();
        };
        const timeout = setTimeout(() => {
          if (current()) {
            confirmed = false;
            publish(
              {
                ready: false,
                error:
                  "Offline assets could not be confirmed. Reconnect and reload to try again.",
              },
              "probe-timeout",
            );
          }
          close();
        }, 15000);
        cancelInspection = close;
        const started = performance.now();
        channel.port1.onmessage = (event) => {
          if (current()) {
            diagnostic("offline.probe-result", {
              ready: event.data.ready === true,
              version: event.data.version,
              elapsedMs: performance.now() - started,
              assets: event.data.diagnostics?.unavailable,
              repair: event.data.diagnostics?.repair,
            });
            confirmed = event.data.ready === true;
            if (confirmed) clearTimeout(readyTimer);
            const update = pendingUpdate();
            publish(
              {
                ready: confirmed,
                ...(update ? { update } : {}),
                ...(!confirmed
                  ? {
                      error:
                        "Offline setup is incomplete. Reconnect and reload to try again.",
                    }
                  : {}),
              },
              "probe-result",
            );
          }
          close();
        };
        try {
          controller.postMessage(
            {
              type: "CHECK_READY",
              repairIfMissing: navigator.onLine,
              detailedLogs: detailedLogsEnabled(),
            },
            [channel.port2],
          );
        } catch {
          if (current()) {
            confirmed = false;
            publish(
              {
                ready: false,
                error:
                  "Offline assets could not be confirmed. Reconnect and reload to try again.",
              },
              "probe-post-failed",
            );
          }
          close();
          channel.port2.close();
        }
      } else {
        confirmed = false;
        publish(
          {
            ready: false,
            ...(startupExpired
              ? {
                  error:
                    "Offline setup is incomplete. Reconnect and reload to try again.",
                }
              : {}),
          },
          "no-controller",
        );
      }
    };
    const stopDetailed = onDetailedLogsEnabled(() =>
      inspect("detailed-logs-enabled"),
    );
    signal.addEventListener("abort", stopDetailed, { once: true });
    inspect("startup");
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => inspect("controller-change"),
      {
        signal,
      },
    );
    window.addEventListener(
      "online",
      () => {
        retries = 0;
        inspect("online");
        retryInstall();
      },
      { signal },
    );
    window.addEventListener("pageshow", () => inspect("page-show"), { signal });
    const watched = new WeakSet<ServiceWorker>();
    const watchInstall = () => {
      const installing = registration.installing;
      if (!installing) {
        inspect();
        retryInstall();
        return;
      }
      if (watched.has(installing)) return;
      watched.add(installing);
      const changed = () => {
        // Some engines deliver installed before exposing registration.waiting.
        // Retain the worker identity until activation instead of losing the notice.
        diagnostic("offline.install-state", { state: installing.state });
        if (installing.state === "installed") installedUpdate = installing;
        if (installing.state === "redundant") retryInstall();
        inspect();
      };
      installing.addEventListener("statechange", changed, { signal });
      changed();
    };
    registration.addEventListener("updatefound", watchInstall, { signal });
    watchInstall();
    if (registration.waiting) publish({ ready: confirmed }, "waiting-update");
  } catch {
    diagnostic("offline.register-failed", {
      reason: "registration-unavailable",
      online: navigator.onLine,
    });
    if (!signal.aborted)
      report({
        ready: false,
        error:
          "Offline setup is incomplete. Reconnect and reload to try again.",
      });
  }
}
