# Sigap (nama kerja) — platform pencocokan relawan

Implementasi dari `PRD.md`. Next.js 16.4 (App Router, `cacheComponents`) + React 19 + Tailwind v4 + Supabase.

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

`.env.local` berisi `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`.

Supabase project: `relawan-platform` (ref `pvvjdfrsmmjalddoogfr`, ap-southeast-1). Migrasi ada di `supabase/migrations/` (sudah diterapkan), data demo di `supabase/seed_demo.sql`.

## Akun demo

Akun demo (1 admin, 50 relawan, 15 penyelenggara) dibuat oleh `supabase/seed_demo.sql`; email dan sandinya ada di berkas itu. Semua data demo bertanda "(Contoh)". Hapus atau ganti sandi akun demo sebelum situs dibuka untuk publik.

## Peta kode

- `supabase/migrations/0002_functions.sql` — engine matching (`match_eval`, `compute_matches_for_*`), alur lamaran/undangan, chat, ulasan blind, verifikasi, admin.
- `src/lib/data.ts` — baca publik ber-cache (`"use cache"` + `cacheTag`).
- `src/lib/actions/*` — server actions per peran.
- `src/app/(site)/r` relawan · `/p` penyelenggara · `/admin` · `/pesan` chat realtime · `/notifikasi`.

## Yang perlu disiapkan sebelum peluncuran

1. **Konfirmasi email**: Supabase → Authentication → Sign In / Providers → Email. SMTP bawaan hanya mengirim ke anggota org, jadi pasang SMTP custom (Resend/Brevo) atau matikan "Confirm email" untuk demo.
2. **URL Configuration**: set Site URL + Redirect URLs (`https://domain/auth/callback`).
3. **Google OAuth**: aktifkan provider Google (butuh Client ID/Secret dari Google Cloud). Pengguna OAuth baru diarahkan ke `/mulai` untuk memilih peran.
4. **OTP SMS**: saat ini mode demo (kode tampil di layar, `app_settings.demo_otp`, bisa dimatikan di /admin). Untuk produksi sambungkan penyedia SMS lalu matikan mode demo.
5. Kebijakan privasi & syarat masih draf — perlu ditinjau ahli hukum.

## Keamanan yang sudah diterapkan di database

- `0009_private_helpers.sql`: fungsi pembantu RLS (`is_admin`, `my_role`, `is_banned`, `is_app_participant`, `chat_blocked`, `chat_locked`, `seeker_has_*`) dipindah ke skema `private`, sehingga tidak bisa dipanggil lewat `/rest/v1/rpc`.
- `0010_rate_limits.sql`: batas per pengguna lewat trigger: 20 lamaran/jam, 60 undangan/jam, 30 pesan/menit, 10 laporan/hari, 5 permintaan OTP/jam. Data hitungan ada di `private.rate_events` dan dibersihkan harian.
- `0011_indexes_and_rls_initplan.sql`: indeks untuk semua foreign key dan `auth.uid()` dibungkus `(select ...)` di policy RLS.

## Yang masih harus dilakukan lewat dashboard (butuh akun/kunci milikmu)

1. **Leaked password protection**: Supabase → Authentication → Sign In / Providers → Email → aktifkan "Prevent use of leaked passwords" (fitur paket Pro).
2. **Captcha**: buat situs di Cloudflare Turnstile, isi `NEXT_PUBLIC_TURNSTILE_SITE_KEY` di `.env.local`, lalu aktifkan Captcha protection (Turnstile + secret key) di Supabase → Authentication → Attack Protection. Tanpa site key widget tidak tampil.
3. **SMTP custom** (Resend/Brevo) dan **Site URL / Redirect URLs**, lihat daftar "Yang perlu disiapkan sebelum peluncuran" di atas.

## Notifikasi email

Setiap notifikasi in-app yang belum dibaca (kecuali pesan chat) bisa dikirim ke email pemiliknya. Pengguna bisa mematikannya di Pengaturan (relawan) atau Profil organisasi (penyelenggara).

- Antrean dibaca lewat fungsi `email_queue` (hanya admin atau service role). Notifikasi ditandai `emailed_at` setelah terkirim; yang lebih tua dari 3 hari dilewati.
- **Manual**: Ringkasan admin → kartu "Antrean email" → "Kirim sekarang".
- **Terjadwal**: panggil `GET /api/cron/email` dengan header `Authorization: Bearer $CRON_SECRET` tiap beberapa menit (Vercel Cron, GitHub Actions, atau cron-job.org). Butuh `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, dan `RESEND_API_KEY` di server.
- Alamat `@contoh.id` (akun demo) dilewati agar tidak memantul.
- Untuk produksi, verifikasi domain pengirim di Resend dan isi `EMAIL_FROM`.

## Fitur lain yang ditambahkan

- Bagikan panggilan (Web Share, WhatsApp, salin tautan), gambar pratinjau Open Graph per panggilan, `sitemap.xml`, `robots.txt`, dan `manifest`.
- Tambah ke kalender (.ics) dari percakapan yang sudah diterima: `/pesan/[id]/kalender`.
- Penyelenggara: duplikat panggilan sebagai draf, ekspor pelamar ke CSV: `/p/panggilan/[id]/ekspor`.
- Ubah kata sandi dari Pengaturan (relawan) dan Profil organisasi (penyelenggara).
