import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";

export const metadata: Metadata = { title: "Tentang" };

export default function AboutPage() {
  return (
    <ProsePage
      title="Tentang Sigap"
      variant="cards"
      intro="Sigap mempertemukan orang yang ingin membantu dengan pihak yang membutuhkan bantuan: perusahaan, lembaga, komunitas, kampanye, dan individu di seluruh Indonesia."
      sections={[
        { h: "Kenapa Sigap ada", body: <p>Broadcast di grup WhatsApp menjangkau orang secara acak. Sigap mencocokkan berdasarkan kemampuan, keterbatasan, lokasi, dan waktu luang, sehingga relawan yang datang memang siap untuk tugasnya.</p> },
        { h: "Bagaimana kecocokan dihitung", body: <p>Pertama, sistem menyaring syarat wajib: level verifikasi, lokasi, skill wajib, jadwal, usia, dan keterbatasan yang bertentangan dengan tugas. Lalu skor 0–100 dihitung dari kecocokan skill, jarak, minat, pengalaman, rating, dan keaktifan. Skor 70 ke atas dikirim sebagai notifikasi.</p> },
        { h: "Gratis", body: <p>Sigap gratis untuk relawan dan penyelenggara. Kami tidak pernah meminta biaya pendaftaran atau transfer uang.</p> },
      ]}
    />
  );
}
