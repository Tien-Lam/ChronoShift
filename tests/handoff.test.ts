import { expect, test } from "bun:test";
import {
  clearAbandonedShares,
  consumeShare,
} from "../web/src/platform/handoff";

// Request success does not establish a committed transaction. A disk-write
// failure can fire only transaction abort, after every request has succeeded.
function storageFixture() {
  let opened = 0,
    closed = 0,
    clears = 0;
  let created!: () => void;
  const transactionCreated = new Promise<void>(
    (resolve) => (created = resolve),
  );
  const request: any = {
    result: { text: "April 9, 2026 3pm UTC", created: Date.now() },
  };
  const tx: any = {
    error: null,
    objectStore: () => ({
      get: () => request,
      clear: () => clears++,
    }),
  };
  let setupError: unknown;
  const db = {
    transaction() {
      if (setupError) throw setupError;
      created();
      return tx;
    },
    close: () => closed++,
  };
  return {
    indexedDB: {
      open() {
        opened++;
        const open: any = { result: db };
        queueMicrotask(() => open.onsuccess());
        return open;
      },
    },
    transactionCreated,
    tx,
    read: () => request.onsuccess(),
    failSetup: (error: unknown) => (setupError = error),
    get counts() {
      return { opened, closed, clears };
    },
  };
}

async function withStorage(
  fixture: ReturnType<typeof storageFixture>,
  run: () => Promise<void>,
) {
  const original = globalThis.indexedDB;
  globalThis.indexedDB = fixture.indexedDB as unknown as IDBFactory;
  try {
    await run();
  } finally {
    globalThis.indexedDB = original;
  }
}

function bounded<T>(pending: Promise<T>): Promise<T> {
  return Promise.race([
    pending,
    new Promise<T>((_resolve, reject) => {
      setTimeout(() => reject(new Error("Handoff did not settle")), 100);
    }),
  ]);
}

for (const operation of ["consume", "clear"] as const) {
  const run = (): Promise<string | void> =>
    operation === "consume" ? consumeShare("test-key") : clearAbandonedShares();
  for (const failure of ["commit", "request", "explicit"] as const) {
    test(`${operation} handoff rejects ${failure} abort and closes its database`, async () => {
      const fixture = storageFixture();
      await withStorage(fixture, async () => {
        const pending = run();
        await fixture.transactionCreated;
        if (operation === "consume") fixture.read();
        const error =
          failure === "explicit"
            ? null
            : new DOMException("Storage commit failed", "UnknownError");
        // A request error bubbles before abort. It is not itself the terminal
        // transaction event, and its transaction error may still be null.
        if (failure === "request") {
          fixture.tx.onerror?.();
          expect(fixture.counts.closed).toBe(0);
        }
        fixture.tx.error = error;
        fixture.tx.onabort?.();
        const rejected = await bounded(pending).then(
          () => null,
          (reason) => reason,
        );
        if (error) expect(rejected).toBe(error);
        else expect(rejected).toBeInstanceOf(DOMException);
        expect(rejected.name).toBe(
          failure === "explicit" ? "AbortError" : "UnknownError",
        );
        expect(fixture.counts).toEqual({ opened: 1, closed: 1, clears: 1 });
      });
    });
  }

  test(`${operation} handoff waits for commit and closes after success`, async () => {
    const fixture = storageFixture();
    await withStorage(fixture, async () => {
      let settled = false;
      const pending = run().then((value) => {
        settled = true;
        return value;
      });
      await fixture.transactionCreated;
      if (operation === "consume") fixture.read();
      await Promise.resolve();
      expect(settled).toBe(false);
      expect(fixture.counts.closed).toBe(0);
      fixture.tx.oncomplete();
      expect(await bounded(pending)).toBe(
        operation === "consume" ? "April 9, 2026 3pm UTC" : undefined,
      );
      expect(fixture.counts).toEqual({ opened: 1, closed: 1, clears: 1 });
    });
  });

  test(`${operation} handoff closes after synchronous transaction setup failure`, async () => {
    const fixture = storageFixture();
    const error = new DOMException(
      "Storage connection closed",
      "InvalidStateError",
    );
    fixture.failSetup(error);
    await withStorage(fixture, async () => {
      await expect(bounded(run())).rejects.toBe(error);
      expect(fixture.counts).toEqual({ opened: 1, closed: 1, clears: 0 });
    });
  });
}
