# SmartHR — Platform Rekrutmen & Manajemen Talenta Berbasis AI

<p align="left">
  <a href="README.md">English</a> | <b>Bahasa Indonesia</b>
</p>

Platform cerdas untuk manajemen rekrutmen dan screening kandidat berbasis **Next.js 15 (App Router, TypeScript)**, **Supabase (PostgreSQL & Auth)**, **Tailwind CSS**, dan runtime autonomous **Hermes AI Agent**.

---

## 🚀 Fitur Utama

### 1. Portal Kandidat (Candidate Portal)
- **Katalog Lowongan (`/jobs`)**: Jelajahi lowongan pekerjaan aktif dengan kartu visual 3D modern, informasi lokasi, tipe pekerjaan, dan ambang batas nilai kelulusan CV (*passing score*).
- **Detail Lowongan (`/jobs/[slug]`)**: Deskripsi pekerjaan mendalam, kompetensi yang dicari, dan kualifikasi teknis.
- **Pengiriman Lamaran & Upload CV (`/jobs/[slug]/apply`)**: Pengiriman berkas lamaran dengan ekstraksi teks PDF otomatis di sisi browser dan penyimpanan aman di Supabase Storage.
- **Pelacakan Status Lamaran (`/applications`)**: Pemantauan status rekrutmen secara real-time (`pending`, `screened`, `invited_interview`, `interview_in_progress`, `interview_completed`, `rejected`, `withdrawn_expired`).
- **Tes Psikometri 4-Framework (`/applications/[id]/personality-test`)**: Pemetaan karakter kandidat komprehensif yang mengombinasikan **DISC**, **Big Five (OCEAN)**, **PAPI Kostick**, dan arketipe **MBTI**.
- **Wawancara AI Interaktif (`/applications/[id]/interview`)**: Sesi wawancara berbasis kompetensi secara real-time dengan AI yang mampu mengajukan pertanyaan lanjutan (*follow-up probe*) dinamis serta evaluasi percakapan otomatis.

### 2. Portal Admin & Rekruter (Admin Portal)
- **Dashboard Rekrutmen (`/admin/dashboard`)**: Ringkasan eksekutif berisi metrik rekrutmen, jumlah lowongan aktif, laju pelamar masuk, dan daftar 5 lamaran terbaru.
- **Kelola Lowongan (`/admin/jobs`)**: Kontrol penuh atas seluruh posisi lowongan, status publikasi (toggle aktif/nonaktif), passing score threshold, dan generator blueprint wawancara AI.
- **Studio Pembuatan Lowongan (`/admin/jobs/new`)**: Publikasi posisi pekerjaan baru dengan auto-slug generator dan skrip kompetensi terstruktur.
- **Manajemen Pelamar (`/admin/applications`)**: Manajemen pipeline kandidat, perubahan status lamaran, rincian analisis skor CV, dan ulasan berkas lengkap (*dossier*).
- **Log Komunikasi Otomatis (`/admin/communications`)**: Visibilitas penuh atas seluruh email keluar yang dikirim otomatis, status pengiriman, laporan error, serta modal pratinjau tampilan visual HTML email.

### 3. Hermes AI Engine & Intelligence Layer
- **Screening CV Otomatis**: Analisis CV mendalam yang mencocokkan latar belakang kandidat dengan kebutuhan posisi kerja, lengkap dengan scoring objektif dan tingkat keyakinan (*confidence level*).
- **Penilaian Wawancara Dinamis**: Pembuatan pertanyaan probe lanjutan secara real-time selama wawancara kandidat, analisis kepercayaan diri linguistik, dan penilaian perilaku.
- **Sintesis Eksekutif Tri-Faktor**: Menyatukan analisis CV, profil psikometri kepribadian, dan performa wawancara ke dalam rekomendasi keputusan rekrutmen yang dapat ditindaklanjuti.
- **Mesin Komunikasi Proaktif**: Personalisasi email kandidat otomatis di sepanjang 12 tahap siklus rekrutmen dalam Bahasa Indonesia yang hangat dan profesional tanpa mengekspos rubrik penilaian internal.

### 4. Keamanan & Role Guard
- **Row Level Security (RLS)**: Kandidat hanya dapat mengakses berkas dan data lamarannya sendiri; Admin memiliki akses kelola ke seluruh data sistem.
- **Proteksi Route Middleware**: Middleware server memproteksi seluruh rute `/admin/*`, otomatis mengalihkan kandidat non-admin ke halaman `/jobs`.
- **Isolasi Secret Keys**: Kunci rahasia server (`SUPABASE_SERVICE_ROLE_KEY`) diisolasi secara ketat di sisi server/server actions dan tidak pernah bocor ke bundle JavaScript browser.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15.1.7 (App Router, Server Actions)
- **Bahasa**: TypeScript 5
- **Styling**: Tailwind CSS 3, Lucide React Icons
- **Database & Auth**: Supabase (PostgreSQL, Auth SSR, Supabase Storage)
- **AI Engine**: Hermes Agent runtime (`mistral-medium-3-5` dengan kaskade multi-model)
- **Pengiriman Email**: Resend SDK dengan dukungan mode simulasi (*dry-run*)
- **Ekstraksi PDF**: `unpdf`, `pdf-parse`, `pdf-lib`

---

## 🏁 Memulai & Instalasi

### Prasyarat
- **Node.js**: v18.18+ atau v20+
- **npm**, **yarn**, atau **pnpm**
- Proyek **Supabase** (instance cloud atau lokal)

### 1. Kloning & Instalasi Dependencies
Kloning repositori dan instal dependensi:
```bash
git clone https://github.com/tyobramas/smart_hr.git
cd smart_hr
npm install
```

### 2. Konfigurasi Environment
Salin template konfigurasi `.env.example` ke `.env.local`:
```bash
cp .env.example .env.local
```

Sesuaikan variabel environment berikut:
```env
# Konfigurasi Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Konfigurasi Hermes Agent (Router API atau Local CLI)
HERMES_MODE=api
HERMES_BASE_URL=https://router.bynara.id/v1
HERMES_API_KEY=your_hermes_or_nara_api_key
HERMES_MODEL=mistral-medium-3-5

# Konfigurasi Mesin Komunikasi (Resend)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM_ADDRESS=onboarding@resend.dev
EMAIL_FROM_NAME="SmartHR Recruitment"
APP_BASE_URL=http://localhost:3000
COMMUNICATION_ENABLED=true
COMMUNICATION_DRY_RUN=true
CRON_SECRET=your_secure_cron_secret
```

### 3. Migrasi Database Supabase
Jalankan file SQL yang berada di direktori `supabase/migrations/` melalui **Supabase Dashboard SQL Editor** atau Supabase CLI:
- `20250101000000_init_schema.sql` (Skema inti database & kebijakan RLS)
- `20250101000001_storage.sql` (Bucket storage CV & izin akses)
- `20260901131451_add_interview_blueprints_to_jobs.sql` (Blueprint wawancara kerja)
- `20260902000000_add_communication_logs.sql` (Tabel audit log mesin komunikasi)

### 4. Menjalankan Server Development
Jalankan server lokal Next.js:
```bash
npm run dev
```
Buka browser dan akses [http://localhost:3000](http://localhost:3000).

---

## 🧪 Perintah Pengujian (Scripts)

| Perintah | Deskripsi |
|---|---|
| `npm run dev` | Menjalankan server development di `localhost:3000` |
| `npm run build` | Menjalankan build produksi Next.js |
| `npm run start` | Menjalankan server produksi |
| `npm run test:comm` | Menguji pembuatan konten email Hermes & pengiriman transport |
| `npm run test:hermes` | Menguji konektivitas dan inferensi Hermes Agent |
| `npm run test:screener` | Menguji alur screening CV berbasis AI |
| `npm run test:interview-script` | Menguji generator skrip blueprint wawancara |

---

## 👑 Cara Menjadi Admin

Untuk memberikan hak akses Admin kepada akun pengguna:
1. Daftarkan akun baru melalui `/sign-up` dan lengkapi onboarding profil.
2. Di Supabase Dashboard (menu Table Editor -> tabel `profiles`), ubah nilai pada kolom `role` user tersebut dari `'candidate'` menjadi `'admin'`.
3. Segarkan (*refresh*) halaman peramban Anda untuk mengakses portal `/admin`.

