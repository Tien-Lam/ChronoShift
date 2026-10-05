const DB = "chronoshift-handoff";
export function openHandoff(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => {
      r.result.createObjectStore("messages");
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
export async function consumeShare(key: string): Promise<string | undefined> {
  if (!/^[a-zA-Z0-9-]{1,80}$/.test(key)) return;
  const db = await openHandoff();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("messages", "readwrite"),
        store = tx.objectStore("messages");
      const r = store.get(key);
      let value: string | undefined;
      r.onsuccess = () => {
        const entry = r.result;
        if (
          entry &&
          typeof entry.created === "number" &&
          Date.now() - entry.created >= 0 &&
          Date.now() - entry.created < 300_000 &&
          typeof entry.text === "string" &&
          entry.text.length <= 10_000
        )
          value = entry.text;
        store.clear(); // Single-use handoff; remove any abandoned entries too.
      };
      tx.oncomplete = () => resolve(value);
      // A commit failure can abort after every request has succeeded.
      tx.onabort = () =>
        reject(
          tx.error || new DOMException("Share storage aborted", "AbortError"),
        );
    });
  } finally {
    db.close();
  }
}
export async function clearAbandonedShares(): Promise<void> {
  const db = await openHandoff();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("messages", "readwrite");
      tx.objectStore("messages").clear();
      tx.oncomplete = () => resolve();
      tx.onabort = () =>
        reject(
          tx.error || new DOMException("Share storage aborted", "AbortError"),
        );
    });
  } finally {
    db.close();
  }
}
const UPDATE = "chronoshift.update-draft";
export function preserveForUpdate(text: string): boolean {
  if (text.length > 10_000) return false;
  try {
    sessionStorage.setItem(
      UPDATE,
      JSON.stringify({ text, created: Date.now() }),
    );
    return true;
  } catch {
    return false;
  }
}
export function consumeUpdate(): string | undefined {
  try {
    const raw = sessionStorage.getItem(UPDATE);
    sessionStorage.removeItem(UPDATE);
    const entry = raw ? JSON.parse(raw) : undefined;
    return entry &&
      typeof entry.created === "number" &&
      Date.now() - entry.created >= 0 &&
      Date.now() - entry.created < 300_000 &&
      typeof entry.text === "string" &&
      entry.text.length <= 10_000
      ? entry.text
      : undefined;
  } catch {
    return;
  }
}
