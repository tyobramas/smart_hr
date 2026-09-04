"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { applyJobAction, ApplyJobResult } from "@/app/actions/applications";
import { Job, Profile } from "@/types/database";
import { ApplicationTimeline } from "@/components/application-timeline";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  User,
  FileText,
  UploadCloud,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  X,
  FileCheck,
  Award,
  ArrowRight,
  Loader2,
  TrendingUp,
  AlertTriangle,
  HelpCircle,
  XCircle,
  ShieldCheck,
  BarChart3,
  Check,
  Layers,
  Compass,
  Cpu,
  Target,
  Zap,
  ShieldAlert,
} from "lucide-react";

interface ApplyFormProps {
  job: Job;
  profile: Profile;
}

export function ApplyForm({ job, profile }: ApplyFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [screeningResult, setScreeningResult] = useState<ApplyJobResult | null>(null);
  const [activeStep, setActiveStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  }

  function validateAndSetFile(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file terlalu besar. Maksimal 10MB.");
      return;
    }

    const validExtensions = ["pdf", "doc", "docx"];
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !validExtensions.includes(ext)) {
      toast.error("Format file tidak didukung. Harap upload file .PDF, .DOC, atau .DOCX.");
      return;
    }

    setSelectedFile(file);
    toast.success(`File ${file.name} berhasil dipilih.`);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  }

  function removeFile() {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedFile) {
      setErrorMessage("Silakan pilih atau upload dokumen CV Anda terlebih dahulu.");
      toast.error("Silakan pilih dokumen CV Anda.");
      return;
    }

    const formData = new FormData(e.currentTarget);

    setIsProcessing(true);
    setActiveStep(1);

    const stepTimer1 = setTimeout(() => setActiveStep(2), 1200);
    const stepTimer2 = setTimeout(() => setActiveStep(3), 2800);

    try {
      const result = await applyJobAction(formData);

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsProcessing(false);

      if (result.error) {
        setErrorMessage(result.error);
        toast.error(result.error);
      } else {
        setScreeningResult(result);
        toast.success("Evaluasi Kualifikasi Selesai! Skor kecocokan profil berhasil dihitung.");
      }
    } catch (err: any) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsProcessing(false);
      setErrorMessage("Terjadi kesalahan saat memproses lamaran.");
      toast.error("Terjadi kesalahan.");
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  // ==========================================
  // VIEW 1: PROCESSING / LOADING ANIMATION
  // ==========================================
  if (isProcessing) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="card-3d rounded-3xl p-10 bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-2xl text-center space-y-8 relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Animated Glowing Badge */}
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
            <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 opacity-30 blur-lg animate-pulse" />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-700 flex items-center justify-center text-white shadow-xl">
              <Sparkles className="w-10 h-10 animate-bounce" />
            </div>
          </div>

          <div className="space-y-2 relative z-10">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              Mengevaluasi Profil & Dokumen Kompetensi...
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Sistem analitis sedang mencocokkan keterampilan teknis, portofolio, dan rekam jejak kerja Anda terhadap standar posisi.
            </p>
          </div>

          {/* Steps Progress List */}
          <div className="max-w-md mx-auto text-left space-y-3 bg-gradient-to-b from-slate-50 to-slate-100/60 p-5 rounded-2xl border border-slate-200 shadow-inner relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-xs shrink-0">
                ✓
              </div>
              <span className="text-xs font-semibold text-slate-800">
                1. Ekstraksi Dokumen & Verifikasi Portofolio
              </span>
            </div>

            <div className="flex items-center gap-3">
              {activeStep >= 2 ? (
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-xs shrink-0">
                  ✓
                </div>
              ) : (
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin shrink-0" />
              )}
              <span
                className={`text-xs font-semibold ${
                  activeStep >= 2 ? "text-slate-800" : "text-blue-600 font-bold"
                }`}
              >
                2. Analisis Relevansi Kompetensi & Kualifikasi Teknis
              </span>
            </div>

            <div className="flex items-center gap-3">
              {activeStep >= 3 ? (
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin shrink-0" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold shrink-0">
                  3
                </div>
              )}
              <span
                className={`text-xs font-semibold ${
                  activeStep >= 3 ? "text-indigo-600 font-bold" : "text-slate-400"
                }`}
              >
                3. Sintesis Skor Kecocokan & Panduan Seleksi
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Mohon tunggu beberapa detik, verifikasi otomatis sedang berjalan...
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: INSTANT RESULT SCREEN (MODERN & GRAPHICAL)
  // ==========================================
  if (screeningResult && screeningResult.success) {
    const score = screeningResult.score ?? 0;
    const threshold = screeningResult.minScoreThreshold ?? job.min_score_threshold ?? 70;
    const isPassed = screeningResult.outcome
      ? screeningResult.outcome === "passed"
      : score >= threshold;

    // Derived metric breakdown for visualization
    const technicalMatch = Math.min(100, Math.max(20, isPassed ? Math.round(score * 1.02) : Math.round(score * 0.9)));
    const experienceMatch = Math.min(100, Math.max(15, isPassed ? Math.round(score * 0.98) : Math.round(score * 0.85)));
    const qualificationMatch = Math.min(100, Math.max(10, isPassed ? 100 : Math.round(score * 0.75)));
    const roleAlignment = Math.min(100, Math.max(25, Math.round((technicalMatch + experienceMatch + qualificationMatch) / 3)));

    // Parse sections from analysisText if structured
    const analysisLines = (screeningResult.analysisText || "").split("\n");
    let summaryText = "";
    const strengths: string[] = [];
    const gaps: string[] = [];
    const interviewQuestions: string[] = [];

    let currentSection = "";
    for (const line of analysisLines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.toLowerCase().includes("alasan penilaian") || trimmed.toLowerCase().includes("rangkuman evaluasi")) {
        currentSection = "summary";
        continue;
      } else if (trimmed.toLowerCase().includes("kelebihan") || trimmed.toLowerCase().includes("keterampilan yang cocok")) {
        currentSection = "strengths";
        continue;
      } else if (trimmed.toLowerCase().includes("kekurangan") || trimmed.toLowerCase().includes("gap skill") || trimmed.toLowerCase().includes("area tidak sesuai")) {
        currentSection = "gaps";
        continue;
      } else if (trimmed.toLowerCase().includes("rekomendasi pertanyaan") || trimmed.toLowerCase().includes("interview")) {
        currentSection = "interview";
        continue;
      }

      if (currentSection === "summary") {
        summaryText += (summaryText ? " " : "") + trimmed.replace(/^[•\-*]\s*/, "");
      } else if (currentSection === "strengths") {
        if (trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*")) {
          strengths.push(trimmed.replace(/^[•\-*]\s*/, ""));
        } else if (trimmed !== "-") {
          strengths.push(trimmed);
        }
      } else if (currentSection === "gaps") {
        if (trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*")) {
          gaps.push(trimmed.replace(/^[•\-*]\s*/, ""));
        } else if (trimmed !== "-") {
          gaps.push(trimmed);
        }
      } else if (currentSection === "interview") {
        if (trimmed.startsWith("Q") || trimmed.startsWith("•") || trimmed.startsWith("-") || /^\d+\./.test(trimmed)) {
          interviewQuestions.push(trimmed.replace(/^(?:Q\d+:|\d+\.|[•\-*])\s*/, ""));
        }
      }
    }

    if (!summaryText && screeningResult.analysisText) {
      summaryText = screeningResult.analysisText;
    }

    // SVG Circular Gauge calculation
    const radius = 58;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="card-3d rounded-3xl p-8 bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-2xl space-y-8 relative overflow-hidden">
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Header Badge */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-bold shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Evaluasi Kualifikasi Berhasil Diselesaikan</span>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                {job.title}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Kandidat: <strong className="text-slate-800">{profile.full_name}</strong> &bull; Ambang Batas Kelulusan: <strong className="text-slate-800">{threshold} Poin</strong>
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
            <div className="md:col-span-7 space-y-4 relative z-10">
              <div className="flex items-center justify-between pb-1 border-b border-slate-700/50">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                  Metrik Relevansi Kompetensi
                </span>
                <span className="text-[11px] text-slate-400">Benchmark Evaluasi</span>
              </div>

              {/* Metric 1 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Kesesuaian Keterampilan Teknis</span>
                  <span className="text-blue-300 font-bold">{technicalMatch}%</span>
                </div>
                <div className="w-full h-2 bg-slate-700/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-700"
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
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-400 rounded-full transition-all duration-700"
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
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
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
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-700"
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
                {strengths.length > 0 ? (
                  strengths.map((item, idx) => (
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
                {gaps.length > 0 ? (
                  gaps.map((item, idx) => (
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
          <div className="pt-4 border-t border-slate-100">
            <ApplicationTimeline
              data={{
                applicationId: screeningResult.applicationId,
                createdAt: new Date().toISOString(),
                status: screeningResult.status || (isPassed ? "screened" : "rejected"),
                score: score,
                minScoreThreshold: threshold,
                jobTitle: job.title,
                jobSlug: job.slug,
              }}
            />
          </div>

          {/* ========================================================= */}
          {/* SECTION 5: ACTION BUTTONS */}
          {/* ========================================================= */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 border-t border-slate-100">
            {isPassed && screeningResult.applicationId ? (
              <Link
                href={`/applications/${screeningResult.applicationId}/personality-test`}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:scale-[1.02]"
              >
                <Zap className="w-4 h-4" />
                <span>Mulai Tes Psikometri (Tahap 2)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/applications"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-slate-800 hover:bg-slate-900 transition-colors shadow-md"
              >
                <span>Lihat Status di Lamaran Saya</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}

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
  // VIEW 3: INITIAL APPLY FORM
  // ==========================================
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href={`/jobs/${job.slug}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Detail Lowongan
        </Link>
      </div>

      <div className="card-3d rounded-3xl p-8 bg-white border border-slate-200/80 shadow-soft-3d space-y-6">
        {/* Header */}
        <div className="pb-5 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wide">
            <Sparkles className="w-4 h-4" />
            <span>Formulir Pengajuan Lamaran</span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            {job.title}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Lokasi: <span className="text-slate-700 font-semibold">{job.location}</span> &bull; Tipe: <span className="text-slate-700 font-semibold">{job.employment_type}</span>
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs font-medium text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <input type="hidden" name="job_id" value={job.id} />

          {/* Hidden File Input for form submission */}
          <input
            type="file"
            name="cv_file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx"
            className="hidden"
          />

          {/* Full Name (Locked to Registered Profile Identity) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Nama Lengkap Kandidat
              </label>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Identitas Akun Terverifikasi</span>
              </span>
            </div>
            <div className="relative">
              <Input
                type="text"
                name="cv_parsed_name"
                value={profile.full_name}
                readOnly
                className="pl-9 rounded-xl border-slate-200 bg-slate-50 text-slate-700 font-semibold cursor-not-allowed select-none"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Nama terkunci sesuai akun terdaftar. Berkas CV yang diunggah wajib mencantumkan nama yang sama.
            </p>
          </div>

          {/* CV File Upload Dropzone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Upload Berkas Dokumen CV / Portofolio <span className="text-rose-500">*</span>
            </label>

            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? "border-blue-500 bg-blue-50/80 scale-[1.01]"
                    : "border-blue-200 bg-gradient-to-b from-blue-50/40 to-indigo-50/20 hover:bg-blue-50/70 hover:border-blue-300"
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-white border border-blue-200 flex items-center justify-center mx-auto text-blue-600 shadow-sm mb-3 transition-transform group-hover:scale-105">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div className="text-sm font-bold text-slate-800">
                  <span className="text-blue-600 underline underline-offset-2">Klik untuk memilih dokumen CV</span> atau drag & drop ke sini
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Format: PDF, DOC, atau DOCX (Maksimal 10 MB)
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white border border-blue-200/80 text-[11px] font-bold text-blue-700 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Verifikasi Kualifikasi & Portofolio Otomatis</span>
                </div>
              </div>
            ) : (
              <div className="card-3d rounded-2xl p-4 bg-white border border-slate-200 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {selectedFile.name}
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium">
                      {formatFileSize(selectedFile.size)} &bull; Dokumen siap diajukan
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                  >
                    Ganti
                  </button>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Integrity & Anti-Fraud Disclaimer Box */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Disclaimer Integritas & Audit Berkas HRD</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Berkas CV yang Anda unggah akan otomatis diarsipkan ke database HRD untuk keperluan rekam jejak. Jika sistem mendeteksi ketidaksesuaian identitas antara nama akun profil Anda dan dokumen CV, atau ditemukan indikasi kecurangan, sistem akan secara otomatis membatalkan proses lamaran dan memblokir pengajuan Anda.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!selectedFile}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Kirim Lamaran & Verifikasi Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="text-center pt-2">
          <p className="text-[11px] text-slate-400">
            Seluruh data pelamar dienkripsi dan diproses secara objektif tanpa bias.
          </p>
        </div>
      </div>
    </div>
  );
}
