"use client";

import React from "react";
import Link from "next/link";
import { ApplicationStatus } from "@/types/database";
import { formatDate } from "@/lib/utils";
import {
  Sparkles,
  BrainCircuit,
  UserCheck,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Zap,
} from "lucide-react";

export interface TimelineData {
  applicationId?: string;
  createdAt?: string | null;
  status?: ApplicationStatus | string;
  score?: number | null;
  minScoreThreshold?: number | null;
  personalityCompletedAt?: string | null;
  interviewCompletedAt?: string | null;
  interviewStartedAt?: string | null;
  jobTitle?: string;
  jobSlug?: string;
}

interface ApplicationTimelineProps {
  data: TimelineData;
  className?: string;
  showHeader?: boolean;
}

type StepState = "completed" | "current" | "upcoming" | "rejected" | "skipped";

interface StepItem {
  id: string;
  stepNumber: number;
  title: string;
  statusLabel: string;
  badgeVariant: "emerald" | "blue" | "amber" | "rose" | "slate";
  state: StepState;
  date?: string | null;
  description: string;
  cta?: {
    label: string;
    href: string;
    icon?: React.ReactNode;
  };
}

export function ApplicationTimeline({
  data,
  className = "",
  showHeader = true,
}: ApplicationTimelineProps) {
  const score = data.score ?? null;
  const threshold = data.minScoreThreshold ?? 70;
  const isRejected = data.status === "rejected";
  const isCvPassed = isRejected ? false : score !== null ? score >= threshold : false;
  const hasPersonality = !!data.personalityCompletedAt;
  const hasInterview =
    !!data.interviewCompletedAt || data.status === "interview_completed";
  const isInvitedInterview =
    data.status === "invited_interview" || data.status === "interview_in_progress";
  const isExpired = data.status === "withdrawn_expired";

  // Build 4 recruitment steps dynamically
  const steps: StepItem[] = [];

  // ==========================================
  // TAHAP 1: Evaluasi Kualifikasi Berbasis AI (AI CV Screening)
  // ==========================================
  if (score !== null) {
    if (isCvPassed) {
      steps.push({
        id: "screening",
        stepNumber: 1,
        title: "Evaluasi Kualifikasi Berbasis AI (AI CV Screening)",
        statusLabel: `Memenuhi Standar Kualifikasi (${score}/100)`,
        badgeVariant: "emerald",
        state: "completed",
        date: data.createdAt ? formatDate(data.createdAt) : null,
        description: `Analisis komparatif berbasis AI menyimpulkan bahwa keahlian teknis, rekam jejak, dan kualifikasi profil Anda selaras dengan standar posisi ini (Ambang batas minimum: ${threshold} poin). Anda berhak melanjutkan ke tahapan seleksi berikutnya.`,
      });
    } else {
      steps.push({
        id: "screening",
        stepNumber: 1,
        title: "Evaluasi Kualifikasi Berbasis AI (AI CV Screening)",
        statusLabel: `Belum Memenuhi Ambang Batas (${score}/100)`,
        badgeVariant: "rose",
        state: "rejected",
        date: data.createdAt ? formatDate(data.createdAt) : null,
        description: `Berdasarkan evaluasi komparatif dokumen terhadap kriteria posisi, profil Anda saat ini belum mencapai ambang batas minimum yang dipersyaratkan (${threshold} poin). Rekam jejak Anda telah kami simpan di talent pool perusahaan untuk peluang masa depan yang lebih sesuai.`,
      });
    }
  } else {
    steps.push({
      id: "screening",
      stepNumber: 1,
      title: "Evaluasi Kualifikasi Berbasis AI (AI CV Screening)",
      statusLabel: "Dalam Antrean Evaluasi",
      badgeVariant: "blue",
      state: "current",
      description:
        "Dokumen CV dan portofolio Anda sedang dalam antrean evaluasi kualifikasi sistem analitis cerdas.",
    });
  }

  // ==========================================
  // TAHAP 2: Asesmen Psikometri & Profil Kepribadian Kerja
  // ==========================================
  if (!isCvPassed) {
    steps.push({
      id: "psychometric",
      stepNumber: 2,
      title: "Asesmen Psikometri & Profil Kepribadian Kerja",
      statusLabel: "Tahap Tidak Terbuka",
      badgeVariant: "slate",
      state: "skipped",
      description:
        "Tahap asesmen psikometri diperuntukkan bagi kandidat yang telah memenuhi standar kualifikasi seleksi berkas.",
    });
  } else if (hasPersonality) {
    steps.push({
      id: "psychometric",
      stepNumber: 2,
      title: "Asesmen Psikometri & Profil Kepribadian Kerja",
      statusLabel: "Selesai Dievaluasi & Profil Terpetakan",
      badgeVariant: "emerald",
      state: "completed",
      date: data.personalityCompletedAt ? formatDate(data.personalityCompletedAt) : null,
      description:
        "Asesmen psikometri kepribadian komprehensif (DISC, Big Five & Workplace Drives) telah selesai dikerjakan. Pemetaan kepribadian dan karakter adaptasi profesional Anda telah terintegrasi ke dalam berkas pertimbangan rekruter.",
      cta: data.applicationId
        ? {
            label: "Buka Profil Psikometri",
            href: `/applications/${data.applicationId}/personality-test`,
            icon: <BrainCircuit className="w-3.5 h-3.5" />,
          }
        : undefined,
    });
  } else {
    steps.push({
      id: "psychometric",
      stepNumber: 2,
      title: "Asesmen Psikometri & Profil Kepribadian Kerja",
      statusLabel: "Tindakan Diperlukan: Siap Dikerjakan",
      badgeVariant: "blue",
      state: "current",
      description:
        "Akses pengerjaan asesmen psikometri telah dibuka. Silakan luangkan waktu sekitar 10–15 menit untuk menyelesaikan instrumen asesmen karakter kerja guna melanjutkan proses seleksi.",
      cta: data.applicationId
        ? {
            label: "🎯 Kerjakan Tes Psikometri",
            href: `/applications/${data.applicationId}/personality-test`,
            icon: <Zap className="w-3.5 h-3.5" />,
          }
        : undefined,
    });
  }

  // ==========================================
  // TAHAP 3: Wawancara Kompetensi AI Adaptif
  // ==========================================
  if (!isCvPassed) {
    steps.push({
      id: "interview",
      stepNumber: 3,
      title: "Wawancara Kompetensi AI Adaptif",
      statusLabel: "Tahap Tidak Terbuka",
      badgeVariant: "slate",
      state: "skipped",
      description:
        "Tahap wawancara AI hanya dibuka untuk kandidat yang dinyatakan memenuhi kualifikasi seleksi awal.",
    });
  } else if (hasInterview) {
    steps.push({
      id: "interview",
      stepNumber: 3,
      title: "Wawancara Kompetensi AI Adaptif",
      statusLabel: "Sesi Wawancara Rampung",
      badgeVariant: "emerald",
      state: "completed",
      date: data.interviewCompletedAt ? formatDate(data.interviewCompletedAt) : null,
      description:
        "Sesi wawancara AI mendalam telah sukses diselesaikan. Rekaman transkrip percakapan, pembuktian keahlian teknis, dan analisis ketegasan respon telah disintesis untuk bahan penilaian dewan penilai.",
      cta: data.applicationId
        ? {
            label: "Lihat Status Wawancara",
            href: `/applications/${data.applicationId}/interview`,
            icon: <CheckCircle2 className="w-3.5 h-3.5" />,
          }
        : undefined,
    });
  } else if (isInvitedInterview) {
    steps.push({
      id: "interview",
      stepNumber: 3,
      title: "Wawancara Kompetensi AI Adaptif",
      statusLabel: "Undangan Wawancara Tersedia",
      badgeVariant: "blue",
      state: "current",
      description:
        "Undangan wawancara AI interaktif telah diterbitkan. Anda dapat mengakses ruang wawancara mandiri ini secara interaktif sebelum batas waktu pengerjaan berakhir.",
      cta: data.applicationId
        ? {
            label: "🎯 Mulai Sesi Wawancara AI",
            href: `/applications/${data.applicationId}/interview`,
            icon: <Sparkles className="w-3.5 h-3.5" />,
          }
        : undefined,
    });
  } else if (isExpired) {
    steps.push({
      id: "interview",
      stepNumber: 3,
      title: "Wawancara Kompetensi AI Adaptif",
      statusLabel: "Batas Waktu Berakhir",
      badgeVariant: "rose",
      state: "rejected",
      description:
        "Batas waktu pelaksanaan sesi wawancara AI telah terlampaui. Proses seleksi untuk periode ini telah ditutup.",
    });
  } else {
    steps.push({
      id: "interview",
      stepNumber: 3,
      title: "Wawancara Kompetensi AI Adaptif",
      statusLabel: hasPersonality ? "Menunggu Undangan Wawancara" : "Menunggu Tahap Psikometri",
      badgeVariant: "slate",
      state: "upcoming",
      description: hasPersonality
        ? "Hasil asesmen psikometri Anda sedang diverifikasi. Undangan wawancara AI terstruktur akan segera diterbitkan jika seluruh kriteria terpenuhi."
        : "Jadwal dan akses wawancara akan diagendakan otomatis setelah Anda menuntaskan asesmen kepribadian awal.",
    });
  }

  // ==========================================
  // TAHAP 4: Peninjauan Akhir Manajemen & Penawaran (Final Interview & Offering)
  // ==========================================
  if (!isCvPassed || isRejected) {
    steps.push({
      id: "final_review",
      stepNumber: 4,
      title: "Peninjauan Akhir Manajemen & Penawaran (Final Interview & Offering)",
      statusLabel: "Proses Seleksi Berakhir",
      badgeVariant: "slate",
      state: "skipped",
      description:
        "Proses seleksi untuk posisi ini telah selesai. Terima kasih atas partisipasi dan ketertarikan Anda untuk berkarier bersama kami.",
    });
  } else if (hasInterview) {
    steps.push({
      id: "final_review",
      stepNumber: 4,
      title: "Peninjauan Akhir Manajemen & Penawaran (Final Interview & Offering)",
      statusLabel: "Dalam Peninjauan Menyeluruh (Hiring Manager)",
      badgeVariant: "amber",
      state: "current",
      description:
        "Seluruh portofolio kualifikasi, skor kecocokan AI, hasil psikometri, dan rekaman wawancara sedang dalam peninjauan akhir oleh hiring manager dan dewan direksi untuk penentuan keputusan akhir dan penerbitan offering.",
    });
  } else {
    steps.push({
      id: "final_review",
      stepNumber: 4,
      title: "Peninjauan Akhir Manajemen & Penawaran (Final Interview & Offering)",
      statusLabel: "Tahap Akhir Seleksi",
      badgeVariant: "slate",
      state: "upcoming",
      description:
        "Peninjauan menyeluruh oleh hiring manager dan penerbitan surat penawaran kerja resmi (job offer letter) bagi kandidat terpilih.",
    });
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Timeline & Status Seleksi Lamaran
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pantau kemajuan berkas Anda secara transparan pada setiap tahapan rekrutmen profesional
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-auto">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Sistem Otomatis Terhubung</span>
          </div>
        </div>
      )}

      {/* Vertical Stepper / Timeline */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3.5 sm:before:left-4.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {steps.map((step, idx) => {
          // Badges styling map
          const badgeStyles = {
            emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
            blue: "bg-blue-50 text-blue-700 border-blue-200",
            amber: "bg-amber-50 text-amber-800 border-amber-200",
            rose: "bg-rose-50 text-rose-700 border-rose-200",
            slate: "bg-slate-100 text-slate-600 border-slate-200",
          }[step.badgeVariant];

          // Icon indicator rendering
          let iconNode: React.ReactNode;
          let ringClass = "";

          if (step.state === "completed") {
            ringClass = "bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-sm";
            iconNode = <CheckCircle2 className="w-4 h-4" />;
          } else if (step.state === "current") {
            ringClass =
              "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white ring-4 ring-blue-100 shadow-md animate-pulse";
            iconNode = <Clock className="w-4 h-4" />;
          } else if (step.state === "rejected") {
            ringClass = "bg-rose-600 text-white ring-4 ring-rose-100 shadow-sm";
            iconNode = <XCircle className="w-4 h-4" />;
          } else {
            ringClass = "bg-white text-slate-400 border border-slate-300 ring-2 ring-slate-100";
            iconNode = <span className="text-xs font-bold">{step.stepNumber}</span>;
          }

          return (
            <div key={step.id} className="relative group">
              {/* Step circle node */}
              <div
                className={`absolute -left-6 sm:-left-8 top-0.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all ${ringClass}`}
              >
                {iconNode}
              </div>

              {/* Step Card Content */}
              <div
                className={`rounded-2xl p-4 sm:p-5 border transition-all text-left ${
                  step.state === "current"
                    ? "bg-white border-blue-200 shadow-md ring-1 ring-blue-50"
                    : step.state === "completed"
                    ? "bg-slate-50/60 border-slate-200/90 shadow-2xs"
                    : step.state === "rejected"
                    ? "bg-rose-50/30 border-rose-200/70"
                    : "bg-slate-50/30 border-slate-200/60 opacity-75"
                }`}
              >
                {/* Header row: Title, Badge, Date */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        Tahap {step.stepNumber}
                      </span>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900">
                        {step.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap pt-0.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeStyles}`}
                      >
                        {step.state === "completed" && <CheckCircle2 className="w-3 h-3" />}
                        {step.state === "current" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping mr-0.5" />
                        )}
                        {step.state === "rejected" && <AlertCircle className="w-3 h-3" />}
                        {step.statusLabel}
                      </span>

                      {step.date && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{step.date}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contextual CTA button if available */}
                  {step.cta && (
                    <div className="pt-2 sm:pt-0 shrink-0">
                      <Link
                        href={step.cta.href}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm transition-all hover:scale-[1.02]"
                      >
                        {step.cta.icon}
                        <span>{step.cta.label}</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>

                {/* Professional Context Description */}
                <p className="text-xs text-slate-600 leading-relaxed mt-3 bg-white/80 p-3 rounded-xl border border-slate-200/70 shadow-3xs">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
