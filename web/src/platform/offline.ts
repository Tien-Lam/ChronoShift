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
    const registration = await navigator.serviceWorker.register(
      `${import.meta.env.BASE_URL}sw.js`,
      { scope: import.meta.env.BASE_URL, updateViaCache: "none" },
    );
    let readyTimer: ReturnType<typeof setTimeout>;
    const ready = await Promise.race([
      navigator.serviceWorker.ready,
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
    const pendingUpdate = () =>
      registration.waiting ||
      (installedUpdate?.state === "installed" &&
      navigator.serviceWorker.controller &&
      installedUpdate !== navigator.serviceWorker.controller
        ? installedUpdate
        : undefined);
    const inspect = () => {
      if (signal.aborted) return;
      const controller = navigator.serviceWorker.controller;
      if (controller) {
        const channel = new MessageChannel();
        const timeout = setTimeout(() => {
          channel.port1.close();
          if (
            !signal.aborted &&
            navigator.serviceWorker.controller === controller
          )
            report({
              ready: false,
              error:
                "Offline assets could not be confirmed. Reconnect and reload to try again.",
            });
        }, 15000);
        channel.port1.onmessage = (event) => {
          clearTimeout(timeout);
          if (
            !signal.aborted &&
            navigator.serviceWorker.controller === controller
          ) {
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
          channel.port1.close();
        };
        controller.postMessage(
          { type: "CHECK_READY", repairIfMissing: navigator.onLine },
          [channel.port2],
        );
      } else report({ ready: false });
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
