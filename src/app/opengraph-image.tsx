import { ImageResponse } from "next/og";

export const alt = "Sigap — platform pencocokan relawan";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#1b2430", color: "#eeece5", padding: 72 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "#e8622c", display: "flex" }} />
          <div style={{ fontSize: 48, fontWeight: 700 }}>sigap</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", fontSize: 84, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>Ada yang butuh tanganmu hari ini.</div>
          <div style={{ display: "flex", fontSize: 34, color: "#b9b5a8" }}>Isi profil sekali. Dikabari saat ada panggilan relawan yang cocok.</div>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          <div style={{ display: "flex", height: 14, width: 120, borderRadius: 8, background: "#e8622c" }} />
          <div style={{ display: "flex", height: 14, width: 80, borderRadius: 8, background: "rgba(232,98,44,0.5)" }} />
          <div style={{ display: "flex", height: 14, width: 40, borderRadius: 8, background: "rgba(232,98,44,0.25)" }} />
        </div>
      </div>
    ),
    size,
  );
}
