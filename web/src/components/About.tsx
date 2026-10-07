import type { ReactNode } from "react";

export const GITHUB_URL = "https://github.com/Tien-Lam/time-to-local";

export function About({
  updateNotice,
  notice,
}: {
  updateNotice: ReactNode;
  notice: string;
}) {
  return (
    <main className="about-page" aria-labelledby="about-title">
      <h1 id="about-title" tabIndex={-1}>
        About Time to Local
      </h1>
      <p>
        Time to Local converts dates and times in messages into your timezone.
        Paste a message, choose a timezone, and copy the result.
      </p>
      <h2>Private and offline</h2>
      <p>
        Conversions happen on your device. Your messages aren’t sent to a
        server. After its first complete online load, the app works offline.
      </p>
      <h2>Open source</h2>
      <p>
        Time to Local is open source under the MIT license. You can inspect the
        code, report a bug, or contribute on GitHub.
      </p>
      <p>
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
          View on GitHub
        </a>
      </p>
      <footer>
        <a href="#converter">Back to converter</a>
      </footer>
      {updateNotice}
      {notice && (
        <div role="status" className="notice">
          {notice}
        </div>
      )}
    </main>
  );
}
