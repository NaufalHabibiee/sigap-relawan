import { ImageResponse } from "next/og";
import { LOAD_LABEL } from "@/lib/constants";
import { getCallBySlug } from "@/lib/data";
import { formatDateRange } from "@/lib/format";

export const alt = "Panggilan relawan di Sigap";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const call = await getCallBySlug(slug);
  const title = call?.title ?? "Panggilan relawan";
  const org = call?.seeker?.org_name ?? "Sigap";
  const where = call ? (call.mode === "online" ? "Online" : (call.city?.name ?? "")) : "";
  const when = call ? formatDateRange(call.start_date, call.end_date) : "";
  const urgent = Boolean(call?.is_emergency || call?.load === "darurat");

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#1b2430", color: "#eeece5", padding: 64 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: "#e8622c", display: "flex" }} />
            <div style={{ fontSize: 40, fontWeight: 700 }}>sigap</div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {urgent && <div style={{ display: "flex", background: "#c4501e", color: "#fff", padding: "10px 22px", borderRadius: 999, fontSize: 26, fontWeight: 700 }}>DARURAT</div>}
            {call && !(urgent && call.load === "darurat") && <div style={{ display: "flex", background: "#eeece5", color: "#1b2430", padding: "10px 22px", borderRadius: 999, fontSize: 26, fontWeight: 700 }}>{LOAD_LABEL[call.load]}</div>}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", fontSize: 68, fontWeight: 800, lineHeight: 1.1, letterSpacing: -1 }}>{title.length > 80 ? `${title.slice(0, 77)}…` : title}</div>
          <div style={{ display: "flex", fontSize: 32, color: "#b9b5a8" }}>{[org, where, when].filter(Boolean).join("  ·  ")}</div>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#e8622c", fontWeight: 700 }}>Daftar jadi relawan di Sigap</div>
      </div>
    ),
    size,
  );
}
