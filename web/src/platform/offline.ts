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
    let verifiedUncontrolled = false;
    const uncontrolledError =
      "Offline access is unavailable in this tab. Reload normally to restore it.";
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
    let probeRetryTimer: ReturnType<typeof setTimeout> | undefined;
    let probeRetries = 0;
    // A slow or rejected first installation must not stop lifecycle observers.
    const readyTimer = setTimeout(() => {
      if (!signal.aborted && !confirmed) {
        startupExpired = true;
        publish(
          {
            ready: false,
            error: verifiedUncontrolled
              ? uncontrolledError
              : "Offline setup is incomplete. Reconnect and reload to try again.",
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
        clearTimeout(probeRetryTimer);
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
    const pendingUpdate = () => {
      const candidate = registration.waiting || installedUpdate;
      const incumbent =
        registration.active || navigator.serviceWorker.controller;
      // First installation can briefly expose waiting before activation. It
      // becomes an update only when it replaces a different existing worker.
      return candidate?.state === "installed" &&
        incumbent &&
        candidate !== incumbent
        ? candidate
        : undefined;
    };
    const retryProbe = (controller: ServiceWorker) => {
      if (
        signal.aborted ||
        confirmed ||
        probeRetryTimer ||
        probeRetries >= 2 ||
        navigator.serviceWorker.controller !== controller
      )
        return;
      probeRetryTimer = setTimeout(
        () => {
          probeRetryTimer = undefined;
          if (
            signal.aborted ||
            navigator.serviceWorker.controller !== controller
          )
            return;
          probeRetries++;
          inspect("probe-retry");
        },
        probeRetries === 0 ? 1000 : 3000,
      );
    };
    const inspect = (reason = "lifecycle") => {
      if (signal.aborted) return;
      if (reason !== "probe-retry") {
        clearTimeout(probeRetryTimer);
        probeRetryTimer = undefined;
        probeRetries = 0;
      }
      diagnostic("offline.probe-start", {
        reason,
        attempt: probeRetries + 1,
        controlled: !!navigator.serviceWorker.controller,
        online: navigator.onLine,
        activeState: registration.active?.state || "absent",
        installingState: registration.installing?.state || "absent",
        waitingState: registration.waiting?.state || "absent",
        controllerState: navigator.serviceWorker.controller?.state || "absent",
        activeMatches: registration.active?.scriptURL === script,
        controllerMatches:
          navigator.serviceWorker.controller?.scriptURL === script,
        scopeMatches: registration.scope === scope,
      });
      // A waiting update is usable even while the current cache check is slow
      // or fails. Never couple this recovery action to its response/deadline.
      if (pendingUpdate()) publish(lastState, "update-available");
      // Installation and pageshow may overlap. Only the latest probe may
      // change readiness; close superseded ports and their timeout together.
      cancelInspection();
      const currentController = navigator.serviceWorker.controller;
      // A force-refreshed page can be uncontrolled even though its exact
      // registration is already activated. Re-registering cannot rerun activate.
      const controller =
        currentController ||
        (registration.scope === scope &&
        registration.active?.state === "activated"
          ? registration.active
          : null);
      if (controller?.scriptURL === script) {
        const uncontrolled = !currentController;
        const channel = new MessageChannel();
        let settled = false;
        const current = () =>
          !settled &&
          !signal.aborted &&
          (navigator.serviceWorker.controller === controller ||
            (uncontrolled &&
              !navigator.serviceWorker.controller &&
              registration.active === controller &&
              controller.state === "activated"));
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
          retryProbe(controller);
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
              claim: event.data.claim,
              controlled: navigator.serviceWorker.controller === controller,
            });
            confirmed =
              event.data.ready === true &&
              navigator.serviceWorker.controller === controller;
            verifiedUncontrolled = event.data.ready === true && !confirmed;
            if (confirmed) clearTimeout(readyTimer);
            if (confirmed) clearTimeout(probeRetryTimer);
            const update = pendingUpdate();
            publish(
              {
                ready: confirmed,
                ...(update ? { update } : {}),
                ...(!confirmed
                  ? {
                      error: verifiedUncontrolled
                        ? uncontrolledError
                        : "Offline setup is incomplete. Reconnect and reload to try again.",
                    }
                  : {}),
              },
              verifiedUncontrolled ? "client-uncontrolled" : "probe-result",
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
              claimUncontrolled: uncontrolled,
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
          retryProbe(controller);
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
