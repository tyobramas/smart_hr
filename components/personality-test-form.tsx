"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { submitPersonalityTestAction } from "@/app/actions/personality";
import { Application, Job, Profile, PersonalityTestResult } from "@/types/database";
import { toast } from "sonner";
import {
  ALL_50_PSYCHOMETRIC_QUESTIONS,
  PsychometricQuestion,
} from "@/lib/psychometric-questions";
import { PsychometricCharts } from "@/components/psychometric-charts";
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  BrainCircuit,
  Award,
  Loader2,
  TrendingUp,
  ShieldCheck,
  Zap,
  Clock,
  HelpCircle,
  FileCheck2,
  Lightbulb,
  Check,
  Shuffle,
  Compass,
  Layers,
  BarChart3,
  Target,
  AlertOctagon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Timer,
  AlertTriangle,
} from "lucide-react";

interface PersonalityTestFormProps {
  app: Application & { job: Job; candidate: Profile };
}

const LIKERT_OPTIONS = [
  { value: 1, label: "Sangat Tidak Setuju" },
  { value: 2, label: "Tidak Setuju" },
  { value: 3, label: "Netral" },
  { value: 4, label: "Setuju" },
  { value: 5, label: "Sangat Setuju" },
];

const TOTAL_TEST_DURATION_SECONDS = 900; // 15 Minutes Countdown

function shuffleList<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

export function PersonalityTestForm({ app }: PersonalityTestFormProps) {
  const router = useRouter();
  const [testStage, setTestStage] = useState<"intro" | "questions">("intro");
  const [shuffledQuestions, setShuffledQuestions] = useState<PsychometricQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(TOTAL_TEST_DURATION_SECONDS);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<PersonalityTestResult | null>(
    (app.personality_result_json as PersonalityTestResult) || null
  );

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Shuffled Questions
  useEffect(() => {
    setShuffledQuestions(shuffleList(ALL_50_PSYCHOMETRIC_QUESTIONS));
  }, []);

  // Countdown Timer when in questions stage
  useEffect(() => {
    if (testStage === "questions" && !testResult) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            toast.error("Waktu pengerjaan telah habis! Sistem akan mengirim jawaban Anda secara otomatis.");
            handleAutoSubmitOnTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [testStage, testResult]);

  function formatTimer(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  function handleStartOrReshuffle() {
    const newlyShuffled = shuffleList(ALL_50_PSYCHOMETRIC_QUESTIONS);
    setShuffledQuestions(newlyShuffled);
    setCurrentIdx(0);
    setAnswers({});
    setTimeRemaining(TOTAL_TEST_DURATION_SECONDS);
    setTestStage("questions");
    toast.success("50 Soal Psikometri (DISC, Big 5, PAPI, MBTI) telah diacak total! 🔀");
  }

  // Candidate cancels / exits assessment
  function handleConfirmExit() {
    setShowExitModal(false);
    setTestStage("intro");
    setAnswers({});
    setCurrentIdx(0);
    setTimeRemaining(TOTAL_TEST_DURATION_SECONDS);
    // Re-shuffle to invalidate pattern memorization
    setShuffledQuestions(shuffleList(ALL_50_PSYCHOMETRIC_QUESTIONS));
    toast.warning("Sesi dibatalkan! 50 Soal telah diacak ulang total untuk menjaga integritas tes.");
  }

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = shuffledQuestions.length || 50;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  function handleSelectOption(questionId: string, val: any) {
    setAnswers((prev) => ({ ...prev, [questionId]: val }));

    // Auto-advance to next question if not at the last question
    if (currentIdx < totalQuestions - 1) {
      setTimeout(() => {
        setCurrentIdx((curr) => curr + 1);
      }, 220);
    }
  }

  async function handleAutoSubmitOnTimeout() {
    setIsSubmitting(true);
    try {
      const res = await submitPersonalityTestAction(app.id, answers);
      setIsSubmitting(false);
      if (res.success && res.result) {
        setTestResult(res.result);
      }
    } catch {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();

    if (answeredCount < totalQuestions) {
      toast.error(`Harap jawab seluruh pertanyaan (${answeredCount}/${totalQuestions} terjawab) sebelum mengirim.`);
      return;
    }

    setIsSubmitting(true);
    toast.info("Sedang memproses evaluasi 4 Framework & Analisis Psikometri...");

    try {
      const res = await submitPersonalityTestAction(app.id, answers);
      setIsSubmitting(false);

      if (res.success && res.result) {
        setTestResult(res.result);
        toast.success("Tes Psikometri Komprehensif Selesai!");
      } else {
        toast.error(res.error || "Gagal memproses hasil tes.");
      }
    } catch (err: any) {
      setIsSubmitting(false);
      toast.error("Terjadi kesalahan saat memproses tes.");
    }
  }

  // ==========================================
  // VIEW 1: COMPLETED RESULT VIEW
  // ==========================================
  if (testResult) {
    const aiAnalysis = testResult.ai_deepseek_analysis;

    return (
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div>
          <Link
            href="/applications"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Riwayat Lamaran
          </Link>
        </div>

        <div className="card-3d rounded-3xl p-8 sm:p-10 bg-white border border-slate-200/90 shadow-2xl text-center space-y-8">
          {/* Header Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black uppercase tracking-wide shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Tes Karakter Kerja 4 Framework Selesai Dikerjakan</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Profil Psikometri Terpadu & Analisis Karakter Kerja
            </h1>
            <p className="text-sm font-medium text-slate-500">
              Posisi: <strong className="text-slate-800">{app.job?.title}</strong> &bull; Kandidat:{" "}
              <strong className="text-slate-800">{app.candidate?.full_name}</strong>
            </p>
          </div>

          {/* MBTI & DISC Highlight Header */}
          <div className="p-6 sm:p-8 bg-gradient-to-r from-indigo-50/90 via-blue-50/70 to-purple-50/50 rounded-2xl border border-indigo-200 space-y-4 text-left shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl font-black text-base tracking-wider shadow-sm">
                  {testResult.mbti_type || "INTJ"}
                </span>
                <span className="text-base font-black text-indigo-950">
                  {testResult.mbti_label || "The Mastermind Strategist"}
                </span>
              </div>
              <span className="text-xs font-extrabold text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-indigo-100 shadow-2xs">
                DISC: {testResult.primary_trait}
              </span>
            </div>

            <p className="text-sm font-medium text-slate-800 leading-relaxed">
              {aiAnalysis?.siapa_kandidat_ini || testResult.trait_description}
            </p>
          </div>

          {/* ========================================================= */}
          {/* 4-FRAMEWORK COMPLETE GRAPHICAL BREAKDOWN (LINE & CURVES)  */}
          {/* ========================================================= */}
          {testResult.scores && (
            <div className="space-y-4 text-left">
              <PsychometricCharts
                scores={testResult.scores}
                mbtiType={testResult.mbti_type}
                mbtiLabel={testResult.mbti_label}
                primaryTrait={testResult.primary_trait}
              />
            </div>
          )}

          {/* AI Summary Grid */}
          <div className="text-left grid grid-cols-1 sm:grid-cols-2 gap-5">
            {testResult.strengths && (
              <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200 space-y-3">
                <div className="text-sm font-black text-emerald-950 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Kekuatan Utama di Tempat Kerja:</span>
                </div>
                <ul className="text-xs font-medium text-slate-800 space-y-2">
                  {testResult.strengths.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {testResult.growth_areas && (
              <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-200 space-y-3">
                <div className="text-sm font-black text-amber-950 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span>Area Pengembangan Potensial:</span>
                </div>
                <ul className="text-xs font-medium text-slate-800 space-y-2">
                  {testResult.growth_areas.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-amber-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                      <span className="leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-600 text-left">
            Hasil lengkap 50 butir respon 4 Framework psikometri Anda telah tersimpan dan terintegrasi dengan laporan penilaian Tim Recruiter.
          </div>

          <div className="pt-2">
            <Link
              href="/applications"
              className="btn-primary-3d inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold w-full sm:w-auto shadow-lg"
            >
              <span>Kembali ke Riwayat Lamaran Saya</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: LANDING PAGE & PETUNJUK PENGERJAAN (LANDSCAPE LAYOUT)
  // ==========================================
  if (testStage === "intro") {
    return (
      <div className="w-full space-y-6">
        <div>
          <Link
            href="/applications"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Riwayat Lamaran
          </Link>
        </div>

        {/* 2-Column Landscape Master Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* ========================================================= */}
          {/* LEFT COLUMN: EXECUTIVE OVERVIEW & START ACTION (5/12)     */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="card-3d rounded-3xl p-8 sm:p-9 bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-2xl space-y-6 relative overflow-hidden flex flex-col justify-between h-full">
              {/* Ambient Glow */}
              <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="space-y-6 relative z-10">
                {/* Header & Emblem */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 shrink-0">
                    <BrainCircuit className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-black tracking-wide uppercase">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Tahap 2 &bull; Asesmen Karakter</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-1">
                      Tes Karakter Kerja
                    </h1>
                  </div>
                </div>

                {/* Candidate & Role Dossier Box */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-left space-y-1.5 shadow-2xs">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Posisi Lowongan
                  </div>
                  <div className="text-lg font-black text-slate-900 leading-snug">
                    {app.job?.title}
                  </div>
                  <div className="text-xs font-bold text-slate-600 pt-1 border-t border-slate-200/60 mt-1 flex items-center justify-between">
                    <span>Kandidat: <strong className="text-slate-900">{app.candidate?.full_name}</strong></span>
                    <span className="text-indigo-600 font-extrabold">50 Soal Baku</span>
                  </div>
                </div>

                {/* 3 Quick Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1 shadow-2xs">
                    <Clock className="w-5 h-5 text-indigo-600 mx-auto" />
                    <div className="text-sm font-black text-slate-900">~15 Menit</div>
                    <div className="text-xs font-bold text-slate-500">Estimasi Waktu</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1 shadow-2xs">
                    <Layers className="w-5 h-5 text-blue-600 mx-auto" />
                    <div className="text-sm font-black text-slate-900">4 Framework</div>
                    <div className="text-xs font-bold text-slate-500">Instrumen Terpadu</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1 shadow-2xs">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto" />
                    <div className="text-sm font-black text-slate-900">Anti-Faking</div>
                    <div className="text-xs font-bold text-slate-500">Validasi Silang</div>
                  </div>
                </div>

                {/* 4 Framework Visual Cards */}
                <div className="space-y-2.5 text-left">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-400">
                    4 Dimensi Karakter yang Diukur
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 space-y-1 shadow-2xs">
                      <div className="text-sm font-black text-rose-900">1. DISC (15 Soal)</div>
                      <div className="text-xs font-bold text-rose-700 leading-snug">Gaya kerja & kepemimpinan</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 space-y-1 shadow-2xs">
                      <div className="text-sm font-black text-amber-900">2. Big Five (15 Soal)</div>
                      <div className="text-xs font-bold text-amber-700 leading-snug">Respon stres & stabilitas emosi</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 space-y-1 shadow-2xs">
                      <div className="text-sm font-black text-emerald-900">3. PAPI (10 Soal)</div>
                      <div className="text-xs font-bold text-emerald-700 leading-snug">Motivasi & kebutuhan kerja</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200/80 space-y-1 shadow-2xs">
                      <div className="text-sm font-black text-blue-900">4. MBTI (10 Soal)</div>
                      <div className="text-xs font-bold text-blue-700 leading-snug">Pola pikir & keputusan logis</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Primary Start CTA Button */}
              <div className="pt-4 border-t border-slate-100 relative z-10">
                <button
                  type="button"
                  onClick={handleStartOrReshuffle}
                  className="w-full flex items-center justify-center gap-3 py-4 px-8 rounded-2xl text-base font-black text-white bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 transition-all shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:scale-[1.02] cursor-pointer"
                >
                  <Zap className="w-5 h-5 fill-white" />
                  <span>Mulai Asesmen 50 Soal Sekarang</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <p className="text-xs font-bold text-slate-500 text-center mt-3">
                  Urutan 50 pertanyaan diacak dinamis oleh sistem.
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: PREVIEWS & STRATEGIC TIPS (7/12)            */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* SECTION 1: SAMPLE QUESTIONS PREVIEW */}
            <div className="card-3d rounded-3xl p-8 sm:p-9 bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-2xl space-y-6 text-left relative overflow-hidden flex-1">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <span className="text-sm sm:text-base font-black tracking-tight text-slate-900 flex items-center gap-2.5">
                  <Compass className="w-5 h-5 text-indigo-600" />
                  Simulasi & Contoh Format Pertanyaan
                </span>
                <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                  Preview Soal
                </span>
              </div>

              <div className="space-y-5">
                {/* Format 1: Likert Scale */}
                <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/70 border border-slate-200/90 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-rose-800 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                      Format 1: Skala Rating (1 - 5)
                    </span>
                    <span className="text-xs font-bold text-slate-500">Instrumen DISC & Big Five</span>
                  </div>
                  <p className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                    &ldquo;Ketika proyek mengalami hambatan kritis, saya langsung mengambil alih komando dan membuat keputusan tegas tanpa ragu.&rdquo;
                  </p>
                  <div className="grid grid-cols-5 gap-2 pt-1 text-center">
                    {[
                      { v: 1, l: "Sangat Tidak Setuju" },
                      { v: 2, l: "Tidak Setuju" },
                      { v: 3, l: "Netral" },
                      { v: 4, l: "Setuju" },
                      { v: 5, l: "Sangat Setuju" },
                    ].map((item) => (
                      <div key={item.v} className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-800 shadow-xs hover:border-indigo-300 transition-colors">
                        <div className="text-lg font-black text-indigo-600">{item.v}</div>
                        <div className="text-xs font-extrabold text-slate-700 truncate mt-0.5">{item.l}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Format 2: Forced Choice */}
                <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/70 border border-slate-200/90 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      Format 2: Pilihan Dilema (A vs B)
                    </span>
                    <span className="text-xs font-bold text-slate-500">Instrumen PAPI & MBTI</span>
                  </div>
                  <p className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                    Pilih satu pernyataan di bawah yang paling menggambarkan gaya alami Anda:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-4 rounded-2xl bg-white border border-indigo-300 flex items-start gap-3 text-sm font-bold text-slate-900 shadow-xs">
                      <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">A</span>
                      <span className="leading-snug">Saya lebih terdorong oleh target kerja ambisius dan kepemimpinan.</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-start gap-3 text-sm font-bold text-slate-700 shadow-xs">
                      <span className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-black shrink-0 mt-0.5 border border-slate-200">B</span>
                      <span className="leading-snug">Saya lebih terdorong oleh keharmonisan relasi dan stabilitas tim.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: 3 STRATEGIC TIPS */}
            <div className="card-3d rounded-3xl p-8 bg-gradient-to-br from-indigo-50/90 via-blue-50/60 to-purple-50/40 border border-indigo-200/90 shadow-2xl space-y-4 text-left">
              <div className="flex items-center gap-2.5 text-sm sm:text-base font-black text-slate-900 border-b border-indigo-100 pb-3">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <span>3 Panduan Strategis untuk Hasil Profil yang Akurat:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-white/95 rounded-2xl border border-indigo-100 space-y-1.5 shadow-xs">
                  <div className="flex items-center gap-2 text-sm font-black text-indigo-900">
                    <Zap className="w-4 h-4 text-indigo-600" />
                    <span>Spontan & Cepat</span>
                  </div>
                  <p className="text-xs font-bold text-slate-600 leading-relaxed">
                    Hindari overthinking. Durasi ideal tiap soal adalah 8–12 detik. Naluri awal Anda paling otentik.
                  </p>
                </div>

                <div className="p-4 bg-white/95 rounded-2xl border border-indigo-100 space-y-1.5 shadow-xs">
                  <div className="flex items-center gap-2 text-sm font-black text-emerald-900">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Konsistensi Silang</span>
                  </div>
                  <p className="text-xs font-bold text-slate-600 leading-relaxed">
                    Sistem mendeteksi kontradiksi antar-jawaban. Menjawab jujur menghasilkan skor validasi tertinggi.
                  </p>
                </div>

                <div className="p-4 bg-white/95 rounded-2xl border border-indigo-100 space-y-1.5 shadow-xs">
                  <div className="flex items-center gap-2 text-sm font-black text-purple-900">
                    <Target className="w-4 h-4 text-purple-600" />
                    <span>Konteks Kerja Nyata</span>
                  </div>
                  <p className="text-xs font-bold text-slate-600 leading-relaxed">
                    Bayangkan perilaku Anda saat berada di kantor saat menyelesaikan proyek dan koordinasi tim.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: FOCUSED SINGLE-QUESTION STEPPER + 50-ITEM PALETTE GRID (LANDSCAPE)
  // =========================================================================
  const currentQ = shuffledQuestions[currentIdx] || ALL_50_PSYCHOMETRIC_QUESTIONS[0];
  const isLastQuestion = currentIdx === totalQuestions - 1;
  const currentAnswer = answers[currentQ.id];

  const isCriticalTimer = timeRemaining <= 180; // under 3 mins
  const isEmergencyTimer = timeRemaining <= 60; // under 1 min

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      
      {/* ========================================================= */}
      {/* TOP COMMAND BAR: TITLE, LARGE TIMER & EXIT BUTTON         */}
      {/* ========================================================= */}
      <div className="card-3d rounded-3xl p-5 sm:p-6 bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Left: Position & Candidate Info */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-indigo-600">
              Asesmen Karakter Kerja &bull; 50 Soal Baku
            </div>
            <div className="text-base font-black text-slate-900 leading-snug">
              {app.job?.title}
            </div>
          </div>
        </div>

        {/* Center: LARGE PROMINENT TIMER */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-2xl border transition-all ${
              isEmergencyTimer
                ? "bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-500/30 animate-bounce"
                : isCriticalTimer
                ? "bg-amber-50 text-amber-900 border-amber-300 shadow-md animate-pulse"
                : "bg-slate-900 text-white border-slate-800 shadow-md"
            }`}
          >
            <Timer className={`w-6 h-6 ${isEmergencyTimer ? "text-white" : isCriticalTimer ? "text-amber-600" : "text-indigo-400"}`} />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
                Sisa Waktu
              </span>
              <span className="text-2xl font-black tracking-wider font-mono leading-none">
                {formatTimer(timeRemaining)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Exit / Cancel Assessment Button */}
        <button
          type="button"
          onClick={() => setShowExitModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shadow-2xs cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-rose-600" />
          <span>Keluar / Batalkan Tes</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* MASTER 2-COLUMN QUESTIONNAIRE GRID (8/12 + 4/12)          */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ========================================================= */}
        {/* LEFT: FOCUSED SINGLE QUESTION CARD (8/12)                 */}
        {/* ========================================================= */}
        <div className="lg:col-span-8 space-y-6">
          <div className="card-3d rounded-3xl p-8 sm:p-10 bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl space-y-8 min-h-[480px] flex flex-col justify-between relative overflow-hidden">
            
            <div className="space-y-6">
              {/* Question Header & Badge */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
                    {currentIdx + 1}
                  </span>
                  <span className="text-sm font-black text-slate-800 uppercase tracking-wide">
                    Pertanyaan {currentIdx + 1} <span className="text-slate-400 font-bold">/ 50</span>
                  </span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold">
                  <span>Instrumen: </span>
                  <strong className="text-indigo-700 uppercase">
                    {currentQ.type === "likert" ? "DISC / Big 5" : "PAPI / MBTI"}
                  </strong>
                </div>
              </div>

              {/* Big Bold Question Text */}
              <div className="py-2">
                <p className="text-xl sm:text-2xl font-black text-slate-900 leading-relaxed tracking-tight">
                  {currentQ.text}
                </p>
              </div>

              {/* ===================================================== */}
              {/* FORMAT 1: LIKERT RATING (1 to 5)                      */}
              {/* ===================================================== */}
              {currentQ.type === "likert" && (
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
                  {LIKERT_OPTIONS.map((opt) => {
                    const isSelected = currentAnswer === opt.value;

                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelectOption(currentQ.id, opt.value)}
                        className={`p-4 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/25 scale-[1.04]"
                            : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 shadow-2xs"
                        }`}
                      >
                        <div className={`text-2xl font-black ${isSelected ? "text-white" : "text-indigo-600"}`}>
                          {opt.value}
                        </div>
                        <div className={`text-xs font-extrabold ${isSelected ? "text-indigo-100" : "text-slate-600"} leading-snug`}>
                          {opt.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ===================================================== */}
              {/* FORMAT 2: FORCED CHOICE / MBTI (A vs B)               */}
              {/* ===================================================== */}
              {(currentQ.type === "forced_choice" || currentQ.type === "mbti_dichotomy") && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Option A */}
                  <button
                    type="button"
                    onClick={() => handleSelectOption(currentQ.id, "A")}
                    className={`p-6 rounded-2xl border-2 text-left transition-all flex items-start gap-4 cursor-pointer ${
                      currentAnswer === "A"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/25 scale-[1.02]"
                        : "bg-white text-slate-800 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 shadow-2xs"
                    }`}
                  >
                    <span
                      className={`w-9 h-9 rounded-xl text-sm font-black flex items-center justify-center shrink-0 ${
                        currentAnswer === "A"
                          ? "bg-white text-indigo-700"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      A
                    </span>
                    <span className="text-sm font-bold leading-relaxed pt-1">
                      {currentQ.optionA?.text || "Pilihan A"}
                    </span>
                  </button>

                  {/* Option B */}
                  <button
                    type="button"
                    onClick={() => handleSelectOption(currentQ.id, "B")}
                    className={`p-6 rounded-2xl border-2 text-left transition-all flex items-start gap-4 cursor-pointer ${
                      currentAnswer === "B"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/25 scale-[1.02]"
                        : "bg-white text-slate-800 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 shadow-2xs"
                    }`}
                  >
                    <span
                      className={`w-9 h-9 rounded-xl text-sm font-black flex items-center justify-center shrink-0 ${
                        currentAnswer === "B"
                          ? "bg-white text-indigo-700"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      B
                    </span>
                    <span className="text-sm font-bold leading-relaxed pt-1">
                      {currentQ.optionB?.text || "Pilihan B"}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Stepper Navigation Buttons */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
              <button
                type="button"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((curr) => Math.max(0, curr - 1))}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                  currentIdx === 0
                    ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-2xs"
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>

              <div className="text-xs font-extrabold text-slate-400">
                {currentAnswer !== undefined ? (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Soal Ini Sudah Terjawab
                  </span>
                ) : (
                  <span>Pilih satu jawaban untuk melanjutkan</span>
                )}
              </div>

              {isLastQuestion ? (
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={isSubmitting || answeredCount < totalQuestions}
                  className={`flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-lg ${
                    answeredCount === totalQuestions
                      ? "btn-primary-3d"
                      : "bg-slate-300 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memproses Evaluasi...</span>
                    </>
                  ) : (
                    <>
                      <BrainCircuit className="w-4 h-4" />
                      <span>Selesaikan & Kirim</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCurrentIdx((curr) => Math.min(totalQuestions - 1, curr + 1))}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all cursor-pointer"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT: 50-ITEM QUICK-JUMP PALETTE GRID (4/12)             */}
        {/* ========================================================= */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card-3d rounded-3xl p-6 sm:p-7 bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl space-y-5 text-left">
            
            {/* Header & Progress Summary */}
            <div className="space-y-2 border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-slate-900">
                  Navigasi 50 Soal
                </span>
                <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                  {answeredCount} / {totalQuestions} ({progressPercent}%)
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-blue-600 to-emerald-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-600" />
                <span>Terjawab</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-slate-100 border border-slate-300" />
                <span>Kosong</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md ring-2 ring-indigo-600 bg-indigo-100" />
                <span>Aktif</span>
              </div>
            </div>

            {/* 50 NUMBERED TILES PALETTE */}
            <div className="grid grid-cols-5 sm:grid-cols-5 gap-2 max-h-[340px] overflow-y-auto pr-1">
              {shuffledQuestions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isActive = idx === currentIdx;

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-11 rounded-xl text-xs font-black transition-all flex items-center justify-center relative cursor-pointer ${
                      isActive
                        ? "ring-2 ring-indigo-600 ring-offset-2 bg-indigo-600 text-white shadow-md scale-105"
                        : isAnswered
                        ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs"
                        : "bg-slate-100 text-slate-700 border border-slate-200 hover:border-indigo-400 hover:bg-slate-200"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Submit Button in Palette Sidebar */}
            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={isSubmitting || answeredCount < totalQuestions}
                className={`w-full py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all ${
                  answeredCount === totalQuestions
                    ? "btn-primary-3d shadow-lg"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Kirimkan 50 Jawaban</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* EXIT / CANCEL ASSESSMENT CONFIRMATION MODAL               */}
      {/* ========================================================= */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="card-3d rounded-3xl p-8 bg-white border border-slate-200 shadow-2xl max-w-md w-full text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-md">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Batalkan Sesi Asesmen?
              </h2>
              <p className="text-xs font-medium text-slate-600 leading-relaxed">
                Jika Anda keluar sekarang:
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-left text-xs font-bold text-rose-900 space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-rose-600">•</span>
                <span>Seluruh jawaban yang telah diisi akan dibatalkan otomatis.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-rose-600">•</span>
                <span>Urutan 50 soal akan diacak ulang total untuk mencegah hafalan pola.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-rose-600">•</span>
                <span>Aktivitas pembatalan dicatat oleh sistem pengawasan tes.</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="py-3 px-4 rounded-xl text-xs font-extrabold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                Lanjutkan Mengerjakan
              </button>

              <button
                type="button"
                onClick={handleConfirmExit}
                className="py-3 px-4 rounded-xl text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-md shadow-rose-500/25"
              >
                Ya, Batalkan & Acak Soal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
