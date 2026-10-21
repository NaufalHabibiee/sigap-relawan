# PRD — Platform Pencocokan Relawan (nama kerja: **Sigap**)

| | |
|---|---|
| Versi | 1.0 (draft) |
| Tanggal | 2026-10-11 |
| Pemilik | Habibie |
| Status | Disetujui untuk MVP, desain boleh direvisi saat build |
| Referensi | Sistem EO Marketplace (`~/Documents/eo-marketplace`) — pola teknis dipakai ulang, konsep & visual dibuat baru |

> "Sigap" hanya nama kerja. Nama final, logo, dan domain masih terbuka (lihat §14).

---

## 1. Ringkasan

Sigap mempertemukan **relawan** dengan **pihak yang membutuhkan relawan** — perusahaan, lembaga/NGO, komunitas, campaign, atau individu. Kebutuhannya beragam: dari tugas berat dan darurat (evakuasi gempa, dapur umum, distribusi logistik), tugas sedang (panitia acara sosial, mengajar), tugas ringan (entri data, desain, admin online), sampai promosi produk (konten affiliate TikTok).

Pembeda utama: relawan **tidak perlu terus mencari**. Relawan mengisi profil sekali (data diri, kelebihan, keterbatasan, ketersediaan, CV opsional), lalu sistem **mencocokkan otomatis** setiap ada kebutuhan baru dan mengirim notifikasi in-app ke relawan yang cocok — sekaligus menampilkan daftar relawan rekomendasi ke pencari. Relawan tetap bisa menjelajah dan melamar manual.

## 2. Masalah & Tujuan

### Masalah
- Pencari relawan bergantung pada broadcast WhatsApp/Instagram: jangkauan acak, tidak terseleksi, data pendaftar berantakan.
- Saat bencana, kebutuhan relawan sangat cepat tapi tidak ada cara cepat menemukan orang terdekat yang **mampu dan siap**.
- Relawan ingin membantu tapi tidak tahu ada kebutuhan yang cocok dengan kemampuan dan waktunya.
- Tidak ada rekam jejak (track record) relawan maupun penyelenggara, sehingga sulit membangun kepercayaan.

### Tujuan MVP
1. Relawan bisa membuat profil lengkap ≤ 10 menit.
2. Pencari bisa membuat "Panggilan" (kebutuhan relawan) ≤ 5 menit dan langsung melihat relawan yang cocok.
3. Notifikasi match terkirim ≤ 1 menit setelah Panggilan dipublikasikan.
4. Komunikasi relawan–pencari terjadi di dalam platform (chat), bukan langsung pindah ke WA.
5. Setiap kegiatan selesai menghasilkan rating dua arah.

### Metrik keberhasilan (3 bulan pertama)
| Metrik | Target |
|---|---|
| Relawan dengan profil lengkap | ≥ 60% dari pendaftar |
| Panggilan yang mendapat ≥ 1 relawan diterima | ≥ 70% |
| Waktu rata-rata publish → lamaran pertama | < 24 jam (darurat < 2 jam) |
| Notifikasi match yang dibuka | ≥ 40% |
| Kegiatan selesai yang diberi rating | ≥ 50% |

### Di luar cakupan MVP
- Pembayaran/monetisasi (platform **gratis** di fase awal).
- Notifikasi email dan WhatsApp (MVP hanya in-app; email masuk fase 2).
- Aplikasi mobile native (MVP web responsif, mobile-first).
- Sertifikat relawan otomatis, gamifikasi, poin.
- Pembayaran uang saku/komisi lewat platform (hanya dicatat sebagai informasi).

## 3. Peran Pengguna

| Peran | Siapa | Kemampuan utama |
|---|---|---|
| **Relawan** | Individu ≥ 17 tahun | Isi profil, terima notifikasi match, jelajah & lamar Panggilan, terima undangan, chat, beri rating ke penyelenggara |
| **Pencari** (penyelenggara) | Perusahaan, lembaga/NGO, komunitas, campaign, individu | Buat Panggilan, lihat rekomendasi relawan, undang, seleksi pelamar, chat, tandai kehadiran, beri rating ke relawan |
| **Admin** | Tim internal | Verifikasi identitas & organisasi, moderasi Panggilan dan laporan, kelola master data (kategori, skill), pantau dashboard |

Aturan akun:
- Peran dipilih saat daftar ("Saya ingin jadi relawan" / "Saya mencari relawan"). **Satu akun satu peran** di MVP. Ganti peran = akun baru (fase 2: satu akun dua peran).
- Satu akun pencari mewakili satu organisasi/individu. Multi-admin organisasi masuk fase 2.

## 4. Kategori Kegiatan & Tingkat Beban

Setiap Panggilan punya **kategori** (bidang) dan **tingkat beban** (seberapa berat/berisiko). Tingkat beban menentukan level verifikasi minimum relawan.

### Tingkat beban
| Tingkat | Contoh | Level verifikasi minimum relawan | CV |
|---|---|---|---|
| **Ringan** | Entri data, desain, admin medsos, survei online | Level 1 | Opsional |
| **Promosi** | Konten affiliate TikTok/IG, review produk, sebar campaign | Level 1 | Tidak perlu; yang penting akun sosmed |
| **Sedang** | Panitia acara sosial, mengajar, pendampingan, bersih-bersih lingkungan | Level 1 | Opsional (bisa diminta pencari) |
| **Berat** | Bongkar muat logistik, pembangunan, kerja fisik di lapangan | Level 2 | Opsional |
| **Darurat / Bencana** | Evakuasi, dapur umum, posko pengungsian, distribusi bantuan pasca gempa/banjir | Level 2 | Tidak perlu |

### Kategori (master data, bisa ditambah admin)
Kebencanaan · Pendidikan · Kesehatan · Lingkungan · Sosial & Kemanusiaan · Acara & Kepanitiaan · Kreatif & Desain · Digital & Teknologi · Promosi & Konten · Keagamaan · Hewan · Lainnya.

## 5. Verifikasi Bertingkat

### Relawan
| Level | Syarat | Badge |
|---|---|---|
| **Level 0** | Daftar + konfirmasi email | — (belum bisa melamar) |
| **Level 1** | Profil wajib terisi lengkap + nomor HP terverifikasi OTP | "Profil lengkap" |
| **Level 2** | Level 1 + foto KTP + selfie memegang KTP, disetujui admin + kontak darurat terisi | "Identitas terverifikasi" |

- Relawan hanya bisa melamar/menerima undangan Panggilan yang level minimumnya ≤ levelnya.
- Pengajuan Level 2 diproses admin ≤ 1×24 jam; status: menunggu → disetujui / ditolak (dengan alasan).
- Foto KTP disimpan di bucket privat, hanya bisa diakses admin lewat signed URL berumur pendek. Setelah disetujui, simpan **4 digit terakhir NIK** + tanggal verifikasi; file foto dihapus otomatis setelah 30 hari (kepatuhan UU PDP).

### Pencari
| Level | Syarat | Dampak |
|---|---|---|
| **Dasar** | Email + nomor HP OTP + profil organisasi | Bisa membuat Panggilan Ringan, Promosi, Sedang |
| **Terverifikasi** | Dokumen legalitas (NIB/akta/SK lembaga/surat keterangan komunitas) atau KTP PIC untuk individu, disetujui admin | Bisa membuat Panggilan Berat & Darurat, badge "Penyelenggara terverifikasi" |

Panggilan **Darurat** dari pencari terverifikasi langsung tayang; dari yang belum terverifikasi tidak diizinkan (cegah hoaks/penipuan saat bencana).

## 6. Alur Pengguna Utama

### 6.1 Onboarding relawan
1. Landing → "Jadi Relawan" → daftar (email+sandi atau Google).
2. Konfirmasi email → Level 0.
3. Wizard profil bertahap (bisa disimpan dan dilanjut):
   1. Data diri
   2. Kelebihan & keterbatasan
   3. Minat & ketersediaan
   4. Pengalaman, sosmed, CV (opsional)
4. Verifikasi HP (OTP) → Level 1 → sistem langsung menghitung match ke Panggilan aktif → beranda menampilkan "Panggilan yang cocok untukmu".
5. Opsional: ajukan Level 2 (KTP + selfie + kontak darurat).

### 6.2 Onboarding pencari
1. Landing → "Cari Relawan" → daftar.
2. Pilih tipe: Perusahaan / Lembaga-NGO / Komunitas / Campaign / Individu.
3. Isi profil organisasi + PIC + verifikasi HP → level Dasar.
4. Opsional: unggah legalitas → Terverifikasi.

### 6.3 Membuat Panggilan → matching
1. Pencari isi form Panggilan (§7.3), bisa simpan draf.
2. Publikasi → status `aktif` → engine matching berjalan.
3. Relawan dengan skor ≥ ambang menerima notifikasi: "Ada panggilan yang cocok: Relawan dapur umum — Cianjur (skor 86%)".
4. Pencari melihat tab **Rekomendasi** (relawan terurut skor, dengan alasan cocok) dan tab **Pelamar**.

### 6.4 Lamar / undang → seleksi → kegiatan → rating
```
Relawan melamar ─┐                       ┌─> Ditolak
                 ├─> Ditinjau ──> Diterima ──> Hadir ──> Selesai ──> Rating dua arah
Pencari undang ──┘   (chat terbuka)  │                └─> Tidak hadir
   └─> relawan terima / tolak        └─> Dibatalkan (oleh salah satu pihak, wajib alasan)
```
- Lamaran: relawan bisa menambah pesan singkat (≤ 500 karakter) dan melampirkan CV jika Panggilan memintanya.
- Undangan: pencari mengundang relawan dari Rekomendasi; relawan punya 48 jam (darurat: 6 jam) untuk menerima/menolak, setelah itu kedaluwarsa.
- Chat terbuka sejak lamaran/undangan dibuat.
- Saat kuota diterima penuh, Panggilan otomatis berstatus `penuh` (tidak menerima lamaran baru, tapi tetap terlihat).
- Setelah tanggal selesai, pencari menandai Hadir/Tidak hadir per relawan → status `selesai` → jendela rating dibuka.

## 7. Kebutuhan Fungsional

### 7.1 Autentikasi
- Email + sandi, Google OAuth (aktifkan provider di Supabase sejak awal — di EO Marketplace sempat tertunda).
- Konfirmasi email wajib. **Siapkan SMTP custom** (Resend/Brevo) sebelum demo — SMTP bawaan Supabase hanya mengirim ke anggota org (masalah yang sama di EO Marketplace).
- Lupa sandi, ganti sandi, hapus akun (soft delete + anonimisasi data pribadi).
- OTP nomor HP: MVP pakai Supabase Phone Auth (Twilio/Vonage) atau, jika biaya jadi kendala, verifikasi manual oleh admin sebagai fallback — **diputuskan sebelum fase 1 dimulai** (lihat §14).

### 7.2 Profil relawan
| Bagian | Field | Wajib Level 1 |
|---|---|---|
| **Data diri** | Nama lengkap, nama panggilan, tanggal lahir (usia ≥ 17), jenis kelamin, provinsi & kota domisili, foto profil, nomor HP, bio singkat (≤ 300 karakter) | Ya (kecuali bio) |
| **Kelebihan** | Pilih skill dari master (multi, maks 15) + tingkat (dasar/mahir) + kelebihan bebas (≤ 5 poin teks pendek) | Min 3 skill |
| **Keterbatasan** | Pilih dari daftar: tidak kuat angkat berat, tidak bisa di ketinggian, tidak bisa berenang, alergi tertentu, disabilitas (opsional, jenis), tidak bisa menginap, dll + teks bebas | Boleh "tidak ada" |
| **Minat** | Kategori diminati (multi), tingkat beban yang bersedia (Ringan/Promosi/Sedang/Berat/Darurat) | Min 1 |
| **Ketersediaan** | Hari tersedia (Sen–Min), slot waktu (pagi/siang/malam), mode (onsite/online/keduanya), bersedia keluar kota (ya/tidak + maks radius km), status "Siaga Darurat" (toggle: bersedia dihubungi untuk bencana kapan saja) | Ya |
| **Pengalaman** | Riwayat kegiatan relawan (nama, penyelenggara, tahun, peran) — riwayat dari platform otomatis tampil | Tidak |
| **Sosmed** | TikTok/Instagram/YouTube handle + jumlah follower (self-report) — dipakai untuk Panggilan Promosi | Tidak (wajib jika minat Promosi) |
| **Dokumen** | CV PDF (≤ 5 MB), sertifikat pendukung (mis. P3K, SAR) ≤ 3 file | Tidak |
| **Darurat** (Level 2) | Kontak darurat (nama, hubungan, HP), golongan darah, kondisi kesehatan yang perlu diketahui | Ya untuk Level 2 |

Privasi:
- Profil publik (bisa dilihat pencari mana pun): nama panggilan, foto, kota, skill, minat, rating, jumlah kegiatan selesai, badge.
- Hanya terlihat oleh pencari setelah relawan melamar/menerima undangan: nama lengkap, usia, keterbatasan, CV, sosmed.
- Hanya terlihat oleh pencari setelah relawan **diterima**: nomor HP, kontak darurat, golongan darah & kondisi kesehatan (hanya untuk Panggilan Berat/Darurat).
- Admin bisa melihat semua untuk keperluan moderasi.

Kelengkapan profil ditampilkan sebagai progress bar dengan saran ("Tambah 2 skill lagi agar lebih sering cocok").

### 7.3 Profil pencari & Panggilan
**Profil pencari:** tipe, nama organisasi, logo, deskripsi, bidang, kota, website/sosmed, PIC (nama, jabatan, HP), dokumen legalitas, rating rata-rata, jumlah Panggilan selesai.

**Form Panggilan:**
| Bagian | Field |
|---|---|
| Dasar | Judul, kategori, tingkat beban, deskripsi tugas (rich text sederhana), foto sampul (opsional) |
| Lokasi & waktu | Mode (onsite/online/hybrid), alamat + provinsi/kota (+ titik peta opsional), tanggal mulai–selesai, jam, perkiraan durasi per hari |
| Kebutuhan | Kuota relawan, batas pendaftaran |
| Kriteria **wajib** (filter keras) | Skill wajib, usia min/maks, level verifikasi minimum (otomatis dari tingkat beban, bisa dinaikkan), jenis kelamin (hanya jika ada alasan — field alasan wajib diisi, mis. pendamping khusus perempuan), domisili/radius, min follower (Promosi) |
| Kriteria **preferensi** (menambah skor) | Skill tambahan, pengalaman di kategori sama, rating minimum |
| Yang didapat relawan | Tidak dibayar / uang saku (nominal) / komisi affiliate (%) / konsumsi / transport / akomodasi / sertifikat — multi pilih, hanya informasi |
| Syarat dokumen | Wajib lampirkan CV (ya/tidak), pertanyaan tambahan (≤ 3 pertanyaan teks) |
| Darurat | Toggle "Panggilan darurat" (hanya tingkat Darurat + pencari terverifikasi) |

Status Panggilan: `draf` → `aktif` → `penuh` / `ditutup` → `berjalan` → `selesai` / `dibatalkan`.

Pencari bisa menduplikat Panggilan lama (untuk kegiatan rutin).

### 7.4 Engine matching (inti sistem)
**Pemicu:**
1. Panggilan dipublikasikan atau kriterianya diubah → hitung semua relawan Level ≥ 1.
2. Profil relawan diperbarui (skill, lokasi, ketersediaan, minat) atau naik level → hitung terhadap semua Panggilan `aktif`.
3. Relawan baru mencapai Level 1 → hitung terhadap semua Panggilan `aktif`.

**Tahap 1 — Filter keras (gugur jika salah satu gagal):**
- Level verifikasi relawan ≥ level minimum Panggilan.
- Relawan bersedia tingkat beban tersebut.
- Lokasi: online → lolos; onsite → kota sama, atau jarak ≤ radius kesediaan relawan, atau relawan bersedia keluar kota.
- Usia dalam rentang (jika diisi).
- Semua skill wajib dimiliki.
- Tidak ada konflik keterbatasan: setiap Panggilan bisa ditandai "tugas melibatkan" (angkat berat, ketinggian, air, menginap, dll) — relawan yang punya keterbatasan terkait gugur.
- Ketersediaan: hari/jam Panggilan beririsan dengan ketersediaan relawan (Darurat: diabaikan jika relawan "Siaga Darurat").
- Jenis kelamin & min follower (jika diisi).
- Relawan tidak sedang diterima di Panggilan lain yang jadwalnya bentrok.

**Tahap 2 — Skor 0–100:**
| Komponen | Bobot |
|---|---|
| Kecocokan skill preferensi (+ tingkat mahir) | 35 |
| Kedekatan lokasi | 20 |
| Kecocokan kategori minat | 15 |
| Pengalaman di kategori sama (di platform + riwayat) | 10 |
| Rating rata-rata & tingkat kehadiran | 10 |
| Kelengkapan profil & aktivitas terakhir (login ≤ 14 hari) | 10 |

**Output:**
- Skor ≥ 70 → simpan sebagai match + kirim notifikasi ke relawan. Skor 50–69 → hanya tampil di Rekomendasi pencari dan di "Mungkin cocok" relawan, tanpa notifikasi.
- Setiap match menyimpan **alasan** ("3 dari 4 skill cocok · 4 km dari lokasi · pernah di 2 kegiatan Kebencanaan") — ditampilkan ke kedua pihak.
- Anti-spam: maksimal 5 notifikasi match per relawan per hari (digabung jadi ringkasan jika lebih). Panggilan Darurat **mengabaikan batas** dan diprioritaskan ke relawan "Siaga Darurat" terdekat.
- Relawan bisa "Tidak tertarik" pada match → tidak muncul lagi, dan menjadi sinyal (fase 2).

**Implementasi:** fungsi Postgres (`compute_matches_for_call`, `compute_matches_for_volunteer`) dipanggil via trigger/RPC; jarak pakai koordinat kota (tabel referensi kota + lat/lng) dengan rumus haversine — tanpa PostGIS di MVP. Hasil di tabel `matches`. Notifikasi masuk tabel `notifications` dan dikirim real-time via Supabase Realtime. Jika volume relawan > ~20 ribu, pindahkan perhitungan ke job antrean (Edge Function + pg_cron) — tidak perlu di MVP.

### 7.5 Jelajah & lamar
- Halaman jelajah Panggilan: pencarian teks, filter (kategori, tingkat beban, kota/provinsi, online/onsite, tanggal, yang didapat, hanya darurat), urutan (paling cocok, terbaru, deadline terdekat).
- Kartu Panggilan menampilkan skor kecocokan untuk relawan yang login.
- Panggilan yang tidak memenuhi filter keras tetap bisa dilihat, tapi tombol Lamar nonaktif dengan alasan jelas ("Butuh verifikasi identitas — ajukan sekarang").
- Simpan Panggilan (bookmark).
- Halaman publik profil pencari dan relawan (versi publik sesuai §7.2).

### 7.6 Chat (boxchat)
- Satu thread per pasangan Panggilan × relawan; dibuka saat lamaran/undangan dibuat.
- Pesan teks + gambar (≤ 5 MB) + file PDF; indikator terkirim/dibaca; real-time (Supabase Realtime).
- Pesan sistem otomatis di thread: "Lamaran diterima", "Undangan kedaluwarsa", "Kegiatan selesai — beri rating".
- Pencari bisa kirim **pengumuman** ke semua relawan diterima dalam satu Panggilan (broadcast satu arah).
- Laporkan & blokir pengguna dari chat. Thread dikunci (read-only) 30 hari setelah Panggilan selesai.
- Peringatan otomatis bila pesan memuat pola permintaan uang/transfer ("Platform tidak pernah meminta biaya. Hati-hati penipuan.").

### 7.7 Notifikasi in-app
Ikon lonceng + badge jumlah belum dibaca + halaman daftar notifikasi; real-time.

| Penerima | Kejadian |
|---|---|
| Relawan | Match baru, undangan, lamaran diterima/ditolak, Panggilan dibatalkan/diubah, pesan baru, pengingat H-1 kegiatan, minta rating, status verifikasi |
| Pencari | Pelamar baru, undangan diterima/ditolak/kedaluwarsa, kuota penuh, pesan baru, minta tandai kehadiran, minta rating, status verifikasi |
| Semua | Pengumuman admin |

Preferensi: relawan bisa mematikan notifikasi match per kategori dan menonaktifkan sementara ("Sedang tidak bisa — jeda 7/30 hari").

### 7.8 Rating & ulasan dua arah
- Dibuka saat status `selesai`, berlaku 14 hari.
- Relawan → pencari: bintang 1–5 + aspek (komunikasi, kesesuaian deskripsi tugas, keamanan & perlakuan) + ulasan teks opsional.
- Pencari → relawan: bintang 1–5 + aspek (ketepatan waktu, kinerja, sikap) + ulasan opsional.
- **Blind**: ulasan baru terlihat setelah kedua pihak mengisi atau 14 hari lewat (mencegah balas dendam).
- Relawan berstatus "Tidak hadir" otomatis tercatat di tingkat kehadiran (bukan rating).
- Pengguna bisa membalas ulasan sekali; ulasan bisa dilaporkan → moderasi admin.

### 7.9 Admin panel
- Dashboard: jumlah relawan per level, pencari, Panggilan aktif/darurat, lamaran, match, tingkat penerimaan, grafik harian.
- Antrean verifikasi (relawan Level 2, pencari Terverifikasi): lihat dokumen, setujui/tolak + alasan.
- Moderasi: Panggilan (sembunyikan/tutup), laporan pengguna/ulasan/chat, banned user.
- Master data: kategori, skill, keterbatasan, daftar kota + koordinat.
- Pengumuman global (mis. "Banjir di Demak — butuh relawan").
- Log aksi admin (audit).

### 7.10 Mode Darurat
- Panggilan Darurat dipin di atas beranda & jelajah dengan penanda visual oranye "Darurat".
- Banner bencana aktif bisa dipasang admin (lokasi + tautan ke semua Panggilan terkait).
- Notifikasi langsung ke relawan "Siaga Darurat" dalam radius, tanpa batas harian.
- Waktu respons undangan 6 jam.
- Kontak darurat & data kesehatan relawan diterima otomatis tersedia untuk pencari.

## 8. Kebutuhan Non-Fungsional
- **Keamanan & privasi:** RLS di semua tabel; bucket Storage privat untuk KTP, CV, dokumen legalitas (akses via signed URL); kepatuhan UU PDP — persetujuan eksplisit saat daftar, halaman Kebijakan Privasi, hak hapus data. Rate limit pada daftar, lamaran, dan chat. Captcha (Cloudflare Turnstile) di daftar.
- **Performa:** LCP < 2,5 detik di 4G; halaman publik di-cache (`"use cache"` + `cacheTag`), invalidasi saat data berubah.
- **Mobile-first:** mayoritas relawan akses dari HP; semua alur utama harus nyaman di lebar 360 px.
- **Aksesibilitas:** kontras WCAG AA, fokus keyboard terlihat, `prefers-reduced-motion` dihormati, label form jelas.
- **Bahasa:** UI Bahasa Indonesia, sentence case, nada lugas dan hangat.
- **SEO:** halaman Panggilan publik terindeks (metadata, Open Graph untuk dibagikan ke WA/IG).
- **Keandalan:** backup harian Supabase; pemantauan error (Vercel logs).

## 9. Model Data (garis besar)

| Tabel | Isi pokok |
|---|---|
| `profiles` | id (= auth.users), role (`volunteer`/`seeker`/`admin`), phone, phone_verified, created_at, deleted_at |
| `volunteers` | profile_id, nama, panggilan, tgl_lahir, gender, city_id, bio, foto, verification_level, mode, willing_travel, max_radius_km, emergency_standby, paused_until, completeness |
| `volunteer_skills` | volunteer_id, skill_id, level |
| `volunteer_limitations` | volunteer_id, limitation_id, note |
| `volunteer_interests` | volunteer_id, category_id |
| `volunteer_load_prefs` | volunteer_id, load_level |
| `volunteer_availability` | volunteer_id, weekday, slot |
| `volunteer_socials` | volunteer_id, platform, handle, followers |
| `volunteer_documents` | volunteer_id, type (cv/sertifikat), path |
| `volunteer_experiences` | volunteer_id, judul, penyelenggara, tahun, peran |
| `volunteer_emergency` | volunteer_id, kontak, hubungan, hp, gol_darah, kondisi |
| `seekers` | profile_id, tipe, nama_org, logo, deskripsi, city_id, pic, verified, website |
| `verification_requests` | subject_type, subject_id, files, status, reviewer_id, reason, nik_last4 |
| `calls` (Panggilan) | seeker_id, judul, category_id, load_level, deskripsi, mode, city_id, alamat, lat/lng, start/end, kuota, deadline, min_level, umur min/max, gender + alasan, min_followers, benefits[], need_cv, is_emergency, status |
| `call_required_skills` / `call_preferred_skills` | call_id, skill_id |
| `call_involves` | call_id, limitation_id (tugas melibatkan apa) |
| `call_questions` | call_id, pertanyaan |
| `matches` | call_id, volunteer_id, score, reasons jsonb, notified_at, dismissed |
| `applications` | call_id, volunteer_id, source (`apply`/`invite`), status, message, answers jsonb, expires_at, attendance |
| `conversations` / `messages` | per application; sender_id, body, attachment, read_at, type (user/system) |
| `notifications` | user_id, type, payload jsonb, read_at |
| `reviews` | application_id, reviewer_id, reviewee_id, rating, aspects jsonb, body, reply, visible_at |
| `reports` | reporter_id, target_type, target_id, reason, status |
| `saved_calls` | volunteer_id, call_id |
| `categories`, `skills`, `limitations`, `cities` (lat/lng, provinsi) | master data |
| `announcements`, `admin_audit_log` | admin |

Mutasi sensitif (melamar, menerima, mengundang, mengubah status) lewat RPC `security definer` dengan validasi peran — pola yang sama dengan `submit_event_request_multi` di EO Marketplace.

## 10. Peta Halaman

**Publik**
- `/` Beranda — hero + live feed Panggilan, dua jalur (relawan/pencari), Panggilan darurat, cara kerja, kategori, FAQ
- `/panggilan` Jelajah · `/panggilan/[slug]` Detail
- `/penyelenggara/[slug]` · `/relawan/[slug]` Profil publik
- `/masuk` · `/daftar` (pilih peran) · `/lupa-sandi`
- `/tentang`, `/kebijakan-privasi`, `/syarat`, `/bantuan`

**Relawan** (`/r/...`)
- Beranda (match untukmu, undangan, kegiatan mendatang) · Lengkapi profil (wizard) · Verifikasi · Lamaran saya · Tersimpan · Pesan · Notifikasi · Ulasan · Pengaturan

**Pencari** (`/p/...`)
- Beranda (Panggilan aktif, pelamar baru) · Buat/ubah Panggilan · Detail Panggilan (tab Rekomendasi · Pelamar · Diterima · Kehadiran) · Pesan · Notifikasi · Profil organisasi · Verifikasi · Ulasan · Pengaturan

**Admin** (`/admin/...`)
- Dashboard · Verifikasi · Panggilan · Pengguna · Laporan · Master data · Pengumuman · Audit log

## 11. Arah Desain

Konsep: **gerakan sosial yang sigap**, bukan marketplace korporat. Referensi visual dari dunia nyata relawan: rompi SAR berwarna oranye, papan panggilan posko, poster gerakan.

### Warna (token)
| Token | Hex | Peran |
|---|---|---|
| Kertas | `#EEECE5` | Latar utama (stone hangat, bukan krem kuning) |
| Malam | `#1B2430` | Teks utama, elemen sisi pencari |
| Sigap | `#E8622C` | Aksen primer: CTA utama, momen match, penanda darurat — dipakai hemat |
| Guyub | `#1F6F5C` | Sisi relawan, status sukses, tag beban ringan |
| Ladang | `#C9A227` | Bintang rating, tag Promosi |
| Garis | `#D8D2C4` | Border, divider |

Warna **mengkodekan peran**, bukan dekorasi. Catatan dari EO Marketplace: palet multiwarna pernah ditolak karena terasa "website anak-anak" — jadi permukaan dominan tetap Kertas + Malam, sementara Sigap/Guyub/Ladang hanya muncul di titik bermakna (tombol, badge, tag). Mode gelap disiapkan lewat token yang sama (fase 2).

### Tipografi
- Display/judul: **Archivo** (Bold–Black, varian Expanded untuk headline hero) — rasa poster gerakan.
- Body/UI: **Public Sans** — humanis, sangat terbaca, bernuansa layanan publik.
- Skala modular ±1.25; panjang baris body ≤ 75 karakter; rata kiri.

### Layout & prinsip
- Hero asimetris: kiri headline besar + dua CTA ("Jadi relawan" / "Cari relawan"), kanan **live feed** Panggilan terbaru yang bergulir (judul · kota · tingkat beban · waktu) — sekaligus bukti sosial dan demo produk.
- Bagian dua jalur: separuh Guyub (relawan), separuh Malam (pencari), bukan grid kartu identik.
- Hindari: eyebrow ALL-CAPS di atas setiap judul, penomoran 01/02/03 kecuali memang langkah berurutan (alur "Cara kerja" boleh), kartu seragam dengan bayangan sama, gradien dekoratif.
- Satu momen animasi yang bermakna: saat match ditemukan (badge skor muncul). Selebihnya tenang.
- Dashboard relawan & pencari padat informasi tapi lapang; status ditandai warna + teks (bukan warna saja).

Desain boleh direvisi saat build.

## 12. Stack Teknis

Mengikuti EO Marketplace:
- **Next.js 16.4** (App Router, `cacheComponents`), **React 19.3**, TypeScript, **Tailwind CSS v4**
- **Supabase**: Auth (email, Google, Phone OTP), Postgres + RLS + RPC, Storage (bucket publik: foto/logo/sampul; privat: KTP, CV, legalitas), Realtime (chat & notifikasi), pg_cron (kedaluwarsa undangan, pengingat H-1, buka/tutup jendela rating, hapus foto KTP)
- `@supabase/ssr`, `lucide-react`, `sonner` (toast)
- Deploy **Vercel**, repo GitHub privat, auto-deploy dari `main`
- Middleware di `src/proxy.ts`

Pelajaran dari EO Marketplace yang wajib diterapkan sejak awal:
- Data publik pakai `"use cache"` + `cacheTag`; data runtime (cookies/searchParams) dibungkus `<Suspense>`; mutasi panggil `updateTag` + `refresh()`.
- `await connection()` di server Supabase client.
- Class CSS kustom di `@layer components`.
- Form client-only pakai `onSubmit` + `preventDefault` (hindari auto-reset `<form action>`).
- Status visual yang bergantung route: gunakan CSS (`:has()`), bukan `usePathname()` di layout yang diprerender; verifikasi di `next build && next start`.
- SMTP custom + Google OAuth disiapkan sebelum demo.

## 13. Fase Pengerjaan

| Fase | Isi | Estimasi |
|---|---|---|
| **0. Fondasi** | Repo, Supabase project, skema + RLS + seed master data (kategori, skill, keterbatasan, kota+koordinat), design tokens, layout dasar | 2–3 hari |
| **1. Akun & profil** | Daftar/masuk per peran, wizard profil relawan, profil pencari, OTP HP, upload CV/dokumen, verifikasi Level 2 & pencari + antrean admin | 4–5 hari |
| **2. Panggilan & jelajah** | Form Panggilan, status, jelajah + filter, detail, simpan, halaman publik | 3–4 hari |
| **3. Matching & notifikasi** | Fungsi matching + trigger, tab Rekomendasi, notifikasi real-time, batas harian, mode darurat | 4–5 hari |
| **4. Lamaran, undangan, chat** | Alur status lengkap, undangan + kedaluwarsa, chat real-time, pengumuman, laporan/blokir | 4–5 hari |
| **5. Kehadiran & rating** | Tandai hadir, rating dua arah blind, profil publik dengan ulasan | 2–3 hari |
| **6. Admin & poles** | Dashboard, moderasi, master data, pengumuman, SEO, aksesibilitas, data demo, deploy | 3–4 hari |

**Fase 2 (setelah MVP):** notifikasi email, satu akun dua peran, multi-admin organisasi, sertifikat relawan, mode gelap, PWA + push notification, monetisasi (fee posting / langganan pencari), pembelajaran dari "Tidak tertarik" untuk skor.

## 14. Risiko & Keputusan Terbuka

| # | Hal | Usulan default |
|---|---|---|
| 1 | Nama brand, logo, domain | "Sigap" sebagai nama kerja; putuskan sebelum fase 6 |
| 2 | Penyedia OTP HP (biaya SMS) | Supabase Phone + Twilio; fallback: verifikasi HP manual oleh admin |
| 3 | Usia minimum | 17 tahun; < 17 tidak bisa daftar di MVP |
| 4 | Panggilan Promosi/affiliate rawan dipakai untuk kerja tak berbayar terselubung | Wajib isi "yang didapat relawan"; admin bisa menurunkan Panggilan yang menyesatkan |
| 5 | Penipuan saat bencana (minta transfer, Panggilan palsu) | Darurat hanya untuk pencari terverifikasi + deteksi kata kunci di chat + tombol lapor |
| 6 | Data sensitif (KTP, kesehatan) | Bucket privat, akses terbatas, hapus foto KTP 30 hari setelah verifikasi |
| 7 | Kriteria jenis kelamin bisa diskriminatif | Hanya boleh dengan alasan tertulis; ditampilkan ke relawan |
| 8 | Data demo (seperti EO Marketplace) | Seed ±50 relawan, ±15 pencari, ±25 Panggilan berlabel "Contoh" |
