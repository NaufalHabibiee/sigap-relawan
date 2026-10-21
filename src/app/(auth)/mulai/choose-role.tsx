"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { SEEKER_TYPES } from "@/lib/constants";

export function ChooseRole() {
  const router = useRouter();
  const [role, setRole] = useState<"volunteer" | "seeker">("volunteer");
  const [type, setType] = useState("komunitas");
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    const { error } = await createBrowserSupabase().rpc("choose_role", { p_role: role, p_seeker_type: type });
    setPending(false);
    if (error) return toast.error(error.message);
    router.push(role === "seeker" ? "/p/profil" : "/r/profil");
    router.refresh();
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {(
          [
            ["volunteer", "Jadi relawan", "border-guyub bg-guyub text-white"],
            ["seeker", "Cari relawan", "border-ink bg-ink text-paper"],
          ] as const
        ).map(([value, label, active]) => (
          <button
            key={value}
            type="button"
            aria-pressed={role === value}
            onClick={() => setRole(value)}
            className={`rounded-xl border-2 p-4 text-left font-semibold ${role === value ? active : "border-line bg-surface"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {role === "seeker" && (
        <div>
          <label htmlFor="type" className="label">
            Jenis penyelenggara
          </label>
          <select id="type" className="field" value={type} onChange={(e) => setType(e.target.value)}>
            {SEEKER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      )}
      <button type="button" onClick={submit} disabled={pending} className="btn btn-ink w-full py-3">
        {pending ? "Menyimpan…" : "Lanjutkan"}
      </button>
    </div>
  );
}
