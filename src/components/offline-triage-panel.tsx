"use client";

import { useState } from "react";
import { Cpu, ShieldAlert, WifiOff } from "lucide-react";
import { triageOffline, type OfflineTriage } from "@/lib/offline-triage";

const STYLE: Record<OfflineTriage["urgency"], string> = {
  rendah: "bg-guyub-wash text-guyub-deep",
  sedang: "bg-ladang-wash text-[#6b5410]",
  tinggi: "bg-sigap-wash text-sigap-ink",
  kritis: "bg-danger-wash text-danger",
};

export function OfflineTriagePanel() {
  const [text, setText] = useState("");
  const [res, setRes] = useState<OfflineTriage | null>(null);

  return (
    <section className="panel space-y-4 p-5 sm:p-7">
      <div>
        <h2 className="h-section inline-flex items-center gap-2 text-lg">
          <WifiOff className="size-5 text-ink" aria-hidden /> Mode luring: triase di perangkat
        </h2>
        <p className="text-sm text-ink-muted">
          Untuk lokasi bencana tanpa sinyal. Penilaian urgensi dan risiko berjalan langsung di HP/laptop ini, tanpa internet dan tanpa server. Coba matikan Wi-Fi, lalu tekan tombol.
        </p>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={400}
        className="field"
        aria-label="Kebutuhan untuk triase luring"
        placeholder="Contoh: banjir sejak semalam, air sedada, ada bayi dan lansia terjebak di lantai dua, butuh 8 orang segera"
      />
      <button type="button" className="btn btn-ink btn-sm" disabled={text.trim().length < 5} onClick={() => setRes(triageOffline(text))}>
        <Cpu className="size-4" aria-hidden /> Nilai di perangkat
      </button>
      {res && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className={`rounded-full px-3 py-1 font-semibold ${STYLE[res.urgency]}`}>Urgensi: {res.urgency}</span>
            {res.quota && <span className="rounded-full bg-surface px-3 py-1 ring-1 ring-line">{res.quota} relawan</span>}
            <span className="text-ink-muted">
              Selesai dalam {res.ms} ms di perangkat, 0 byte dikirim ke internet
            </span>
          </div>
          {res.signals.length > 0 && <p className="text-sm text-ink-soft">Sinyal terdeteksi: {res.signals.join(", ")}.</p>}
          {res.risk_flags.length > 0 && (
            <div className="rounded-xl border-2 border-danger bg-danger-wash p-4 text-sm text-danger">
              <p className="inline-flex items-center gap-1.5 font-semibold">
                <ShieldAlert className="size-4" aria-hidden /> Periksa sebelum disebarkan
              </p>
              <ul className="mt-1 list-disc pl-5">
                {res.risk_flags.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-xs text-ink-muted">
            Prototipe awal memakai penilaian leksikon berbobot. Tahap berikutnya: model AI ringan terkuantisasi yang berjalan di akselerator AI (NPU) ponsel, lalu hasilnya disinkronkan ke Sigap saat sinyal kembali.
          </p>
        </div>
      )}
    </section>
  );
}
