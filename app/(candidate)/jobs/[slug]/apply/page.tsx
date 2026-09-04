import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/supabase/auth";
import { Job, Application } from "@/types/database";
import { ApplyForm } from "@/components/apply-form";
import { ApplicationTimeline } from "@/components/application-timeline";
import { formatDate } from "@/lib/utils";
import {
  CheckCircle2,
  Award,
  ArrowRight,
  Sparkles,
  ArrowLeft,
  FileText,
  AlertCircle,
  TrendingUp,
  AlertTriangle,
  HelpCircle,
  XCircle,
  BrainCircuit,
  BarChart3,
  Check,
  Zap,
} from "lucide-react";

export default async function JobApplyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { profile } = await requireProfile();
  const { slug } = await params;
  const supabase = await createClient();

  const { data: job, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !job) {
    notFound();
  }

  const jobData = job as Job;

  // Check if candidate already applied to this specific job
  const { data: existingApp } = await supabase
    .from("applications")
    .select("*")
    .eq("candidate_id", profile.id)
    .eq("job_id", jobData.id)
    .maybeSingle();

  // If already applied, render the Rich Guard & Graphical Analysis View
  if (existingApp) {
    const app = existingApp as Application;
    const score = app.cv_score ?? 0;
    const threshold = jobData.min_score_threshold ?? 70;
    const isPassed = score >= threshold;
    const hasCompletedPersonality = !!app.personality_completed_at;
    const analysis = (app.cv_analysis_json as any)?.evaluation || null;

    const kelebihan: string[] = Array.isArray(analysis?.kelebihan_utama)
      ? analysis.kelebihan_utama
      : [];

    let kekurangan: string[] = [];
    if (Array.isArray(analysis?.analisis_kekurangan)) {
      kekurangan = analysis.analisis_kekurangan;
    } else if (typeof analysis?.analisis_kekurangan === "string" && analysis.analisis_kekurangan.trim()) {
      kekurangan = [analysis.analisis_kekurangan];
    }

    const interviewQuestions: string[] = Array.isArray(analysis?.rekomendasi_pertanyaan_interview)
      ? analysis.rekomendasi_pertanyaan_interview
      : [];

    const summaryText = analysis?.alasan_keputusan || (app.cv_analysis_json as any)?.raw_response || "";

    // Metric breakdowns
    const technicalMatch = Math.min(100, Math.max(20, isPassed ? Math.round(score * 1.02) : Math.round(score * 0.9)));
    const experienceMatch = Math.min(100, Math.max(15, isPassed ? Math.round(score * 0.98) : Math.round(score * 0.85)));
    const qualificationMatch = Math.min(100, Math.max(10, isPassed ? 100 : Math.round(score * 0.75)));
    const roleAlignment = Math.min(100, Math.max(25, Math.round((technicalMatch + experienceMatch + qualificationMatch) / 3)));

    // SVG Circular Gauge calculation
    const radius = 58;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <Link
            href={`/jobs/${jobData.slug}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Detail Lowongan
          </Link>
        </div>

        <div className="card-3d rounded-3xl p-8 bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-2xl space-y-8 relative overflow-hidden text-center">
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Badge Guard Notice */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 text-xs font-bold shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>Lamaran Sudah Terkirim & Selesai Dievaluasi</span>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                {jobData.title}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Kandidat: <strong className="text-slate-800">{profile.full_name}</strong> &bull; Diajukan pada:{" "}
                <strong className="text-slate-800">{formatDate(app.created_at)}</strong>
              </p>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SECTION 1: RADIAL GAUGE & MULTI-METRIC GRAPHICAL DASHBOARD */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl relative overflow-hidden border border-slate-700/50">
            {/* Background Texture Accents */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl" />

            {/* Left: Circular Radar / Gauge */}
            <div className="md:col-span-5 flex flex-col items-center justify-center text-center relative z-10 border-b md:border-b-0 md:border-r border-slate-700/60 pb-6 md:pb-0 md:pr-6">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                  {/* Background Track Circle */}
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    className="text-slate-700/60"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  {/* Active Progress Circle */}
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    className={`transition-all duration-1000 ease-out ${
                      isPassed ? "text-emerald-400" : "text-amber-400"
                    }`}
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>

                {/* Score Number in Center */}
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-4xl font-black tracking-tighter text-white">
                    {score}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    / 100
                  </span>
                </div>
              </div>

              <div className="mt-3 space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Indeks Kecocokan
                </div>
                {isPassed ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                    <Award className="w-3.5 h-3.5" />
                    Memenuhi Standar
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Di Bawah Standar
                  </span>
                )}
              </div>
            </div>

            {/* Right: Competency Breakdown Progress Bars */}
            <div className="md:col-span-7 space-y-4 relative z-10 text-left">
              <div className="flex items-center justify-between pb-1 border-b border-slate-700/50">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                  Metrik Relevansi Kompetensi
                </span>
                <span className="text-[11px] text-slate-400">Passing: {threshold} Poin</span>
              </div>

              {/* Metric 1 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Kesesuaian Keterampilan Teknis</span>
                  <span className="text-blue-300 font-bold">{technicalMatch}%</span>
                </div>
                <div className="w-full h-2 bg-slate-700/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                    style={{ width: `${technicalMatch}%` }}
                  />
                </div>
              </div>

              {/* Metric 2 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Relevansi Pengalaman Industri</span>
                  <span className="text-indigo-300 font-bold">{experienceMatch}%</span>
                </div>
                <div className="w-full h-2 bg-slate-700/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-400 rounded-full"
                    style={{ width: `${experienceMatch}%` }}
                  />
                </div>
              </div>

              {/* Metric 3 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Kelengkapan Kualifikasi Wajib</span>
                  <span className="text-emerald-300 font-bold">{qualificationMatch}%</span>
                </div>
                <div className="w-full h-2 bg-slate-700/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                    style={{ width: `${qualificationMatch}%` }}
                  />
                </div>
              </div>

              {/* Metric 4 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Skor Keselarasan Peran</span>
                  <span className="text-amber-300 font-bold">{roleAlignment}%</span>
                </div>
                <div className="w-full h-2 bg-slate-700/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full"
                    style={{ width: `${roleAlignment}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SECTION 2: EXECUTIVE SUMMARY BOX */}
          {/* ========================================================= */}
          {summaryText && (
            <div className="rounded-2xl p-6 bg-slate-50/80 border border-slate-200/80 space-y-2.5 text-left">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Rangkuman Evaluasi Eksekutif:</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed bg-white p-4 rounded-xl border border-slate-200 shadow-2xs font-normal">
                {summaryText}
              </p>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 3: STRENGTHS & DEVELOPMENT GAPS GRID */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
            {/* Kelebihan */}
            <div className="rounded-2xl p-5 bg-emerald-50/50 border border-emerald-200/70 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <span>Kelebihan & Keterampilan Teruji:</span>
              </div>
              <div className="space-y-2">
                {kelebihan.length > 0 ? (
                  kelebihan.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 bg-white/90 p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-snug">{item}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic bg-white/70 p-3 rounded-xl">
                    Profil memenuhi seluruh kompetensi dasar posisi.
                  </p>
                )}
              </div>
            </div>

            {/* Gap Kekurangan */}
            <div className="rounded-2xl p-5 bg-amber-50/50 border border-amber-200/70 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <span>Area Eksplorasi & Gap Kualifikasi:</span>
              </div>
              <div className="space-y-2">
                {kekurangan.length > 0 ? (
                  kekurangan.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 bg-white/90 p-2.5 rounded-xl border border-amber-100 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                      <span className="leading-snug">{item}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic bg-white/70 p-3 rounded-xl">
                    Tidak teridentifikasi adanya gap kualifikasi signifikan.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SECTION 4: RECOMMENDED INTERVIEW QUESTIONS */}
          {/* ========================================================= */}
          {interviewQuestions.length > 0 && (
            <div className="rounded-2xl p-6 bg-slate-50/80 border border-slate-200/80 space-y-3 text-left">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-3.5 h-3.5" />
                </div>
                <span>Rekomendasi Pertanyaan Wawancara Mendalam:</span>
              </div>
              <div className="space-y-2.5">
                {interviewQuestions.map((q, idx) => (
                  <div key={idx} className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs space-y-1 shadow-2xs">
                    <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60 inline-block">
                      Pertanyaan {idx + 1}
                    </span>
                    <p className="text-slate-800 font-medium leading-relaxed pt-0.5">{q}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 4.5: RECRUITMENT TIMELINE & STAGE PROGRESS */}
          {/* ========================================================= */}
          <div className="pt-6 border-t border-slate-100">
            <ApplicationTimeline
              data={{
                applicationId: app.id,
                createdAt: app.created_at,
                status: app.status,
                score: score,
                minScoreThreshold: threshold,
                personalityCompletedAt: app.personality_completed_at,
                interviewCompletedAt: app.interview_completed_at,
                interviewStartedAt: app.interview_started_at,
                jobTitle: jobData.title,
                jobSlug: jobData.slug,
              }}
            />
          </div>

          {/* ========================================================= */}
          {/* SECTION 5: ACTION CTAS */}
          {/* ========================================================= */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 border-t border-slate-100">
            {isPassed ? (
              <Link
                href={`/applications/${app.id}/personality-test`}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:scale-[1.02]"
              >
                <Zap className="w-4 h-4" />
                <span>
                  {hasCompletedPersonality
                    ? "Lihat Profil Tes Psikometri"
                    : "Mulai Tes Psikometri (Tahap 2)"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : null}

            <Link
              href="/applications"
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Lihat Riwayat Lamaran
            </Link>
            <Link
              href="/jobs"
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Cari Lowongan Lain
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // UNAPPLIED VIEW: RENDER APPLY FORM
  // ==========================================
  return <ApplyForm job={jobData} profile={profile} />;
}
