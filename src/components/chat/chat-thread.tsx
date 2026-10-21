"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Megaphone, Paperclip, Send, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { markThreadRead } from "@/lib/actions/common";
import { SCAM_PATTERN } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { DOC_TYPES, openPrivateFile, uploadFile } from "@/lib/upload";

export type ChatMessage = {
  id: string;
  sender_id: string | null;
  kind: "user" | "system" | "announcement";
  body: string | null;
  attachment_path: string | null;
  attachment_name: string | null;
  created_at: string;
};

export function ChatThread({
  appId,
  viewerId,
  initial,
  otherName,
  disabledReason,
}: {
  appId: string;
  viewerId: string;
  initial: ChatMessage[];
  otherName: string;
  disabledReason: string | null;
}) {
  const [messages, setMessages] = useState(initial);
  const [seen, setSeen] = useState(initial);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pending, start] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  if (seen !== initial) {
    setSeen(initial);
    setMessages(initial);
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel(`thread:${appId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `application_id=eq.${appId}` }, (payload) => {
        const m = payload.new as ChatMessage;
        setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        if (m.sender_id !== viewerId) void markThreadRead(appId);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [appId, viewerId]);

  const scammy = messages.some((m) => m.sender_id !== viewerId && m.body && SCAM_PATTERN.test(m.body));

  function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body && !file) return;
    start(async () => {
      const supabase = createBrowserSupabase();
      let attachment: { path: string; name: string } | null = null;
      try {
        if (file) attachment = { path: await uploadFile("private-docs", `chat/${appId}`, file, DOC_TYPES), name: file.name.slice(0, 120) };
      } catch (err) {
        return void toast.error((err as Error).message);
      }
      const { data, error } = await supabase
        .from("messages")
        .insert({ application_id: appId, sender_id: viewerId, body: body || null, attachment_path: attachment?.path ?? null, attachment_name: attachment?.name ?? null })
        .select("id, sender_id, kind, body, attachment_path, attachment_name, created_at")
        .single();
      if (error) {
        // P0001 carries a user-facing Indonesian message (e.g. the rate limit); anything else is a locked or blocked thread.
        return void toast.error(error.code === "P0001" ? error.message : "Pesan tidak terkirim. Percakapan mungkin dikunci atau diblokir.");
      }
      setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data as ChatMessage]));
      setText("");
      setFile(null);
    });
  }

  return (
    <>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-5" aria-live="polite">
        {scammy && (
          <p className="flex gap-2 rounded-xl bg-danger-wash px-3 py-2 text-sm text-danger">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            Pesan di percakapan ini menyebut transfer atau biaya. Sigap tidak pernah memungut biaya — jangan kirim uang, dan laporkan jika mencurigakan.
          </p>
        )}
        {messages.map((m) => {
          if (m.kind === "system")
            return (
              <p key={m.id} className="mx-auto max-w-md text-center text-xs text-ink-muted">
                {m.body} · {formatDateTime(m.created_at)}
              </p>
            );
          const mine = m.sender_id === viewerId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[0.95rem] ${
                  m.kind === "announcement" ? "border border-ladang bg-ladang-wash text-ink" : mine ? "rounded-br-md bg-ink text-paper" : "rounded-bl-md border border-line bg-paper"
                }`}
              >
                {m.kind === "announcement" && (
                  <p className="mb-1 inline-flex items-center gap-1 text-xs font-semibold">
                    <Megaphone className="size-3.5" aria-hidden /> Pengumuman
                  </p>
                )}
                {!mine && m.kind === "user" && <span className="sr-only">{otherName}: </span>}
                {m.body && <p className="whitespace-pre-line break-words">{m.body}</p>}
                {m.attachment_path && (
                  <button
                    type="button"
                    onClick={() => openPrivateFile(m.attachment_path!).catch((e) => toast.error(e.message))}
                    className="mt-1 inline-flex items-center gap-1 text-sm font-semibold underline"
                  >
                    <Paperclip className="size-3.5" aria-hidden /> {m.attachment_name ?? "Lampiran"}
                  </button>
                )}
                <p className={`mt-0.5 text-[11px] ${mine && m.kind === "user" ? "text-paper/60" : "text-ink-muted"}`}>{formatDateTime(m.created_at)}</p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      {disabledReason ? (
        <p className="border-t border-line px-4 py-3 text-center text-sm text-ink-muted">{disabledReason}</p>
      ) : (
        <form onSubmit={send} className="border-t border-line p-3">
          {file && (
            <p className="mb-2 flex items-center justify-between rounded-lg bg-paper px-3 py-1.5 text-sm">
              <span className="truncate">{file.name}</span>
              <button type="button" className="text-ink-muted hover:text-danger" onClick={() => setFile(null)}>
                Hapus
              </button>
            </p>
          )}
          <div className="flex items-end gap-2">
            <label className="btn btn-ghost cursor-pointer px-3" aria-label="Lampirkan berkas">
              <Paperclip className="size-5" aria-hidden />
              <input type="file" accept={DOC_TYPES.join(",")} className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
            <label htmlFor="msg" className="sr-only">
              Tulis pesan
            </label>
            <textarea
              id="msg"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              rows={1}
              maxLength={2000}
              placeholder="Tulis pesan…"
              className="field max-h-40 min-h-[2.75rem] resize-none"
            />
            <button className="btn btn-primary px-4" disabled={pending || (!text.trim() && !file)} aria-label="Kirim">
              <Send className="size-4" aria-hidden />
            </button>
          </div>
        </form>
      )}
    </>
  );
}
