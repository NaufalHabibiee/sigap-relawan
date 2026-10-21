"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="h-section text-3xl">Terjadi kesalahan</h1>
      <p className="mt-3 text-ink-soft">Halaman gagal dimuat. Coba lagi beberapa saat lagi.</p>
      <button type="button" onClick={reset} className="btn btn-ink mt-6">
        Muat ulang
      </button>
    </main>
  );
}
