import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";

export const metadata: Metadata = { title: "Bantuan" };

export default function HelpPage() {
  return (
    <ProsePage
      title="Bantuan"
      variant="faq"
      intro="Jawaban cepat untuk pertanyaan yang paling sering muncul."
      sections={[
        { h: "Saya tidak menerima notifikasi kecocokan", body: <p>Pastikan profil sudah Level 1 (data diri, minimal 3 skill, minat, tingkat beban, waktu luang, dan nomor HP terverifikasi), notifikasi tidak sedang dijeda, dan bidang tidak dibisukan di Pengaturan. Batas notifikasi kecocokan 5 per hari, kecuali darurat.</p> },
        { h: "Kenapa saya tidak bisa melamar panggilan Berat/Darurat?", body: <p>Panggilan tersebut butuh Level 2: isi kontak darurat lalu ajukan verifikasi identitas di menu Verifikasi.</p> },
        { h: "Ada yang meminta transfer uang", body: <p>Jangan transfer. Gunakan tombol Laporkan di percakapan dan blokir pengguna tersebut.</p> },
        { h: "Menghapus akun", body: <p>Kirim permintaan ke tim Sigap (kontak resmi menyusul saat peluncuran). Data pribadimu akan dihapus atau dianonimkan.</p> },
      ]}
    />
  );
}
