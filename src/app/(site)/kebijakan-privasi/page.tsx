import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";

export const metadata: Metadata = { title: "Kebijakan privasi" };

export default function PrivacyPage() {
  return (
    <ProsePage
      title="Kebijakan privasi"
      intro="Ringkasan bagaimana data pribadimu dipakai, sejalan dengan UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi. (Draf untuk MVP — perlu ditinjau ahli hukum sebelum peluncuran.)"
      sections={[
        { h: "Data yang dikumpulkan", body: <p>Data diri, kemampuan, keterbatasan, ketersediaan, riwayat kegiatan, media sosial, CV (opsional), nomor HP, kontak darurat dan data kesehatan singkat (untuk Level 2), serta dokumen identitas saat verifikasi.</p> },
        {
          h: "Siapa yang bisa melihat",
          body: (
            <ul className="list-disc space-y-1 pl-5">
              <li>Publik: nama panggilan, foto, kota, skill, minat, pengalaman, rating, dan ulasan.</li>
              <li>Penyelenggara yang kamu lamar atau yang mengundangmu: nama lengkap, usia, jenis kelamin, keterbatasan, media sosial, dan CV.</li>
              <li>Penyelenggara setelah kamu diterima: nomor HP; untuk panggilan Berat/Darurat juga kontak darurat dan catatan kesehatan.</li>
              <li>Admin: seluruh data, hanya untuk verifikasi dan moderasi.</li>
            </ul>
          ),
        },
        { h: "Dokumen identitas", body: <p>Foto KTP dan dokumen legalitas disimpan di penyimpanan privat dan dihapus segera setelah admin memutuskan pengajuan. Kami hanya menyimpan 4 digit terakhir NIK dan tanggal verifikasi.</p> },
        { h: "Hak kamu", body: <p>Kamu bisa mengubah data kapan saja, menjeda pencocokan, dan meminta penghapusan akun lewat halaman Bantuan.</p> },
      ]}
    />
  );
}
