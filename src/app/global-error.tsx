"use client";

import { useEffect } from "react";

/** Last-resort boundary: replaces the whole document when the root layout itself fails. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="id">
      <body style={{ margin: 0, minHeight: "100dvh", display: "grid", placeItems: "center", background: "#eeece5", color: "#1b2430", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ maxWidth: 420, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 28, margin: 0 }}>Terjadi kesalahan</h1>
          <p style={{ marginTop: 12, lineHeight: 1.5, color: "#46505d" }}>Sigap tidak bisa menampilkan halaman ini. Coba muat ulang; kalau masih gagal, kembali beberapa saat lagi.</p>
          {error.digest && <p style={{ fontSize: 12, color: "#6f7680" }}>Kode: {error.digest}</p>}
          <button onClick={reset} style={{ marginTop: 20, padding: "12px 22px", borderRadius: 999, border: 0, background: "#1b2430", color: "#eeece5", fontWeight: 600, cursor: "pointer" }}>
            Coba lagi
          </button>
        </main>
      </body>
    </html>
  );
}
