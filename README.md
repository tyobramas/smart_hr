# SmartHR - AI-Powered Recruitment & Talent Platform

Aplikasi manajemen rekrutmen dan screening kandidat berbasis **Next.js App Router (TypeScript)**, **Supabase (Postgres & Auth)**, dan **Tailwind CSS**.

---

## 🚀 Fitur Utama

### 1. Portal Kandidat (Candidate)
- **Katalog Lowongan (`/jobs`)**: Melihat lowongan aktif dengan visual card 3D, info lokasi, tipe pekerjaan, dan passing score CV.
- **Detail Lowongan (`/jobs/[slug]`)**: Membaca deskripsi pekerjaan dan kualifikasi teknis.
- **Formulir Lamaran (`/jobs/[slug]/apply`)**: Mengirimkan lamaran kerja & dokumen CV ke Supabase.
- **Riwayat Lamaran (`/applications`)**: Memantau status review (`pending`, `screened`, `invited_interview`, `rejected`) serta skor AI CV.

### 2. Panel Admin / Recruiter (Admin)
- **Dashboard Rekrutmen (`/admin/dashboard`)**: Metric cards ringkasan lowongan aktif, total pelamar masuk, review status, dan 5 lamaran terbaru.
- **Kelola Lowongan (`/admin/jobs`)**: Tabel lowongan, status publikasi (toggle aktif/nonaktif), passing score threshold.
- **Buat Lowongan Baru (`/admin/jobs/new`)**: Form publikasi posisi baru dengan auto-slug generator dan kualifikasi RAG/AI context.
- **Kelola Pelamar (`/admin/applications`)**: Manajemen pelamar masuk, update status, dan input nilai skor CV.

### 3. Keamanan & Role Guard
- **Row Level Security (RLS)**: Kandidat hanya dapat mengakses data lamarannya sendiri, Admin dapat mengelola seluruh data.
- **Role Guard**: Route `/admin/*` otomatis dilindungi; jika bukan role `admin`, otomatis dialihkan ke `/jobs`.
- **Onboarding Otomatis**: User yang baru mendaftar otomatis diarahkan untuk melengkapi profil.

---

## 🛠️ Menjalankan Aplikasi

1. **Pastikan Supabase Lokal Berjalan**:
   ```bash
   npx supabase start
   ```

2. **Jalankan Development Server**:
   ```bash
   npm run dev
   ```
   Aplikasi akan aktif di `http://localhost:3000`.

3. **Cara Menjadi Admin**:
   Buka Navicat atau Supabase Studio (`http://127.0.0.1:54323`), lalu ubah nilai kolom `role` pada tabel `profiles` dari `'candidate'` menjadi `'admin'`.
