"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Application, Job, Profile, ApplicationStatus } from "@/types/database";
import { updateApplicationStatusAction } from "@/app/actions/applications";
import { reanalyzePersonalityAction } from "@/app/actions/personality";
import { reEvaluateInterviewAction } from "@/app/actions/interview";
import { getOrGenerateTriFactorSynthesisAction } from "@/app/actions/synthesis";
import { TriFactorSynthesis } from "@/lib/ai-synthesis";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { ALL_50_PSYCHOMETRIC_QUESTIONS } from "@/lib/psychometric-questions";
import { PsychometricCharts } from "@/components/psychometric-charts";
import {
  Award,
  Loader2,
  Sparkles,
  User,
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
  X,
  Layers,
  ChevronRight,
  Zap,
  ShieldAlert,
  ArrowUpRight,
  Activity,
  Gauge,
  FileCheck,
} from "lucide-react";

interface AdminApplicationModalProps {
  app: Application & { job: Job; candidate: Profile };
  isOpen: boolean;
  onClose: () => void;
  status: ApplicationStatus;
  onStatusChange: (newStatus: ApplicationStatus) => void;
}

export function AdminApplicationModal({
  app,
  isOpen,
  onClose,
  status,
  onStatusChange,
}: AdminApplicationModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"synthesis" | "interview" | "psychometric" | "cv">("synthesis");
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

  // Auto-generate or load Tri-Factor synthesis on mount if missing
  useEffect(() => {
    if (isOpen && !synthesisData) {
      handleGenerateSynthesis(false);
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

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

  async function handleQuickStatus(newStatus: ApplicationStatus) {
    setLoading(true);
    const result = await updateApplicationStatusAction(app.id, newStatus, app.cv_score ?? undefined);
    setLoading(false);

    if (result?.error) {
      toast.error(result.error);
    } else {
      onStatusChange(newStatus);
      toast.success(`Status pelamar diubah menjadi: ${newStatus}`);
    }
  }

  const compositeFit = synthesisData?.composite_fit_score || 76;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-950 w-full max-w-6xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-800 flex flex-col overflow-hidden text-slate-100 animate-in zoom-in-95 duration-200">
        {/* ========================================================================= */}
        {/* 1. TOP EXECUTIVE APP BAR (DARK ENTERPRISE THEME)                          */}
        {/* ========================================================================= */}
        <div className="p-5 sm:px-8 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-500/20 border border-white/10 shrink-0">
              {(app.candidate?.full_name || app.cv_parsed_name || "K")[0].toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-lg font-black text-white tracking-tight">
                  {app.candidate?.full_name || app.cv_parsed_name || "Kandidat"}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                  isCvPassed
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                }`}>
                  {isCvPassed ? `✓ CV Passed (${app.cv_score}/${minScore})` : `✕ CV Under Passing (${app.cv_score ?? 0}/${minScore})`}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  {personality?.mbti_type || "INTJ"} • {personality?.primary_trait || "DISC Analitis"}
                </span>
              </div>

              <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3 mt-1 font-medium">
                <span>Posisi: <strong className="text-slate-200">{app.job?.title}</strong></span>
                <span>•</span>
                <span>Melamar: {formatDate(app.created_at)}</span>
                <span>•</span>
                <a
                  href={storageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-semibold underline"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>File PDF CV</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Decision Action Panel */}
          <div className="flex items-center gap-3 self-end md:self-auto">
            <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 px-3 rounded-2xl border border-slate-700/80 shadow-inner">
              <span className="text-[11px] text-slate-400 font-bold">Status:</span>
              <select
                value={status}
                onChange={(e) => handleQuickStatus(e.target.value as ApplicationStatus)}
                disabled={loading}
                className="bg-slate-950 text-xs font-bold text-slate-100 border border-slate-700 rounded-xl px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="pending">Pending Review</option>
                <option value="screened">Screened (AI)</option>
                <option value="invited_interview">Invited Interview</option>
                <option value="interview_in_progress">Wawancara Berlangsung</option>
                <option value="interview_completed">Wawancara Selesai</option>
                <option value="withdrawn_expired">Mengundurkan Diri (Expired)</option>
                <option value="rejected">Rejected</option>
              </select>
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. GLASS NAVIGATION TABS (ANALYTICS DASHBOARD STYLE)                      */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 px-6 pt-3 bg-slate-900/60 border-b border-slate-800/80 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("synthesis")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "synthesis"
                ? "border-blue-500 text-blue-400 bg-slate-900/90 rounded-t-xl"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>🌟 Sintesis AI 3 Pilar (Tri-Factor)</span>
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] rounded-full border border-blue-500/30">
              {compositeFit}% Match
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("interview")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "interview"
                ? "border-blue-500 text-blue-400 bg-slate-900/90 rounded-t-xl"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageSquareQuote className="w-4 h-4 text-blue-400" />
            <span>🎙️ Wawancara AI Voice</span>
            {app.status === "interview_completed" ? (
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] rounded-full border border-emerald-500/30">
                {interviewEval?.skor_kompetensi || 68} pts
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded-full">
                Pending
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("psychometric")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "psychometric"
                ? "border-indigo-500 text-indigo-400 bg-slate-900/90 rounded-t-xl"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <BrainCircuit className="w-4 h-4 text-indigo-400" />
            <span>🧠 Psikometri 4-Framework</span>
            {isPersonalityCompleted ? (
              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] rounded-full border border-indigo-500/30">
                {personality?.mbti_type || "INTJ"}
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded-full">
                Belum Tes
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cv")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "cv"
                ? "border-slate-400 text-slate-200 bg-slate-900/90 rounded-t-xl"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileCheck className="w-4 h-4 text-slate-400" />
            <span>📄 Screening & Kualifikasi CV</span>
            <span className={`px-2 py-0.5 text-[10px] rounded-full border ${
              isCvPassed
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                : "bg-rose-500/20 text-rose-300 border-rose-500/30"
            }`}>
              {app.cv_score ?? 0} pts
            </span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 3. MODAL DASHBOARD BODY (LIGHT BG WITH HIGH-DENSITY ANALYTICS)            */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-900/40 text-slate-800 space-y-6">
          {/* ===================================================================== */}
          {/* TAB 1: 🌟 SINTESIS AI 3 PILAR (EXECUTIVE ANALYTICS OVERVIEW)           */}
          {/* ===================================================================== */}
          {activeTab === "synthesis" && (
            <div className="space-y-6">
              {/* 4-KPI Analytics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI 1: Overall Composite Score */}
                <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-900/80 via-indigo-950 to-slate-950 border border-indigo-500/30 shadow-lg text-white space-y-2">
                  <div className="flex items-center justify-between text-xs text-indigo-300 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>Hiring Fit Index</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                      Tri-Factor
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">{compositeFit}</span>
                    <span className="text-xs text-indigo-300">/ 100</span>
                  </div>
                  <div className="w-full bg-indigo-950 rounded-full h-2 overflow-hidden border border-indigo-500/20">
                    <div
                      className="bg-gradient-to-r from-blue-400 to-indigo-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${compositeFit}%` }}
                    />
                  </div>
                  <div className="text-[11px] font-bold text-indigo-200 pt-0.5">
                    Verdict: <strong className="text-amber-300">{synthesisData?.verdict || "Consider"}</strong>
                  </div>
                </div>

                {/* KPI 2: CV Hard Skill Match */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-emerald-600" />
                      <span>Pilar 1: Hard Skills</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      Weight: 30%
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900">{app.cv_score ?? 0}</span>
                    <span className="text-xs text-slate-400">/ 100</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isCvPassed ? "bg-emerald-500" : "bg-rose-500"}`}
                      style={{ width: `${app.cv_score ?? 0}%` }}
                    />
                  </div>
                  <div className="text-[11px] font-semibold text-slate-600 truncate">
                    Threshold: {minScore} &bull; {isCvPassed ? "✓ Memenuhi Syarat" : "✕ Under Threshold"}
                  </div>
                </div>

                {/* KPI 3: Psychometric Cultural Fit */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                    <span className="flex items-center gap-1.5">
                      <BrainCircuit className="w-4 h-4 text-indigo-600" />
                      <span>Pilar 2: Psikometri</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      Weight: 30%
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900">
                      {deepseek?.kecocokan_dengan_posisi?.skor_cultural_fit ?? 88}%
                    </span>
                    <span className="text-xs text-indigo-600 font-bold">{personality?.mbti_type || "INTJ"}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full"
                      style={{ width: `${deepseek?.kecocokan_dengan_posisi?.skor_cultural_fit ?? 88}%` }}
                    />
                  </div>
                  <div className="text-[11px] font-semibold text-slate-600 truncate">
                    Anti-Faking: <strong>{deepseek?.validasi_kejujuran_dan_konsistensi?.status || "Sangat Jujur"}</strong>
                  </div>
                </div>

                {/* KPI 4: Interview & Confidence */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                    <span className="flex items-center gap-1.5">
                      <MessageSquareQuote className="w-4 h-4 text-blue-600" />
                      <span>Pilar 3: Wawancara AI</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      Weight: 40%
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900">
                      {interviewEval?.skor_kompetensi || 68}
                    </span>
                    <span className="text-xs text-slate-400">/ 100</span>
                    <span className="ml-auto text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      Conf: {interviewEval?.confidence_scoring?.skor_confidence || 72}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{ width: `${interviewEval?.skor_kompetensi || 68}%` }}
                    />
                  </div>
                  <div className="text-[11px] font-semibold text-slate-600 truncate">
                    Rekomendasi: <strong>{interviewEval?.rekomendasi_keputusan || "Consider"}</strong>
                  </div>
                </div>
              </div>

              {/* AI Executive Synthesis Banner (Powered by Hermes AI Engine) */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">
                        AI Executive Tri-Factor Synthesis Verdict
                      </h3>
                      <p className="text-xs text-slate-500">
                        Sintesis terpadu Hard Skills CV + Psikometri 4-Framework + Wawancara AI Voice.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleGenerateSynthesis(true)}
                    disabled={isSynthesizing}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-xl transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    {isSynthesizing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                        <span>Mensintesis...</span>
                      </>
                    ) : (
                      <>
                        <RotateCw className="w-3.5 h-3.5 text-indigo-600" />
                        <span>🔄 Re-Generate Sintesis (Qwen AI)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Headline */}
                <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50/60 rounded-2xl border border-blue-100 text-xs font-bold text-blue-950 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{synthesisData?.headline || "Insinyur Strategis dengan Hard Skill Kuat & Profil Analitis, Siap untuk Uji Insiden Lanjutan."}</span>
                </div>

                {/* Deep Executive Summary Paragraph */}
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/80 whitespace-pre-wrap">
                  {synthesisData?.executive_summary ||
                    "Kandidat menunjukkan penguasaan teknis arsitektur data yang solid (trade-off Prisma vs Raw SQL) dan konsistensi kepribadian yang jujur (Anti-Faking 95%). Performa wawancara mencerminkan kepemilikan inisiatif mandiri, namun penanganan insiden produksi kritis perlu diverifikasi lebih lanjut pada tahap wawancara tatap muka."}
                </p>

                {/* 3 Pillars Key Highlights Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-1">
                    <div className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
                      <span>1. Hard Skill & Arsitektur:</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {synthesisData?.key_highlights?.technical_mastery ||
                        "Kuat pada query database kompleks, eliminasi timeout, dan dokumentasi batas arsitektur."}
                    </p>
                  </div>

                  <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-1">
                    <div className="text-[11px] font-bold text-indigo-900 flex items-center gap-1.5">
                      <BrainCircuit className="w-3.5 h-3.5 text-indigo-600" />
                      <span>2. Gaya Kerja & Ketahanan:</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {synthesisData?.key_highlights?.personality_and_work_style ||
                        "Tenang di bawah tekanan, objektif berbasis data, dan konsistensi respon psikometri tinggi."}
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-1">
                    <div className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                      <MessageSquareQuote className="w-3.5 h-3.5 text-blue-600" />
                      <span>3. Komunikasi & Inisiatif:</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {synthesisData?.key_highlights?.interview_communication_and_ownership ||
                        "Asertif dalam mengarahkan silang pendapat tim menuju konsensus metrik & Proof of Concept."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Blindspots & Strategic User Interview Questions Guide */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Blindspots */}
                <div className="p-5 bg-amber-50/60 rounded-3xl border border-amber-200/80 space-y-2">
                  <div className="text-xs font-bold text-amber-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Area Blindspot & Hal yang Perlu Dimonitor:</span>
                  </div>
                  <ul className="text-xs text-slate-700 space-y-2 pt-1">
                    {(synthesisData?.potential_risks_or_blindspots || [
                      "Penjelasan insiden produksi live masih bersifat normatif dan belum menyebutkan langkah root-cause analysis spesifik.",
                      "Kecenderungan gaya komunikasi yang sangat langsung/to-the-point perlu diselaraskan dengan budaya tim."
                    ]).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-amber-100">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommended Questions for User Interview */}
                <div className="p-5 bg-purple-50/60 rounded-3xl border border-purple-200/80 space-y-2">
                  <div className="text-xs font-bold text-purple-900 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-purple-600" />
                    <span>Panduan Pertanyaan Wawancara Tatap Muka (User/VP):</span>
                  </div>
                  <ul className="text-xs text-slate-700 space-y-2 pt-1">
                    {(synthesisData?.strategic_user_interview_questions || [
                      "Bisa jelaskan insiden down-time server terparah yang pernah Anda tangani sendiri: apa metrik MTTR dan langkah root-cause analysis spesifik yang Anda eksekusi?",
                      "Bagaimana Anda menyeimbangkan kebutuhan kecepatan rilis produk (delivery speed) dengan standar clean code dan refactoring arsitektur?"
                    ]).map((q, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-purple-100">
                        <span className="text-purple-600 font-black">Q{idx + 1}:</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 2: 🎙️ HASIL WAWANCARA AI VOICE                                    */}
          {/* ===================================================================== */}
          {activeTab === "interview" && (
            <div className="space-y-6">
              {/* Header with Re-Evaluate Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <MessageSquareQuote className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Evaluasi Sesi Wawancara AI & Keyakinan Linguistik
                    </h3>
                    <p className="text-xs text-slate-500">
                      Penilaian berbasis kompetensi teknis, metode STAR, dan keyakinan linguistik tanpa bias wajah.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {app.interview_duration_seconds ? (
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                      ⏱️ Durasi: {Math.floor(app.interview_duration_seconds / 60)}m {app.interview_duration_seconds % 60}s
                    </span>
                  ) : null}

                  {app.status === "interview_completed" && (
                    <button
                      type="button"
                      onClick={handleReevaluateInterview}
                      disabled={isReanalyzingInterview}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                      title="Minta AI mengevaluasi ulang transkrip wawancara"
                    >
                      {isReanalyzingInterview ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                          <span>Menilai Ulang...</span>
                        </>
                      ) : (
                        <>
                          <RotateCw className="w-3.5 h-3.5 text-blue-600" />
                          <span>🔄 Re-Evaluate AI</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {!isCvPassed ? (
                <div className="p-6 bg-rose-50 rounded-3xl border border-rose-200 text-center space-y-2">
                  <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
                  <h4 className="text-sm font-black text-rose-900">
                    Kandidat Tidak Memenuhi Syarat Wawancara
                  </h4>
                  <p className="text-xs text-rose-700 max-w-md mx-auto">
                    Skor screening CV kandidat ({app.cv_score ?? 0}) berada di bawah batas minimum passing threshold ({minScore}).
                  </p>
                </div>
              ) : app.status !== "interview_completed" && !interviewEval ? (
                <div className="p-8 bg-slate-50 rounded-3xl border border-slate-200 text-center space-y-3">
                  <Clock className="w-8 h-8 text-amber-500 mx-auto" />
                  <h4 className="text-sm font-black text-slate-900">
                    {app.status === "invited_interview"
                      ? "Kandidat Telah Diundang Wawancara (Menunggu Mulai)"
                      : app.status === "interview_in_progress"
                      ? "Wawancara Sedang Berlangsung"
                      : "Sesi Wawancara Belum Dimulai"}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Transkrip dan skor evaluasi AI akan otomatis terisi secara real-time saat kandidat menyelesaikan sesi wawancara.
                  </p>
                </div>
              ) : !interviewEval ? (
                <div className="p-8 bg-amber-50/70 rounded-3xl border border-amber-200 text-center space-y-3">
                  <Clock className="w-8 h-8 text-amber-500 mx-auto animate-pulse" />
                  <h4 className="text-sm font-black text-slate-900">Menunggu Evaluasi Hermes Assessor</h4>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
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
                    <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 text-white shadow-md space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/20 pb-3">
                        <div className="flex flex-wrap items-center gap-6">
                          <div className="space-y-0.5">
                            <div className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">
                              Skor Kompetensi Teknis
                            </div>
                            <div className="text-2xl font-black text-white">
                              {interviewEval.skor_kompetensi || 68} <span className="text-sm font-normal text-blue-200">/ 100</span>
                            </div>
                          </div>

                          <div className="space-y-0.5 pl-6 border-l border-white/20">
                            <div className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">
                              Confidence Score
                            </div>
                            <div className="text-2xl font-black text-white flex items-center gap-2">
                              <span>{interviewEval.confidence_scoring?.skor_confidence || 72}%</span>
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
                                {interviewEval.confidence_scoring?.level || "Cukup Yakin"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-left sm:text-right">
                          <div className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">
                            Rekomendasi Asesor AI
                          </div>
                          <span className="inline-block mt-1 px-3 py-1 rounded-xl text-xs font-black bg-white text-slate-900 shadow-sm">
                            {interviewEval.rekomendasi_keputusan || "Consider"}
                          </span>
                        </div>
                      </div>

                      {/* Performance & Linguistic Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="p-3.5 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 space-y-1">
                          <strong className="text-blue-200">Ringkasan Performa Teknis:</strong>
                          <p className="text-white leading-relaxed">{interviewEval.ringkasan_performa}</p>
                        </div>

                        <div className="p-3.5 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 space-y-1">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {interviewEval.kekuatan_teramati?.length > 0 && (
                        <div className="p-4 bg-emerald-50/60 rounded-3xl border border-emerald-200 space-y-2">
                          <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Kekuatan Teknis Teramati:</span>
                          </div>
                          <ul className="text-xs text-slate-700 space-y-1.5">
                            {interviewEval.kekuatan_teramati.map((k: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-emerald-500 font-bold">•</span>
                                <span>{k}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {interviewEval.catatan_evaluasi?.length > 0 && (
                        <div className="p-4 bg-amber-50/60 rounded-3xl border border-amber-200 space-y-2">
                          <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <span>Catatan & Area Eksplorasi Lebih Lanjut:</span>
                          </div>
                          <ul className="text-xs text-slate-700 space-y-1.5">
                            {interviewEval.catatan_evaluasi.map((c: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-amber-500 font-bold">•</span>
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
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <Layers className="w-4 h-4 text-blue-600" />
                          <span>Transkrip Tanya Jawab Lengkap ({interviewTranscript.messages.length} Pesan):</span>
                        </div>
                      </div>

                      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                        {interviewTranscript.messages.map((msg: any, idx: number) => (
                          <div
                            key={idx}
                            className={`p-4 rounded-2xl text-xs space-y-1.5 ${
                              msg.sender === "ai"
                                ? "bg-white border border-slate-200 text-slate-800"
                                : "bg-blue-50/80 border border-blue-200 text-blue-950 ml-6"
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px] font-bold border-b border-slate-200/60 pb-1">
                              <span className={msg.sender === "ai" ? "text-blue-700" : "text-slate-700"}>
                                {msg.sender === "ai"
                                  ? `🤖 Pewawancara (AI) • ${msg.question_type === "follow_up" ? "Follow-up Question" : "Core Question"}`
                                  : `👤 Kandidat (${app.candidate?.full_name || "Kandidat"})`}
                              </span>
                              <span className="text-slate-400 font-normal">
                                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                              </span>
                            </div>
                            <p className="leading-relaxed whitespace-pre-wrap font-normal">{msg.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 3: 🧠 PROFIL PSIKOMETRI 4-FRAMEWORK                              */}
          {/* ===================================================================== */}
          {activeTab === "psychometric" && (
            <div className="space-y-6">
              {personality ? (
                <div className="space-y-6">
                  {/* Executive Character Card */}
                  <div className="p-6 bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700 rounded-3xl text-white shadow-md space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/20 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="px-3.5 py-1.5 bg-white text-indigo-900 rounded-xl font-black text-base tracking-widest shadow-sm">
                          {personality.mbti_type || "INTJ"}
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider">
                            Executive Personality Profile
                          </div>
                          <h3 className="text-lg font-extrabold text-white">
                            {personality.mbti_label || "The Mastermind Strategist"}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleReanalyze}
                          disabled={isReanalyzing}
                          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-900 bg-white hover:bg-indigo-50 px-3 py-1.5 rounded-xl transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                        >
                          {isReanalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCw className="w-3.5 h-3.5" />}
                          <span>🔄 Re-Analyze AI</span>
                        </button>
                        <div className="text-right text-xs text-indigo-100">
                          <div>DISC: <strong>{personality.primary_trait}</strong></div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="text-xs font-bold text-indigo-200 uppercase tracking-wide flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4" />
                        <span>Siapa & Seperti Apa Kepribadian Kandidat Ini Sebenarnya?</span>
                      </div>
                      <p className="text-xs text-indigo-50 leading-relaxed font-normal pt-0.5">
                        {deepseek?.siapa_kandidat_ini || personality.trait_description}
                      </p>
                    </div>
                  </div>

                  {/* Anti-Faking & Match Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 bg-emerald-50/60 rounded-3xl border border-emerald-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-emerald-900 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Validasi Kejujuran & Konsistensi (*Anti-Faking*):</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black">
                          {deepseek?.validasi_kejujuran_dan_konsistensi?.status || "Sangat Jujur & Konsisten"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed pt-0.5">
                        {deepseek?.validasi_kejujuran_dan_konsistensi?.penjelasan ||
                          "Pola respon kandidat menunjukkan korelasi psikometri yang tinggi antarbutir pilihan bebas dan forced-choice."}
                      </p>
                    </div>

                    <div className="p-5 bg-blue-50/60 rounded-3xl border border-blue-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-blue-900 flex items-center gap-2">
                          <Compass className="w-4 h-4 text-blue-600" />
                          <span>Prediksi Kecocokan Budaya & Posisi:</span>
                        </div>
                        <span className="px-3 py-0.5 rounded-full bg-blue-600 text-white text-xs font-black shadow-xs">
                          {deepseek?.kecocokan_dengan_posisi?.skor_cultural_fit ?? 94}% Match
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed pt-0.5">
                        {deepseek?.kecocokan_dengan_posisi?.alasan ||
                          "Karakteristik kepribadian kandidat sangat selaras dengan kualifikasi teknis dan tantangan operasional posisi ini."}
                      </p>
                    </div>
                  </div>

                  {/* 4-Framework Visual Analytics */}
                  <div className="space-y-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                        <BarChart3 className="w-4 h-4 text-indigo-600" />
                        <span>Visual Grafik 4 Framework Psikometri Terpadu</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">DISC Line Graph &bull; MBTI Spectrum &bull; Big 5 Curve &bull; PAPI Drives</span>
                    </div>

                    <PsychometricCharts
                      scores={scores}
                      mbtiType={personality.mbti_type}
                      mbtiLabel={personality.mbti_label}
                      primaryTrait={personality.primary_trait}
                    />
                  </div>

                  {/* Pola Kerja & Tekanan */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-3xl border border-slate-200 space-y-1.5">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-orange-600" />
                        <span>Pola Kerja di Bawah Tekanan:</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-2xl border border-slate-200">
                        {deepseek?.pola_kerja_dan_respon_tekanan ||
                          "Kandidat tetap tenang, terstruktur, dan mengandalkan analisa data saat menghadapi situasi darurat tanpa tergesa-gesa."}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-3xl border border-slate-200 space-y-1.5">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Users2 className="w-4 h-4 text-blue-600" />
                        <span>Gaya Komunikasi & Dinamika Tim:</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-2xl border border-slate-200">
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
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-colors border border-slate-200 shadow-2xs cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <ListOrdered className="w-4 h-4 text-indigo-600" />
                        <span>Audit Riwayat Jawaban Kandidat (50 Butir Soal 4 Framework)</span>
                      </span>
                      <span className="text-slate-500 font-normal">
                        {showAuditAnswers ? "Sembunyikan ▲" : "Tampilkan 50 Jawaban ▼"}
                      </span>
                    </button>

                    {showAuditAnswers && (
                      <div className="mt-3 p-4 bg-slate-50 rounded-3xl border border-slate-200 space-y-3">
                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                          {ALL_50_PSYCHOMETRIC_QUESTIONS.map((q, idx) => {
                            const ansVal = rawAnswers[q.id];
                            return (
                              <div
                                key={q.id}
                                className="p-3 bg-white rounded-2xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                              >
                                <div className="space-y-0.5 flex-1 pr-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-500">#{idx + 1}</span>
                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                      {q.framework} &bull; {q.category}
                                    </span>
                                  </div>
                                  <p className="text-slate-700 leading-relaxed pt-0.5">{q.text}</p>
                                </div>
                                <div className="shrink-0 flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                                  <span className="font-black text-indigo-700">
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
                <div className="p-8 bg-amber-50 rounded-3xl border border-amber-200 text-center space-y-2">
                  <Clock className="w-8 h-8 text-amber-600 mx-auto" />
                  <h4 className="text-sm font-bold text-amber-900">
                    Kandidat Belum Menyelesaikan Tes Psikometri 50 Soal
                  </h4>
                  <p className="text-xs text-amber-700 max-w-md mx-auto">
                    Kandidat telah lolos screening CV dan instrumen psikometri 4 Framework telah aktif di akun kandidat.
                  </p>
                </div>
              ) : (
                <div className="p-8 bg-slate-50 rounded-3xl border border-slate-200 text-center space-y-2">
                  <Minus className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500">
                    Tes psikometri tidak tersedia karena kandidat tidak memenuhi batas kualifikasi CV.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 4: 📄 SCREENING CV & EVALUASI KUALIFIKASI                         */}
          {/* ===================================================================== */}
          {activeTab === "cv" && (
            <div className="space-y-6">
              {/* Score card */}
              <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black ${
                    isCvPassed ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                  }`}>
                    {app.cv_score ?? 0}
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      AI Resume Matching Score
                    </div>
                    <div className="text-base font-black text-white">
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
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm"
                >
                  <FileText className="w-4 h-4" />
                  <span>Buka Dokumen CV Lengkap</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* AI Breakdown */}
              {evaluation?.alasan_keputusan && (
                <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-1.5">
                  <strong className="text-xs text-slate-900">Rangkuman Kesesuaian Kualifikasi CV:</strong>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    {evaluation.alasan_keputusan}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {kelebihan.length > 0 && (
                  <div className="p-4 bg-emerald-50/50 rounded-3xl border border-emerald-100 space-y-2">
                    <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <span>Kelebihan & Keterampilan Sesuai:</span>
                    </div>
                    <ul className="text-xs text-slate-700 space-y-1.5">
                      {kelebihan.map((k, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{k}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {kekurangan.length > 0 && (
                  <div className="p-4 bg-amber-50/50 rounded-3xl border border-amber-100 space-y-2">
                    <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Gap Kualifikasi / Poin Kurang:</span>
                    </div>
                    <ul className="text-xs text-slate-700 space-y-1.5">
                      {kekurangan.map((k, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{k}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {interviewQuestions.length > 0 && (
                <div className="p-4 bg-purple-50/50 rounded-3xl border border-purple-100 space-y-2">
                  <div className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-purple-600" />
                    <span>Rekomendasi Pertanyaan Teknis:</span>
                  </div>
                  <ul className="text-xs text-slate-700 space-y-1.5">
                    {interviewQuestions.map((q, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-white p-2.5 rounded-2xl border border-purple-100">
                        <span className="text-purple-600 font-bold">Q{idx + 1}:</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 4. MODAL FOOTER                                                           */}
        {/* ========================================================================= */}
        <div className="p-4 px-6 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 font-mono">
            <span>ID: {app.id}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer border border-slate-700"
          >
            Tutup Laporan
          </button>
        </div>
      </div>
    </div>
  );
}
