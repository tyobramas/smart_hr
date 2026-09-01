import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/auth";
import { Job } from "@/types/database";
import {
  Sparkles,
  ArrowRight,
  Bot,
  BrainCircuit,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Briefcase,
  MapPin,
  Clock,
  TrendingUp,
  Award,
  Users,
  Target,
  FileCheck,
  ChevronRight,
  Shield,
} from "lucide-react";

export default async function HomePage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  // Fetch active job vacancies for preview
  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(4);

  const jobList = (jobs as Job[]) || [];

  return (
    <div className="space-y-16 pb-16">
      {/* ========================================== */}
      {/* 1. HERO SECTION */}
      {/* ========================================== */}
      <section className="relative pt-6 sm:pt-12 text-center max-w-4xl mx-auto space-y-6">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-blue-400/20 to-indigo-500/20 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-spin" />
          <span>Generasi Baru Rekrutmen Berbasis AI & Psikometri DISC</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
          Seleksi CV & Tes Kepribadian{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Otomatis & Objektif
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Platform rekrutmen cerdas yang memadukan <strong>AI Screening RAG</strong> untuk evaluasi instan dokumen CV dan <strong>Tes Kepribadian 30 Soal Acak</strong> untuk menemukan talenta terbaik.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link
            href="/jobs"
            className="w-full sm:w-auto btn-primary-3d flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold shadow-lg"
          >
            <Briefcase className="w-4 h-4" />
            <span>Jelajahi Lowongan Kerja</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          {profile?.role === "admin" ? (
            <Link
              href="/admin/dashboard"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              <span>Buka Admin Panel</span>
            </Link>
          ) : (
            <Link
              href="/sign-in"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Users className="w-4 h-4" />
              <span>Masuk sebagai Recruiter</span>
            </Link>
          )}
        </div>
      </section>

      {/* ========================================== */}
      {/* 2. STATS BAR */}
      {/* ========================================== */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
        <div className="card-3d rounded-2xl p-5 bg-white border border-slate-200 text-center space-y-1">
          <div className="text-3xl font-black text-blue-600">⚡ &lt; 5 Detik</div>
          <div className="text-xs font-bold text-slate-700">Analisis CV Otomatis</div>
          <div className="text-[11px] text-slate-400">Skoring instan & objektif</div>
        </div>

        <div className="card-3d rounded-2xl p-5 bg-white border border-slate-200 text-center space-y-1">
          <div className="text-3xl font-black text-indigo-600">50 Soal</div>
          <div className="text-xs font-bold text-slate-700">Tes Psikometri Terpadu</div>
          <div className="text-[11px] text-slate-400">4 Framework Psikologi Modern</div>
        </div>

        <div className="card-3d rounded-2xl p-5 bg-white border border-slate-200 text-center space-y-1">
          <div className="text-3xl font-black text-emerald-600">100%</div>
          <div className="text-xs font-bold text-slate-700">Objektif & Bebas Bias</div>
          <div className="text-[11px] text-slate-400">Kesesuaian kualifikasi akurat</div>
        </div>

        <div className="card-3d rounded-2xl p-5 bg-white border border-slate-200 text-center space-y-1">
          <div className="text-3xl font-black text-purple-600">4 Framework</div>
          <div className="text-xs font-bold text-slate-700">Pemetaan Karakter Kerja</div>
          <div className="text-[11px] text-slate-400">DISC, Big Five, PAPI, MBTI</div>
        </div>
      </section>

      {/* ========================================== */}
      {/* 3. HOW IT WORKS 3-STEP PIPELINE */}
      {/* ========================================== */}
      <section className="space-y-8 max-w-5xl mx-auto">
        <div className="text-center space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
            End-to-End Workflow
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Alur Seleksi Rekrutmen Otomatis
          </h2>
          <p className="text-xs text-slate-500 max-w-lg mx-auto">
            Dirancang untuk efisiensi maksimal bagi Recruiter dan pengalaman seleksi yang transparan bagi Kandidat.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="card-3d rounded-2xl p-6 bg-white border border-slate-200 shadow-soft-3d space-y-4 relative">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-lg border border-blue-200">
              01
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Upload CV & Ekstraksi Teks
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Kandidat mengunggah berkas CV (PDF/Word). Sistem secara otomatis mengekstrak data profil, riwayat kerja, dan keterampilan teknis ke dalam memori analisis.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-[11px] font-bold text-blue-600">
              <FileCheck className="w-4 h-4" />
              <span>Multi-format support</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="card-3d rounded-2xl p-6 bg-white border border-slate-200 shadow-soft-3d space-y-4 relative">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg border border-indigo-200">
              02
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Match Fit Scoring
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sistem membandingkan isi CV dengan kualifikasi lowongan secara ketat, menghasilkan skor (0–100), kelebihan, gap kekurangan, dan panduan interview.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-[11px] font-bold text-indigo-600">
              <Bot className="w-4 h-4" />
              <span>Smart Competency Engine</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="card-3d rounded-2xl p-6 bg-white border border-slate-200 shadow-soft-3d space-y-4 relative">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-lg border border-emerald-200">
              03
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Tes Kepribadian 30 Soal Acak
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Kandidat yang lolos passing threshold otomatis diarahkan ke tes psikometri situasional 30 soal untuk mengukur dimensi DISC dan etos kerja.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
              <BrainCircuit className="w-4 h-4" />
              <span>Randomized Situational Test</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* 4. FEATURED JOBS PREVIEW */}
      {/* ========================================== */}
      <section className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Lowongan Kerja Terbaru
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Temukan posisi yang sesuai dengan keahlian Anda dan dapatkan evaluasi AI instan
            </p>
          </div>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            <span>Lihat Semua Lowongan ({jobList.length}+)</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {jobList.length === 0 ? (
          <div className="card-3d rounded-2xl p-8 bg-white border border-slate-200 text-center">
            <p className="text-xs text-slate-500">Belum ada lowongan yang aktif saat ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobList.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.slug}`}
                className="card-3d rounded-2xl p-6 bg-white border border-slate-200 hover:border-blue-300 transition-all hover:shadow-soft-3d space-y-4 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {job.location}
                      </span>
                      <span>&bull;</span>
                      <span className="capitalize">{job.employment_type}</span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200 shrink-0">
                    <Award className="w-3.5 h-3.5" />
                    Passing: {job.min_score_threshold}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {job.description}
                </p>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                  <span className="text-slate-400">AI Screening Ready</span>
                  <span className="font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Lamar Sekarang</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ========================================== */}
      {/* 5. CALL TO ACTION BANNER */}
      {/* ========================================== */}
      <section className="max-w-5xl mx-auto">
        <div className="card-3d rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-blue-300 border border-white/10 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mulai Transformasi Rekrutmen Anda Hari Ini</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold max-w-xl mx-auto leading-tight">
            Temukan Talenta Berkualitas Tanpa Membuang Waktu
          </h2>

          <p className="text-sm text-slate-300 max-w-lg mx-auto">
            Otomatisasi penyaringan kandidat dengan standar psikometri dan penilaian AI yang akurat.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/jobs"
              className="w-full sm:w-auto px-8 py-3 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all"
            >
              Lihat Daftar Lowongan
            </Link>
            <Link
              href="/sign-up"
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
            >
              Daftar Akun Baru
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
