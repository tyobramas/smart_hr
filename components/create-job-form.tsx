"use client";

import React, { useState } from "react";
import Link from "next/link";
import { createJobAction } from "@/app/actions/jobs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "sonner";
import {
  Briefcase,
  MapPin,
  FileText,
  Award,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export function CreateJobForm() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [isCustomSlug, setIsCustomSlug] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setTitle(val);
    if (!isCustomSlug) {
      setSlug(slugify(val));
    }
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setIsCustomSlug(true);
    setSlug(slugify(e.target.value));
  }

  async function handleSubmit(formData: FormData) {
    setErrorMessage(null);
    const result = await createJobAction(formData);
    if (result?.error) {
      setErrorMessage(result.error);
      toast.error(result.error);
    } else {
      toast.success("Lowongan pekerjaan berhasil dipublikasikan!");
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href="/admin/jobs"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Daftar Lowongan
        </Link>
      </div>

      <div className="card-3d rounded-2xl p-8 bg-white border border-slate-200 shadow-soft-3d space-y-6">
        {/* Header */}
        <div className="pb-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wide">
              <Sparkles className="w-4 h-4" />
              <span>Formulir Lowongan Baru</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Buat Lowongan Pekerjaan
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Isi deskripsi & persyaratan kualifikasi untuk penilaian CV otomatis
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs font-medium text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form action={handleSubmit} className="space-y-6">
          {/* Job Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Judul Posisi Pekerjaan <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Input
                type="text"
                name="title"
                value={title}
                onChange={handleTitleChange}
                required
                placeholder="Contoh: Senior Full-Stack Engineer"
                className="pl-9"
              />
              <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Slug URL */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                URL Slug <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Otomatis dibuat dari judul
              </span>
            </div>
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-0">
              <span className="text-xs text-slate-400 font-mono select-none">
                /jobs/
              </span>
              <input
                type="text"
                name="slug"
                value={slug}
                onChange={handleSlugChange}
                required
                placeholder="senior-fullstack-engineer"
                className="flex-1 bg-transparent py-2 px-1 text-xs font-mono text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          {/* 2-Column Grid: Location & Employment Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Lokasi Kerja <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type="text"
                  name="location"
                  required
                  placeholder="Jakarta / Hybrid / Remote"
                  className="pl-9"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tipe Pekerjaan <span className="text-rose-500">*</span>
              </label>
              <select
                name="employment_type"
                required
                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                defaultValue="Full-time"
              >
                <option value="Full-time">Full-time</option>
                <option value="Contract">Contract</option>
                <option value="Part-time">Part-time</option>
                <option value="Remote">Remote</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
          </div>

          {/* Min CV Score Threshold */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Passing Score CV (0 - 100)
            </label>
            <div className="relative">
              <Input
                type="number"
                name="min_score_threshold"
                min="0"
                max="100"
                defaultValue="70"
                required
                className="pl-9"
              />
              <Award className="w-4 h-4 text-amber-500 absolute left-3 top-3" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Skor minimal kelulusan otomatis (standar minimum sistem adalah 71). Nilai di atas 71 akan menaikkan standar kelulusan lowongan ini.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Deskripsi Pekerjaan & Tanggung Jawab <span className="text-rose-500">*</span>
            </label>
            <Textarea
              name="description"
              rows={4}
              required
              placeholder="Jelaskan peran posisi ini, tanggung jawab utama tim, dan overview perusahaan..."
            />
          </div>

          {/* Requirements (for RAG / AI Scoring) */}
          <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-indigo-900">
                Kualifikasi & Persyaratan Teknis (RAG / AI Screening Context) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] font-semibold text-indigo-600 bg-white px-2 py-0.5 rounded border border-indigo-200">
                AI Knowledge Context
              </span>
            </div>
            <p className="text-[11px] text-indigo-700">
              Sebutkan keahlian, teknologi (Next.js, Postgres, Docker), pengalaman kerja, dan kriteria wajib. Bagian ini dipakai untuk pencocokan semantik CV kandidat.
            </p>
            <Textarea
              name="requirements"
              rows={5}
              required
              className="bg-white border-indigo-200"
              placeholder="- Pengalaman minimal 3 tahun dengan Next.js / React & TypeScript&#10;- Menguasai PostgreSQL, relational data modeling, dan Row Level Security&#10;- Familiar dengan Docker dan deployment pipeline&#10;- Komunikasi yang baik dan kemampuan problem solving mandiri"
            />
          </div>

          {/* Is Active Toggle */}
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              defaultChecked
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            <label htmlFor="is_active" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Aktifkan Lowongan Langsung (Tampilkan di Portal Kandidat)
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <SubmitButton
              loadingText="Mempublikasikan Lowongan..."
              className="w-full h-11 text-sm font-semibold"
            >
              Publikasikan Lowongan Pekerjaan
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}
