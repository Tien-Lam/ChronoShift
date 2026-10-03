export interface OfflineState {
  ready: boolean;
  update?: ServiceWorkerRegistration;
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
    const inspect = () => {
      if (signal.aborted) return;
      const controller = navigator.serviceWorker.controller;
      if (controller) {
        const channel = new MessageChannel();
        const timeout = setTimeout(() => {
          channel.port1.close();
          if (!signal.aborted)
            report({
              ready: false,
              error:
                "Offline assets could not be confirmed. Reconnect and reload to try again.",
            });
        }, 3000);
        channel.port1.onmessage = (event) => {
          clearTimeout(timeout);
          confirmed = event.data.ready === true;
          if (!signal.aborted)
            report({
              ready: confirmed,
              ...(registration.waiting ? { update: registration } : {}),
              ...(!confirmed
                ? {
                    error:
                      "Offline setup is incomplete. Reconnect and reload to try again.",
                  }
                : {}),
            });
          channel.port1.close();
        };
        controller.postMessage({ type: "CHECK_READY" }, [channel.port2]);
      } else report({ ready: false });
    };
    if (ready.active) inspect();
    navigator.serviceWorker.addEventListener("controllerchange", inspect, {
      signal,
    });
    window.addEventListener("online", inspect, { signal });
    window.addEventListener("pageshow", inspect, { signal });
    registration.addEventListener(
      "updatefound",
      () => {
        registration.installing?.addEventListener("statechange", inspect, {
          signal,
        });
      },
      { signal },
    );
    if (registration.waiting)
      report({ ready: confirmed, update: registration });
  } catch {
    if (!signal.aborted)
      report({
        ready: false,
        error:
          "Offline setup is incomplete. Reconnect and reload to try again.",
      });
  }
}
