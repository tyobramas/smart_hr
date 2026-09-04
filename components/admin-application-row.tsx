"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Application, Job, Profile, ApplicationStatus } from "@/types/database";
import { updateApplicationStatusAction } from "@/app/actions/applications";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import {
  Award,
  Loader2,
  FileText,
  CheckCircle2,
  ExternalLink,
  BrainCircuit,
  Clock,
  Minus,
  Sparkles,
  ArrowUpRight,
  MessageCircle,
} from "lucide-react";

interface AdminApplicationRowProps {
  app: Application & { job: Job; candidate: Profile };
}

export function AdminApplicationRow({ app }: AdminApplicationRowProps) {
  const [status, setStatus] = useState<ApplicationStatus>(app.status);
  const [loading, setLoading] = useState(false);

  const personality = (app.personality_result_json as any) || null;
  const isPersonalityCompleted = !!app.personality_completed_at || !!personality;
  const minScore = Number(app.job?.min_score_threshold || 0);
  const isCvPassed = app.cv_score !== null && Number(app.cv_score) >= minScore;
  const interviewTranscript = (app.interview_transcript_json as any) || null;
  const interviewEval = interviewTranscript?.overall_evaluation || null;

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

  // Generate storage URL for viewing CV PDF
  const storageUrl = app.cv_storage_path.startsWith("http")
    ? app.cv_storage_path
    : `http://127.0.0.1:54321/storage/v1/object/public/${app.cv_storage_path.replace(/^cvs\//, "cvs/")}`;

  const candidateInitials = (app.candidate?.full_name || app.cv_parsed_name || "K")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const dossierUrl = `/admin/applications/${app.id}`;

  return (
    <tr className="hover:bg-slate-50/80 transition-colors group">
      {/* 1. Candidate Name & Avatar */}
      <td className="py-4 px-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
            {candidateInitials}
          </div>
          <div className="space-y-0.5">
            <Link
              href={dossierUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-slate-900 text-sm hover:text-blue-600 transition-colors flex items-center gap-1 group-hover:text-blue-600"
            >
              <span>{app.candidate?.full_name || app.cv_parsed_name || "Kandidat"}</span>
              <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600" />
            </Link>
            <div className="flex items-center gap-2">
              <a
                href={storageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-blue-600 transition-colors"
              >
                <FileText className="w-3 h-3 text-slate-400" />
                <span>Lihat CV</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-70" />
              </a>
              {(app.phone || app.candidate?.phone) && (
                <>
                  <span className="text-slate-300">&bull;</span>
                  <a
                    href={`https://wa.me/${(app.phone || app.candidate?.phone || "").replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                    title="Hubungi via WhatsApp"
                  >
                    <MessageCircle className="w-3 h-3 text-emerald-500" />
                    <span>{app.phone || app.candidate?.phone}</span>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* 2. Job Position */}
      <td className="py-4 px-4">
        <div className="font-bold text-slate-800 text-xs">{app.job?.title || "-"}</div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          Min. Passing: <strong className="text-slate-600">{minScore}</strong>
        </div>
      </td>

      {/* 3. Applied Date */}
      <td className="py-4 px-4 text-slate-500 text-xs whitespace-nowrap">
        {formatDate(app.created_at)}
      </td>

      {/* 4. AI CV Score */}
      <td className="py-4 px-4">
        {app.cv_score !== null ? (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black border ${
              isCvPassed
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>{app.cv_score} / 100</span>
          </span>
        ) : (
          <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
            Pending
          </span>
        )}
      </td>

      {/* 5. Flag Tes Kepribadian */}
      <td className="py-4 px-4">
        {isPersonalityCompleted ? (
          <Link
            href={dossierUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-colors cursor-pointer"
          >
            <BrainCircuit className="w-3.5 h-3.5 text-indigo-600" />
            <span>{personality?.mbti_type || "INTJ"} • Selesai</span>
          </Link>
        ) : isCvPassed ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Belum Tes</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <Minus className="w-3.5 h-3.5" />
            <span>Tidak Lolos CV</span>
          </span>
        )}
      </td>

      {/* 6. Status Interview AI */}
      <td className="py-4 px-4">
        {!isCvPassed ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-lg">
            <Minus className="w-3 h-3" />
            <span>Tidak Memenuhi Syarat</span>
          </span>
        ) : status === "interview_completed" ? (
          <Link
            href={dossierUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              Wawancara Selesai {interviewEval?.skor_kompetensi ? `(${interviewEval.skor_kompetensi} pts)` : ""}
            </span>
          </Link>
        ) : status === "interview_in_progress" ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Sedang Berlangsung</span>
          </span>
        ) : status === "invited_interview" ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200 animate-pulse">
            <span>✉️ Diundang Interview</span>
          </span>
        ) : (
          <span className="text-xs text-slate-400">Belum Diundang</span>
        )}
      </td>

      {/* 7. Status Selector & Full-Page New Tab Trigger */}
      <td className="py-4 px-5 text-right">
        <div className="flex items-center justify-end gap-2">
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
            disabled={loading}
            className="h-8 px-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="pending">Pending</option>
            <option value="screened">Screened</option>
            <option value="invited_interview">Invited</option>
            <option value="interview_in_progress">Wawancara</option>
            <option value="interview_completed">Selesai</option>
            <option value="withdrawn_expired">Expired</option>
            <option value="rejected">Rejected</option>
          </select>
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />}

          <Link
            href={dossierUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Analitik Dossier</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </td>
    </tr>
  );
}
