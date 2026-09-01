"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Application, Job } from "@/types/database";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";
import {
  Calendar,
  Award,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  AlertTriangle,
  HelpCircle,
  BrainCircuit,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface CandidateApplicationRowProps {
  app: Application & { job: Job };
}

export function CandidateApplicationRow({ app }: CandidateApplicationRowProps) {
  const [showDetails, setShowDetails] = useState(false);
  const evaluation = (app.cv_analysis_json as any)?.evaluation || null;
  const personality = (app.personality_result_json as any) || null;
  const isPersonalityCompleted = !!app.personality_completed_at || !!personality;

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

  const isPassed =
    app.cv_score !== null &&
    Number(app.cv_score) >= Number(app.job?.min_score_threshold || 0);

  return (
    <>
      <tr className="hover:bg-slate-50/70 transition-colors">
        {/* Job Title */}
        <td className="py-4 px-5">
          <div className="font-bold text-slate-900 text-sm">
            {app.job?.title || "Lowongan Dihapus"}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            ID: {app.id.slice(0, 8)}...
          </div>
        </td>

        {/* Location & Type */}
        <td className="py-4 px-4">
          <div className="text-slate-700 font-medium">{app.job?.location || "-"}</div>
          <div className="text-[11px] text-slate-400 capitalize">
            {app.job?.employment_type || "-"}
          </div>
        </td>

        {/* Date */}
        <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatDate(app.created_at)}</span>
          </div>
        </td>

        {/* Status Badge & Interview Status */}
        <td className="py-4 px-4">
          <div className="space-y-1">
            <StatusBadge status={app.status} />

            {app.status === "invited_interview" && (
              <div className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 animate-pulse">
                <Clock className="w-3 h-3 text-blue-600" />
                <span>Wawancara AI Tersedia</span>
              </div>
            )}

            {app.status === "interview_in_progress" && (
              <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <Clock className="w-3 h-3 text-amber-600" />
                <span>Sedang Berlangsung</span>
              </div>
            )}

            {app.status === "interview_completed" && (
              <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Wawancara Selesai</span>
              </div>
            )}

            {app.status === "withdrawn_expired" && (
              <div className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                <span>Waktu Berakhir</span>
              </div>
            )}

            {isPersonalityCompleted && app.status !== "interview_completed" && (
              <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Psikotes Selesai</span>
              </div>
            )}
          </div>
        </td>

        {/* Score & Expand Button */}
        <td className="py-4 px-4 text-center">
          <div className="flex items-center justify-center gap-2">
            {app.cv_score !== null ? (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                  isPassed
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                {app.cv_score} / 100
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                <Sparkles className="w-3 h-3 text-slate-400" />
                Menunggu Review
              </span>
            )}

            {evaluation && (
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                title="Lihat Detail Analisis AI"
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md border border-slate-200 transition-colors"
              >
                {showDetails ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        </td>

        {/* Actions & Next Step CTA */}
        <td className="py-4 px-5 text-right whitespace-nowrap">
          <div className="flex items-center justify-end gap-2">
            {/* 1. INTERVIEW CTA ONLY IF CANDIDATE PASSED CV SCREENING & INVITED */}
            {isPassed && (app.status === "invited_interview" || app.status === "interview_in_progress") && (
              <Link
                href={`/applications/${app.id}/interview`}
                className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm transition-all animate-pulse"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{app.status === "interview_in_progress" ? "Lanjutkan Interview" : "🎯 Mulai Wawancara AI"}</span>
              </Link>
            )}

            {/* 2. VIEW INTERVIEW STATUS IF COMPLETED */}
            {isPassed && app.status === "interview_completed" && (
              <Link
                href={`/applications/${app.id}/interview`}
                className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Status Wawancara</span>
              </Link>
            )}

            {/* 3. PERSONALITY TEST CTA IF PASSED */}
            {isPassed && app.status !== "invited_interview" && app.status !== "interview_in_progress" && app.status !== "interview_completed" && (
              <Link
                href={`/applications/${app.id}/personality-test`}
                className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                  isPersonalityCompleted
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent hover:opacity-95 shadow-sm animate-pulse"
                }`}
              >
                <BrainCircuit className="w-3.5 h-3.5" />
                <span>{isPersonalityCompleted ? "Lihat Profil Psikometri" : "🎯 Kerjakan Psikotes"}</span>
              </Link>
            )}

            {app.job?.slug && (
              <Link
                href={`/jobs/${app.job.slug}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors px-1"
              >
                <span>Detail</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded AI Analysis Breakdown */}
      {showDetails && evaluation && (
        <tr className="bg-slate-50/80 border-b border-slate-200">
          <td colSpan={6} className="p-4 px-6">
            <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Rincian Evaluasi Kompetensi Dokumen</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDetails(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Tutup Rincian
                </button>
              </div>

              {/* Alasan Keputusan */}
              {evaluation.alasan_keputusan && (
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-700">Rangkuman Evaluasi:</div>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {evaluation.alasan_keputusan}
                  </p>
                </div>
              )}

              {/* Kelebihan & Kekurangan Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Kelebihan */}
                {kelebihan.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Kelebihan & Keterampilan yang Cocok:</span>
                    </div>
                    <ul className="space-y-1 bg-emerald-50/30 p-3 rounded-xl border border-emerald-100 text-xs text-slate-700">
                      {kelebihan.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Kekurangan */}
                {kekurangan.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-amber-800 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Gap Kualifikasi / Area Tidak Sesuai:</span>
                    </div>
                    <ul className="space-y-1 bg-amber-50/30 p-3 rounded-xl border border-amber-100 text-xs text-slate-700">
                      {kekurangan.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Rekomendasi Interview */}
              {interviewQuestions.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-indigo-800 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Rekomendasi Pertanyaan Interview:</span>
                  </div>
                  <ul className="space-y-1 bg-indigo-50/30 p-3 rounded-xl border border-indigo-100 text-xs text-slate-700">
                    {interviewQuestions.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-indigo-600 font-bold">Q{idx + 1}:</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Personality Result Badge if completed */}
              {personality && (
                <div className="p-3.5 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-900">
                      Profil Psikometri: {personality.mbti_type || "INTJ"} &bull; {personality.primary_trait}
                    </span>
                  </div>
                  <Link
                    href={`/applications/${app.id}/personality-test`}
                    className="text-xs font-semibold text-indigo-700 underline"
                  >
                    Buka Hasil Tes
                  </Link>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
