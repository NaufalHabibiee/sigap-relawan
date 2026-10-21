"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Link2, Share2 } from "lucide-react";
import { toast } from "sonner";

const subscribe = () => () => {};

/** Native share sheet where available; otherwise a WhatsApp link plus copy-to-clipboard. */
export function ShareButton({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);
  // Empty on the server and during hydration, the real URL afterwards, so the WhatsApp link never mismatches.
  const href = useSyncExternalStore(subscribe, () => window.location.href, () => "");

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // dismissed by the user: fall through to the copy fallback only on real errors below
        return;
      }
    }
    await copy(url);
  }

  async function copy(url = window.location.href) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Tautan disalin");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Tidak bisa menyalin tautan");
    }
  }

  const wa = href ? `https://wa.me/?text=${encodeURIComponent(`${title}\n${text}\n${href}`)}` : "#";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={share} className="btn btn-outline btn-sm">
        <Share2 className="size-4" aria-hidden /> Bagikan
      </button>
      <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
        WhatsApp
      </a>
      <button type="button" onClick={() => copy()} className="btn btn-ghost btn-sm">
        {copied ? <Check className="size-4" aria-hidden /> : <Link2 className="size-4" aria-hidden />} Salin tautan
      </button>
    </div>
  );
}
