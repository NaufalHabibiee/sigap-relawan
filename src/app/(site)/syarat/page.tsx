import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";

export const metadata: Metadata = { title: "Syarat penggunaan" };

export default function TermsPage() {
  return (
    <ProsePage
      title="Syarat penggunaan"
      intro="Draf untuk MVP — perlu ditinjau ahli hukum sebelum peluncuran."
      sections={[
        { h: "Usia", body: <p>Relawan minimal berusia 17 tahun.</p> },
        { h: "Kejujuran data", body: <p>Isi profil dan panggilan dengan jujur, termasuk keterbatasan relawan dan kompensasi yang diberikan penyelenggara. Panggilan yang menyesatkan dapat diturunkan admin.</p> },
        { h: "Tanpa biaya", body: <p>Penyelenggara dilarang meminta uang dari relawan dalam bentuk apa pun. Pelanggaran berakibat pemblokiran akun.</p> },
        { h: "Keselamatan", body: <p>Penyelenggara bertanggung jawab atas briefing dan keselamatan kegiatan. Panggilan Berat dan Darurat hanya dapat dibuat penyelenggara terverifikasi dan diikuti relawan Level 2.</p> },
        { h: "Ulasan", body: <p>Ulasan harus berdasarkan pengalaman nyata. Ulasan yang melecehkan dapat dilaporkan dan dihapus.</p> },
      ]}
    />
  );
}
