export interface OfflineState {
  ready: boolean;
  update?: ServiceWorker;
  error?: string;
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
    try {
      registration = await navigator.serviceWorker.register(script, {
        scope,
        updateViaCache: "none",
      });
    } catch (error) {
      // An update check can fail while the existing offline app is intact.
      // Confirm that registration's cache instead of declaring it incomplete.
      const existing = await navigator.serviceWorker.getRegistration(scope);
      if (!existing || existing.scope !== scope) throw error;
      registration = existing;
    }
    if (signal.aborted) return;
    let readyTimer: ReturnType<typeof setTimeout>;
    const ready = await Promise.race([
      navigator.serviceWorker.controller?.scriptURL === script
        ? Promise.resolve(registration)
        : navigator.serviceWorker.ready,
      new Promise<never>((_, reject) => {
        readyTimer = setTimeout(
          () => reject(new Error("Offline setup timeout")),
          15000,
        );
      }),
    ]).finally(() => clearTimeout(readyTimer));
    if (signal.aborted) return;
    let confirmed = false;
    let installedUpdate: ServiceWorker | undefined;
    let cancelInspection = () => {};
    signal.addEventListener("abort", () => cancelInspection(), { once: true });
    const pendingUpdate = () =>
      registration.waiting ||
      (installedUpdate?.state === "installed" &&
      navigator.serviceWorker.controller &&
      installedUpdate !== navigator.serviceWorker.controller
        ? installedUpdate
        : undefined);
    const inspect = () => {
      if (signal.aborted) return;
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
            report({
              ready: false,
              error:
                "Offline assets could not be confirmed. Reconnect and reload to try again.",
            });
          }
          close();
        }, 15000);
        cancelInspection = close;
        channel.port1.onmessage = (event) => {
          if (current()) {
            confirmed = event.data.ready === true;
            const update = pendingUpdate();
            report({
              ready: confirmed,
              ...(update ? { update } : {}),
              ...(!confirmed
                ? {
                    error:
                      "Offline setup is incomplete. Reconnect and reload to try again.",
                  }
                : {}),
            });
          }
          close();
        };
        try {
          controller.postMessage(
            { type: "CHECK_READY", repairIfMissing: navigator.onLine },
            [channel.port2],
          );
        } catch {
          if (current()) {
            confirmed = false;
            report({
              ready: false,
              error:
                "Offline assets could not be confirmed. Reconnect and reload to try again.",
            });
          }
          close();
          channel.port2.close();
        }
      } else {
        confirmed = false;
        report({ ready: false });
      }
    };
    if (ready.active) inspect();
    navigator.serviceWorker.addEventListener("controllerchange", inspect, {
      signal,
    });
    window.addEventListener("online", inspect, { signal });
    window.addEventListener("pageshow", inspect, { signal });
    const watchInstall = () => {
      const installing = registration.installing;
      if (!installing) {
        inspect();
        return;
      }
      const changed = () => {
        // Some engines deliver installed before exposing registration.waiting.
        // Retain the worker identity until activation instead of losing the notice.
        if (installing.state === "installed") installedUpdate = installing;
        inspect();
      };
      installing.addEventListener("statechange", changed, { signal });
      changed();
    };
    registration.addEventListener("updatefound", watchInstall, { signal });
    watchInstall();
    if (registration.waiting)
      report({ ready: confirmed, update: registration.waiting });
  } catch {
    if (!signal.aborted)
      report({
        ready: false,
        error:
          "Offline setup is incomplete. Reconnect and reload to try again.",
      });
  }
}
