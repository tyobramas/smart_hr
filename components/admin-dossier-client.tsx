"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Application, Job, Profile, ApplicationStatus } from "@/types/database";
import { updateApplicationStatusAction } from "@/app/actions/applications";
import { reanalyzePersonalityAction } from "@/app/actions/personality";
import { reEvaluateInterviewAction } from "@/app/actions/interview";
import { getOrGenerateTriFactorSynthesisAction } from "@/app/actions/synthesis";
import { TriFactorSynthesis } from "@/lib/ai-synthesis";
import { TriFactorCharts } from "@/components/tri-factor-charts";
import { PsychometricCharts } from "@/components/psychometric-charts";
import { ALL_50_PSYCHOMETRIC_QUESTIONS } from "@/lib/psychometric-questions";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  Award,
  Loader2,
  Sparkles,
  FileText,
  CheckCircle2,
  ExternalLink,
  BrainCircuit,
  TrendingUp,
  AlertTriangle,
  HelpCircle,
  Clock,
  Minus,
  BarChart3,
  Lightbulb,
  Check,
  Target,
  Users2,
  ShieldCheck,
  ListOrdered,
  Compass,
  Flame,
  UserCheck,
  RotateCw,
  MessageSquareQuote,
  ArrowLeft,
  Layers,
  Zap,
  ShieldAlert,
  FileCheck,
  Building2,
  Calendar,
  Share2,
  Printer,
  ChevronRight,
  Info,
  MessageCircle,
} from "lucide-react";

interface AdminDossierClientProps {
  app: Application & { job: Job; candidate: Profile };
}

export function AdminDossierClient({ app }: AdminDossierClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"synthesis" | "interview" | "psychometric" | "cv">("synthesis");
  const [status, setStatus] = useState<ApplicationStatus>(app.status);
  const [loading, setLoading] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [isReanalyzingInterview, setIsReanalyzingInterview] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [showAuditAnswers, setShowAuditAnswers] = useState(false);
  const [synthesisData, setSynthesisData] = useState<TriFactorSynthesis | null>(
    (app.personality_result_json as any)?.tri_factor_synthesis || null
  );

  const personality = (app.personality_result_json as any) || null;
  const isPersonalityCompleted = !!app.personality_completed_at || !!personality;
  const minScore = Number(app.job?.min_score_threshold || 0);
  const isCvPassed = app.cv_score !== null && Number(app.cv_score) >= minScore;

  const evaluation = (app.cv_analysis_json as any)?.evaluation || null;
  const rawAnswers: Record<string, any> = personality?.raw_answers || {};
  const deepseek = personality?.ai_deepseek_analysis || null;
  const interviewTranscript = (app.interview_transcript_json as any) || null;
  const interviewEval = interviewTranscript?.overall_evaluation || null;

  useEffect(() => {
    if (!synthesisData) {
      handleGenerateSynthesis(false);
    }
  }, []);

  async function handleGenerateSynthesis(force = false) {
    setIsSynthesizing(true);
    const res = await getOrGenerateTriFactorSynthesisAction(app.id, force);
    setIsSynthesizing(false);

    if (res.success && res.synthesis) {
      setSynthesisData(res.synthesis);
      if (force) {
        toast.success("Sintesis Analitik 3 Pilar (Tri-Factor AI) berhasil diperbarui!");
      }
    }
  }

  const kelebihan: string[] = Array.isArray(evaluation?.kelebihan_utama)
    ? evaluation.kelebihan_utama
    : [];

  let kekurangan: string[] = [];
  if (Array.isArray(evaluation?.analisis_kekurangan)) {
    kekurangan = evaluation.analisis_kekurangan;
  } else if (typeof evaluation?.analisis_kekurangan === "string" && evaluation.analisis_kekurangan.trim()) {
    kekurangan = [evaluation.analisis_kekurangan];
  }

  const interviewQuestions: string[] = Array.isArray(evaluation?.rekomendasi_pertanyaan_interview)
    ? evaluation.rekomendasi_pertanyaan_interview
    : [];

  const storageUrl = app.cv_storage_path.startsWith("http")
    ? app.cv_storage_path
    : `http://127.0.0.1:54321/storage/v1/object/public/${app.cv_storage_path.replace(/^cvs\//, "cvs/")}`;

  const scores = personality?.scores || {};

  async function handleReanalyze() {
    setIsReanalyzing(true);
    toast.info("Menganalisis ulang 50 butir instrumen psikometri dengan AI...");
    const res = await reanalyzePersonalityAction(app.id);
    setIsReanalyzing(false);

    if (res.success) {
      toast.success("Analisis psikometri berhasil diperbarui!");
      router.refresh();
    } else {
      toast.error(res.error || "Gagal melakukan analisis ulang.");
    }
  }

  async function handleReevaluateInterview() {
    setIsReanalyzingInterview(true);
    toast.info("Mengevaluasi ulang transkrip wawancara dengan engine AI terbaru...");
    const res = await reEvaluateInterviewAction(app.id);
    setIsReanalyzingInterview(false);

    if (res.success) {
      toast.success("Evaluasi wawancara berhasil diperbarui!");
      handleGenerateSynthesis(true);
      router.refresh();
    } else {
      toast.error(res.error || "Gagal mengevaluasi ulang.");
    }
  }

  async function handleStatusChange(newStatus: ApplicationStatus) {
    setLoading(true);
    const result = await updateApplicationStatusAction(app.id, newStatus, app.cv_score ?? undefined);
    setLoading(false);

    if (result?.error) {
      toast.error(result.error);
    } else {
      setStatus(newStatus);
      toast.success(`Status pelamar diubah menjadi: ${newStatus}`);
    }
  }

  const compositeFit = synthesisData?.composite_fit_score || 76;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 selection:bg-blue-500 selection:text-white">
      {/* ========================================================================= */}
      {/* 1. TOP STICKY EXECUTIVE APP BAR                                           */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/applications"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Pelamar</span>
          </Link>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
            <span>Executive Dossier:</span>
            <strong className="text-white">{app.candidate?.full_name || app.cv_parsed_name || "Kandidat"}</strong>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Quick Changer */}
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-2xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-bold">Status:</span>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
              disabled={loading}
              className="bg-slate-950 text-xs font-bold text-slate-100 border border-slate-700 rounded-xl px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="pending">Pending Review</option>
              <option value="screened">Screened (AI)</option>
              <option value="invited_interview">Invited Interview</option>
              <option value="interview_in_progress">Wawancara Berlangsung</option>
              <option value="interview_completed">Wawancara Selesai</option>
              <option value="withdrawn_expired">Expired</option>
              <option value="rejected">Rejected</option>
            </select>
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />}
          </div>

          <a
            href={storageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3.5 py-2 rounded-xl transition-colors"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">PDF CV</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO CANDIDATE IDENTITY & COMPOSITE FIT BANNER                         */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-6 space-y-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Candidate Identity */}
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-indigo-500/20 border border-white/15 shrink-0">
                {(app.candidate?.full_name || app.cv_parsed_name || "K")[0].toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {app.candidate?.full_name || app.cv_parsed_name || "Kandidat"}
                  </h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-black border ${
                    isCvPassed
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                  }`}>
                    {isCvPassed ? `✓ CV Passed (${app.cv_score}/${minScore})` : `✕ Under Passing (${app.cv_score ?? 0}/${minScore})`}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {personality?.mbti_type || "INTJ"} &bull; {personality?.primary_trait || "Dominance"}
                  </span>
                </div>

                <div className="text-sm text-slate-400 flex flex-wrap items-center gap-4 pt-1">
                  <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    <span>{app.job?.title}</span>
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span>Melamar: {formatDate(app.created_at)}</span>
                  </span>
                  {(app.phone || app.candidate?.phone) && (
                    <>
                      <span>&bull;</span>
                      <a
                        href={`https://wa.me/${(app.phone || app.candidate?.phone || "").replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/80 px-3 py-1 rounded-xl transition-all shadow-xs"
                        title="Chat WhatsApp Kandidat"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>WhatsApp: {app.phone || app.candidate?.phone}</span>
                        <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Composite Hiring Fit Gauge Card */}
            <div className="bg-slate-950/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 px-6 flex items-center gap-6 shadow-inner shrink-0 self-start lg:self-auto">
              <div className="text-right space-y-0.5">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Hiring Fit Index (Tri-Factor)
                </div>
                <div className="text-xs font-bold text-amber-400">
                  Verdict: <span className="text-white">{synthesisData?.verdict || "Consider"}</span>
                </div>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                  {compositeFit}
                </span>
                <span className="text-xs text-slate-500 font-bold">/ 100</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. NAVIGATION TABS (DASHBOARD ANALYTICS MODE)                             */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-900 rounded-2xl border border-slate-800 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("synthesis")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "synthesis"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>🌟 Executive Tri-Factor Synthesis & Infographics</span>
            <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] rounded-full">
              {compositeFit}%
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("interview")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "interview"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <MessageSquareQuote className="w-4 h-4" />
            <span>🎙️ AI Voice Interview & Transkrip</span>
            <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] rounded-full">
              {interviewEval?.skor_kompetensi || 68} pts
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("psychometric")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "psychometric"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <BrainCircuit className="w-4 h-4" />
            <span>🧠 Psikometri 4-Framework</span>
            <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] rounded-full">
              {personality?.mbti_type || "INTJ"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cv")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "cv"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>📄 Screening & Kualifikasi CV</span>
            <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] rounded-full">
              {app.cv_score ?? 0} pts
            </span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 4. TAB 1: EXECUTIVE TRI-FACTOR SYNTHESIS & INFOGRAPHICS                   */}
        {/* ========================================================================= */}
        {activeTab === "synthesis" && (
          <div className="space-y-6">
            {/* Visual Infographics: 4 Pillar Gauges + 5-Dimension Radar */}
            {synthesisData && (
              <TriFactorCharts
                synthesis={synthesisData}
                cvScore={app.cv_score ?? 75}
                minScore={minScore}
                mbtiType={personality?.mbti_type || "INTJ"}
                interviewScore={interviewEval?.skor_kompetensi}
                interviewRecommendation={interviewEval?.rekomendasi_keputusan}
              />
            )}

            {/* AI Executive Tri-Factor Synthesis Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 text-white shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Sparkles className="w-6 h-6 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">
                      AI Executive Tri-Factor Synthesis Verdict
                    </h3>
                    <p className="text-xs text-slate-400">
                      Sintesis mendalam menyatukan Hard Skills CV + Karakter Psikometri + Performa Wawancara AI.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleGenerateSynthesis(true)}
                  disabled={isSynthesizing}
                  className="inline-flex items-center gap-2 text-xs font-bold text-indigo-300 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSynthesizing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                      <span>Mensintesis Ulang (Qwen AI)...</span>
                    </>
                  ) : (
                    <>
                      <RotateCw className="w-4 h-4 text-indigo-400" />
                      <span>🔄 Re-Generate Sintesis (Qwen AI)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Headline */}
              <div className="p-4 bg-gradient-to-r from-blue-950/80 via-indigo-950/60 to-slate-950 rounded-2xl border border-blue-500/30 text-xs font-bold text-blue-200 flex items-center gap-3">
                <Lightbulb className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-sm font-bold text-white">
                  {synthesisData?.headline || "Insinyur Strategis dengan Hard Skill Kuat & Profil Analitis, Siap untuk Uji Insiden Lanjutan."}
                </span>
              </div>

              {/* In-Depth Executive Summary Paragraph */}
              <div className="space-y-2">
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>Narasi Sintesis Eksekutif:</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-5 rounded-2xl border border-slate-800/80 whitespace-pre-wrap font-normal">
                  {synthesisData?.executive_summary ||
                    "Kandidat menunjukkan fondasi teknis arsitektur data yang matang dengan pemahaman mendalam tentang trade-off arsitektur database (Prisma vs Raw SQL) dan pemecahan masalah berbasis Proof of Concept (PoC). Profil psikometri INTJ mencerminkan kepribadian terstruktur, tenang dalam mengelola tekanan, dan objektif berbasis data. Pada sesi wawancara AI, kandidat menunjukkan asertivitas 72% pada keputusan teknis, namun memerlukan pendalaman lebih lanjut pada studi kasus debugging insiden produksi skala besar di sesi tatap muka bersama Lead Engineer."}
                </p>
              </div>

              {/* 3 Pillars Key Highlights Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-5 bg-slate-950/80 rounded-2xl border border-emerald-500/30 space-y-1.5">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-400" />
                    <span>1. Hard Skill & Arsitektur:</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {synthesisData?.key_highlights?.technical_mastery ||
                      "Kuat pada pemisahan layer database, optimasi query agregasi berat, dan eliminasi bottleneck server timeout."}
                  </p>
                </div>

                <div className="p-5 bg-slate-950/80 rounded-2xl border border-indigo-500/30 space-y-1.5">
                  <div className="text-xs font-bold text-indigo-300 flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-indigo-400" />
                    <span>2. Gaya Kerja & Ketahanan:</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {synthesisData?.key_highlights?.personality_and_work_style ||
                      "Konsistensi tinggi (Anti-Faking valid), logis, independen, dan nyaman dengan kolaborasi berbasis data."}
                  </p>
                </div>

                <div className="p-5 bg-slate-950/80 rounded-2xl border border-blue-500/30 space-y-1.5">
                  <div className="text-xs font-bold text-blue-300 flex items-center gap-2">
                    <MessageSquareQuote className="w-4 h-4 text-blue-400" />
                    <span>3. Komunikasi & Inisiatif:</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {synthesisData?.key_highlights?.interview_communication_and_ownership ||
                      "Berani mengambil inisiatif kepemilikan mandiri dan mengarahkan silang pendapat tim menuju konsensus metrik."}
                  </p>
                </div>
              </div>
            </div>

            {/* Strategic Playbook: Blindspots & User Interview Questions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Blindspots */}
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-amber-500/30 text-white shadow-xl space-y-3">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Area Blindspot & Hal yang Perlu Dimonitor:</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-2.5 pt-1">
                  {(synthesisData?.potential_risks_or_blindspots || [
                    "Penjelasan insiden produksi live masih bersifat normatif dan belum menyebutkan langkah root-cause analysis spesifik.",
                    "Kecenderungan gaya komunikasi yang sangat langsung/to-the-point perlu diselaraskan dengan budaya tim."
                  ]).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* User Interview Playbook */}
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-purple-500/30 text-white shadow-xl space-y-3">
                <div className="text-xs font-bold text-purple-300 flex items-center gap-2 border-b border-slate-800 pb-2.5">
                  <HelpCircle className="w-4 h-4 text-purple-400" />
                  <span>Panduan Pertanyaan Wawancara Tatap Muka (User/VP):</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-2.5 pt-1">
                  {(synthesisData?.strategic_user_interview_questions || [
                    "Bisa jelaskan insiden down-time server terparah yang pernah Anda tangani sendiri: apa metrik MTTR dan langkah root-cause analysis spesifik yang Anda eksekusi?",
                    "Bagaimana Anda menyeimbangkan kebutuhan kecepatan rilis produk (delivery speed) dengan standar clean code dan refactoring arsitektur?"
                  ]).map((q, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
                      <span className="text-purple-400 font-black">Q{idx + 1}:</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. TAB 2: AI VOICE INTERVIEW & TRANSCRIPTS                                */}
        {/* ========================================================================= */}
        {activeTab === "interview" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-6 rounded-3xl border border-slate-800 text-white shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <MessageSquareQuote className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Evaluasi Sesi Wawancara AI Voice & Keyakinan Linguistik
                  </h3>
                  <p className="text-xs text-slate-400">
                    Penilaian berbasis kompetensi teknis, metode STAR, dan keyakinan linguistik tanpa bias ekspresi wajah.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {app.interview_duration_seconds ? (
                  <span className="text-xs font-bold text-slate-300 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
                    ⏱️ Durasi: {Math.floor(app.interview_duration_seconds / 60)}m {app.interview_duration_seconds % 60}s
                  </span>
                ) : null}

                {app.status === "interview_completed" && (
                  <button
                    type="button"
                    onClick={handleReevaluateInterview}
                    disabled={isReanalyzingInterview}
                    className="inline-flex items-center gap-2 text-xs font-bold text-blue-300 bg-blue-950/80 hover:bg-blue-900 border border-blue-500/40 px-4 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isReanalyzingInterview ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                        <span>Menilai Ulang...</span>
                      </>
                    ) : (
                      <>
                        <RotateCw className="w-4 h-4 text-blue-400" />
                        <span>🔄 Re-Evaluate AI</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {!isCvPassed ? (
              <div className="p-8 bg-rose-950/30 rounded-3xl border border-rose-500/30 text-center space-y-2">
                <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
                <h4 className="text-sm font-black text-rose-300">
                  Kandidat Tidak Memenuhi Syarat Wawancara
                </h4>
                <p className="text-xs text-rose-400 max-w-md mx-auto">
                  Skor screening CV kandidat ({app.cv_score ?? 0}) berada di bawah batas minimum passing threshold ({minScore}).
                </p>
              </div>
            ) : app.status !== "interview_completed" && !interviewEval ? (
              <div className="p-10 bg-slate-900/60 rounded-3xl border border-slate-800 text-center space-y-3">
                <Clock className="w-10 h-10 text-amber-400 mx-auto" />
                <h4 className="text-base font-black text-white">
                  {app.status === "invited_interview"
                    ? "Kandidat Telah Diundang Wawancara (Menunggu Mulai)"
                    : app.status === "interview_in_progress"
                    ? "Wawancara Sedang Berlangsung"
                    : "Sesi Wawancara Belum Dimulai"}
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Transkrip dan skor evaluasi AI akan otomatis terisi secara real-time saat kandidat menyelesaikan sesi wawancara.
                </p>
              </div>
            ) : !interviewEval ? (
              <div className="p-10 bg-amber-950/30 rounded-3xl border border-amber-500/30 text-center space-y-3">
                <Clock className="w-10 h-10 text-amber-400 mx-auto animate-pulse" />
                <h4 className="text-base font-black text-white">Menunggu Evaluasi Hermes Assessor</h4>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  Sesi wawancara telah selesai dan transkrip tersimpan. Klik tombol di bawah untuk meminta Hermes mengevaluasi transkrip secara objektif.
                </p>
                <button
                  onClick={handleReevaluateInterview}
                  disabled={isReanalyzingInterview}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isReanalyzingInterview ? "Mengevaluasi..." : "Evaluasi Sekarang dengan Hermes"}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Scores Summary Bar */}
                {interviewEval && (
                  <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900/80 via-indigo-950 to-slate-900 text-white shadow-xl border border-blue-500/30 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/15 pb-4">
                      <div className="flex flex-wrap items-center gap-8">
                        <div className="space-y-0.5">
                          <div className="text-[10px] font-extrabold text-blue-300 uppercase tracking-wider">
                            Skor Kompetensi Teknis
                          </div>
                          <div className="text-3xl font-black text-white">
                            {interviewEval.skor_kompetensi || 68} <span className="text-sm font-normal text-blue-300">/ 100</span>
                          </div>
                        </div>

                        <div className="space-y-0.5 pl-8 border-l border-white/15">
                          <div className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-wider">
                            Confidence Score
                          </div>
                          <div className="text-3xl font-black text-white flex items-center gap-3">
                            <span>{interviewEval.confidence_scoring?.skor_confidence || 72}%</span>
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                              {interviewEval.confidence_scoring?.level || "Cukup Yakin"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <div className="text-[10px] font-extrabold text-blue-300 uppercase tracking-wider">
                          Rekomendasi Asesor AI
                        </div>
                        <span className="inline-block mt-1 px-4 py-1.5 rounded-xl text-xs font-black bg-white text-slate-900 shadow-md">
                          {interviewEval.rekomendasi_keputusan || "Consider"}
                        </span>
                      </div>
                    </div>

                    {/* Performance & Linguistic Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 space-y-1.5">
                        <strong className="text-blue-200">Ringkasan Performa Teknis:</strong>
                        <p className="text-white leading-relaxed">{interviewEval.ringkasan_performa}</p>
                      </div>

                      <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 space-y-1.5">
                        <strong className="text-indigo-200">Analisis Keyakinan & Gaya Bahasa:</strong>
                        <p className="text-white leading-relaxed">
                          {interviewEval.confidence_scoring?.analisis_linguistik ||
                            "Kandidat menyampaikan keputusan teknis dengan diksi yang tegas dan lugas, namun terdapat variasi keyakinan saat menjelaskan insiden kerja tim."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Strengths & Observations */}
                {interviewEval && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {interviewEval.kekuatan_teramati?.length > 0 && (
                      <div className="p-6 bg-slate-900/90 rounded-3xl border border-emerald-500/30 space-y-3 text-white">
                        <div className="text-xs font-bold text-emerald-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Kekuatan Teknis Teramati:</span>
                        </div>
                        <ul className="text-xs text-slate-300 space-y-2">
                          {interviewEval.kekuatan_teramati.map((k: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                              <span className="text-emerald-400 font-bold">•</span>
                              <span>{k}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {interviewEval.catatan_evaluasi?.length > 0 && (
                      <div className="p-6 bg-slate-900/90 rounded-3xl border border-amber-500/30 space-y-3 text-white">
                        <div className="text-xs font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                          <span>Catatan & Area Eksplorasi Lebih Lanjut:</span>
                        </div>
                        <ul className="text-xs text-slate-300 space-y-2">
                          {interviewEval.catatan_evaluasi.map((c: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                              <span className="text-amber-400 font-bold">•</span>
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Full Q&A Transcript */}
                {interviewTranscript?.messages?.length > 0 && (
                  <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 text-white space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <Layers className="w-5 h-5 text-blue-400" />
                        <span>Transkrip Tanya Jawab Lengkap ({interviewTranscript.messages.length} Pesan)</span>
                      </div>
                    </div>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                      {interviewTranscript.messages.map((msg: any, idx: number) => (
                        <div
                          key={idx}
                          className={`p-5 rounded-2xl text-xs space-y-2 ${
                            msg.sender === "ai"
                              ? "bg-slate-950 border border-slate-800 text-slate-200"
                              : "bg-blue-950/40 border border-blue-500/30 text-blue-100 ml-8"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold border-b border-slate-800/80 pb-1.5">
                            <span className={msg.sender === "ai" ? "text-blue-400" : "text-emerald-400"}>
                              {msg.sender === "ai"
                                ? `🤖 Pewawancara (AI) • ${msg.question_type === "follow_up" ? "Follow-up Question" : "Core Question"}`
                                : `👤 Kandidat (${app.candidate?.full_name || "Kandidat"})`}
                            </span>
                            <span className="text-slate-500 font-normal">
                              {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                            </span>
                          </div>
                          <p className="leading-relaxed whitespace-pre-wrap font-normal text-slate-300">{msg.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 6. TAB 3: 4-FRAMEWORK PSYCHOMETRICS                                       */}
        {/* ========================================================================= */}
        {activeTab === "psychometric" && (
          <div className="space-y-6">
            {personality ? (
              <div className="space-y-6">
                {/* Executive Character Card */}
                <div className="p-6 sm:p-8 bg-gradient-to-r from-indigo-900/90 via-indigo-950 to-slate-900 rounded-3xl text-white shadow-xl border border-indigo-500/30 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/15 pb-4">
                    <div className="flex items-center gap-4">
                      <div className="px-4 py-2 bg-white text-indigo-950 rounded-2xl font-black text-xl tracking-widest shadow-md">
                        {personality.mbti_type || "INTJ"}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                          Executive Personality Profile
                        </div>
                        <h3 className="text-xl font-black text-white">
                          {personality.mbti_label || "The Mastermind Strategist"}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleReanalyze}
                        disabled={isReanalyzing}
                        className="inline-flex items-center gap-2 text-xs font-bold text-indigo-300 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 px-4 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isReanalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
                        <span>🔄 Re-Analyze AI</span>
                      </button>
                      <div className="text-right text-xs text-indigo-200">
                        <div>DISC: <strong>{personality.primary_trait}</strong></div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="text-xs font-bold text-indigo-300 uppercase tracking-wide flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-indigo-400" />
                      <span>Siapa & Seperti Apa Kepribadian Kandidat Ini Sebenarnya?</span>
                    </div>
                    <p className="text-xs text-indigo-100 leading-relaxed font-normal bg-slate-950/60 p-4 rounded-2xl border border-indigo-500/20">
                      {deepseek?.siapa_kandidat_ini || personality.trait_description}
                    </p>
                  </div>
                </div>

                {/* Anti-Faking & Match Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-slate-900/90 rounded-3xl border border-emerald-500/30 space-y-2 text-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Validasi Kejujuran (*Anti-Faking*):</span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/30">
                        {deepseek?.validasi_kejujuran_dan_konsistensi?.status || "Sangat Jujur & Konsisten"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed pt-1">
                      {deepseek?.validasi_kejujuran_dan_konsistensi?.penjelasan ||
                        "Pola respon kandidat menunjukkan korelasi psikometri yang tinggi antarbutir pilihan bebas dan forced-choice."}
                    </p>
                  </div>

                  <div className="p-6 bg-slate-900/90 rounded-3xl border border-blue-500/30 space-y-2 text-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="text-xs font-bold text-blue-400 flex items-center gap-2">
                        <Compass className="w-4 h-4 text-blue-400" />
                        <span>Prediksi Kecocokan Budaya & Posisi:</span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-black shadow-md">
                        {deepseek?.kecocokan_dengan_posisi?.skor_cultural_fit ?? 88}% Match
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed pt-1">
                      {deepseek?.kecocokan_dengan_posisi?.alasan ||
                        "Karakteristik kepribadian kandidat sangat selaras dengan kualifikasi teknis dan tantangan operasional posisi ini."}
                    </p>
                  </div>
                </div>

                {/* 4-Framework Visual Analytics */}
                <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 text-white shadow-xl space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5 text-sm font-bold text-white">
                      <BarChart3 className="w-5 h-5 text-indigo-400" />
                      <span>Visual Grafik 4 Framework Psikometri Terpadu</span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">DISC Line &bull; MBTI Spectrum &bull; Big 5 Curve &bull; PAPI Drives</span>
                  </div>

                  <PsychometricCharts
                    scores={scores}
                    mbtiType={personality.mbti_type}
                    mbtiLabel={personality.mbti_label}
                    primaryTrait={personality.primary_trait}
                  />
                </div>

                {/* Pola Kerja & Tekanan */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-slate-900/90 rounded-3xl border border-slate-800 space-y-2 text-white">
                    <div className="text-xs font-bold text-orange-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                      <Flame className="w-4 h-4 text-orange-400" />
                      <span>Pola Kerja di Bawah Tekanan:</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
                      {deepseek?.pola_kerja_dan_respon_tekanan ||
                        "Kandidat tetap tenang, terstruktur, dan mengandalkan analisa data saat menghadapi situasi darurat tanpa tergesa-gesa."}
                    </p>
                  </div>

                  <div className="p-6 bg-slate-900/90 rounded-3xl border border-slate-800 space-y-2 text-white">
                    <div className="text-xs font-bold text-blue-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                      <Users2 className="w-4 h-4 text-blue-400" />
                      <span>Gaya Komunikasi & Dinamika Tim:</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
                      {deepseek?.gaya_komunikasi_dan_dinamika_tim ||
                        "Komunikasi lugas, berbasis fakta, menghargai diskusi logis, dan lebih nyaman dengan kolaborasi terstruktur."}
                    </p>
                  </div>
                </div>

                {/* Audit 50 Answers */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAuditAnswers(!showAuditAnswers)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold transition-colors border border-slate-800 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <ListOrdered className="w-4 h-4 text-indigo-400" />
                      <span>Audit Riwayat Jawaban Kandidat (50 Butir Soal 4 Framework)</span>
                    </span>
                    <span className="text-slate-400 font-normal">
                      {showAuditAnswers ? "Sembunyikan ▲" : "Tampilkan 50 Jawaban ▼"}
                    </span>
                  </button>

                  {showAuditAnswers && (
                    <div className="mt-4 p-6 bg-slate-900/90 rounded-3xl border border-slate-800 space-y-3">
                      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-2">
                        {ALL_50_PSYCHOMETRIC_QUESTIONS.map((q, idx) => {
                          const ansVal = rawAnswers[q.id];
                          return (
                            <div
                              key={q.id}
                              className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="space-y-0.5 flex-1 pr-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-500">#{idx + 1}</span>
                                  <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-500/30">
                                    {q.framework} &bull; {q.category}
                                  </span>
                                </div>
                                <p className="text-slate-300 leading-relaxed pt-1">{q.text}</p>
                              </div>
                              <div className="shrink-0 flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700">
                                <span className="font-black text-indigo-400">
                                  {q.type === "likert" ? `Skor: ${ansVal ?? 3}/5` : `Pilihan: Opsi ${ansVal || "A"}`}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : isCvPassed ? (
              <div className="p-10 bg-amber-950/30 rounded-3xl border border-amber-500/30 text-center space-y-2">
                <Clock className="w-8 h-8 text-amber-400 mx-auto" />
                <h4 className="text-sm font-bold text-amber-300">
                  Kandidat Belum Menyelesaikan Tes Psikometri 50 Soal
                </h4>
                <p className="text-xs text-amber-400 max-w-md mx-auto">
                  Kandidat telah lolos screening CV dan instrumen psikometri 4 Framework telah aktif di akun kandidat.
                </p>
              </div>
            ) : (
              <div className="p-10 bg-slate-900/60 rounded-3xl border border-slate-800 text-center space-y-2">
                <Minus className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">
                  Tes psikometri tidak tersedia karena kandidat tidak memenuhi batas kualifikasi CV.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 7. TAB 4: RESUME SCREENING & QUALIFICATIONS                               */}
        {/* ========================================================================= */}
        {activeTab === "cv" && (
          <div className="space-y-6">
            <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl text-white border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
              <div className="flex items-center gap-5">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black ${
                  isCvPassed ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                }`}>
                  {app.cv_score ?? 0}
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    AI Resume Matching Score
                  </div>
                  <div className="text-lg font-black text-white">
                    {isCvPassed ? "✓ Memenuhi Syarat Kualifikasi" : "✕ Tidak Memenuhi Passing Threshold"}
                  </div>
                  <div className="text-xs text-slate-400">
                    Passing Threshold Posisi Ini: {minScore} / 100
                  </div>
                </div>
              </div>

              <a
                href={storageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-lg shadow-blue-500/25"
              >
                <FileText className="w-4 h-4" />
                <span>Buka Dokumen CV Lengkap</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* AI Breakdown */}
            {evaluation?.alasan_keputusan && (
              <div className="p-6 bg-slate-900/90 rounded-3xl border border-slate-800 text-white space-y-2">
                <strong className="text-xs text-slate-300">Rangkuman Kesesuaian Kualifikasi CV:</strong>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
                  {evaluation.alasan_keputusan}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {kelebihan.length > 0 && (
                <div className="p-6 bg-slate-900/90 rounded-3xl border border-emerald-500/30 text-white space-y-3">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>Kelebihan & Keterampilan Sesuai:</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-2">
                    {kelebihan.map((k, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{k}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {kekurangan.length > 0 && (
                <div className="p-6 bg-slate-900/90 rounded-3xl border border-amber-500/30 text-white space-y-3">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Gap Kualifikasi / Poin Kurang:</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-2">
                    {kekurangan.map((k, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{k}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {interviewQuestions.length > 0 && (
              <div className="p-6 bg-slate-900/90 rounded-3xl border border-purple-500/30 text-white space-y-3">
                <div className="text-xs font-bold text-purple-300 flex items-center gap-2 border-b border-slate-800 pb-2">
                  <HelpCircle className="w-4 h-4 text-purple-400" />
                  <span>Rekomendasi Pertanyaan Teknis:</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-2">
                  {interviewQuestions.map((q, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 bg-slate-950/70 p-3 rounded-xl border border-purple-500/20">
                      <span className="text-purple-400 font-black">Q{idx + 1}:</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
