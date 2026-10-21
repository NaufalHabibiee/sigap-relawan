"use client";

import { FileText } from "lucide-react";
import { toast } from "sonner";
import { openPrivateFile } from "@/lib/upload";

export function PrivateFileLink({ path, label }: { path: string; label: string }) {
  return (
    <button
      type="button"
      onClick={() => openPrivateFile(path).catch((e) => toast.error(e.message))}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:underline"
    >
      <FileText className="size-4" aria-hidden /> {label}
    </button>
  );
}
