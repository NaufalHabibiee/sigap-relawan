"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { requestOtp, verifyOtp } from "@/lib/actions/common";

export function PhoneOtp({ phone, verified }: { phone: string | null; verified: boolean }) {
  const [stage, setStage] = useState<"idle" | "sent">("idle");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [value, setValue] = useState(phone ?? "");
  const [code, setCode] = useState("");
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(!verified);

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 font-medium">
          <CheckCircle2 className="size-5 text-guyub" aria-hidden /> {phone} terverifikasi
        </p>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
          Ganti nomor
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <label htmlFor="phone" className="sr-only">
          Nomor HP
        </label>
        <input
          id="phone"
          inputMode="tel"
          autoComplete="tel"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="081234567890"
          className="field max-w-xs"
        />
        <button
          type="button"
          className="btn btn-ink"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await requestOtp(value);
              if (res.error) return void toast.error(res.error);
              setStage("sent");
              setDemoCode(res.demoCode ?? null);
              toast.success("Kode dikirim");
            })
          }
        >
          {stage === "sent" ? "Kirim ulang" : "Kirim kode"}
        </button>
      </div>
      {stage === "sent" && (
        <div className="space-y-2">
          {demoCode && (
            <p className="rounded-lg bg-ladang-wash px-3 py-2 text-sm">
              Mode demo (SMS belum terhubung): kodemu <strong className="font-mono tracking-widest">{demoCode}</strong>
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <label htmlFor="otp" className="sr-only">
              Kode 6 digit
            </label>
            <input
              id="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="6 digit"
              className="field max-w-[10rem] font-mono tracking-widest"
            />
            <button
              type="button"
              className="btn btn-guyub"
              disabled={pending || code.length !== 6}
              onClick={() =>
                start(async () => {
                  const res = await verifyOtp(code);
                  if (res.error) return void toast.error(res.error);
                  toast.success("Nomor HP terverifikasi");
                  setEditing(false);
                })
              }
            >
              Verifikasi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
