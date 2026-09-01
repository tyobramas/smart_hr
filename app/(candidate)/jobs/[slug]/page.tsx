import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Job, Application } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Briefcase,
  Award,
  Calendar,
  ArrowLeft,
  CheckCircle,
  FileCheck2,
  Sparkles,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
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

  // Check if current user is logged in and has applied to this job
  let existingApplication: Application | null = null;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile) {
      const { data: app } = await supabase
        .from("applications")
        .select("*")
        .eq("candidate_id", profile.id)
        .eq("job_id", jobData.id)
        .maybeSingle();

      if (app) {
        existingApplication = app as Application;
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Daftar Lowongan
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Job Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="card-3d rounded-2xl p-6 sm:p-8 bg-white border border-slate-200">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="info" className="text-xs font-semibold uppercase">
                {jobData.employment_type}
              </Badge>
              {jobData.is_active ? (
                <Badge variant="success" className="text-xs">
                  Aktif Menerima Lamaran
                </Badge>
              ) : (
                <Badge variant="danger" className="text-xs">
                  Lowongan Ditutup
                </Badge>
              )}
              {existingApplication && (
                <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50 font-bold">
                  ✓ Sudah Dilamar
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {jobData.title}
            </h1>

            {/* Meta Row */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-600 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{jobData.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Diposting: {formatDate(jobData.created_at)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Min. Score: {jobData.min_score_threshold}</span>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="card-3d rounded-2xl p-6 sm:p-8 bg-white border border-slate-200 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg icon-chip-3d flex items-center justify-center text-blue-600">
                <Briefcase className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Deskripsi Pekerjaan</h2>
            </div>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {jobData.description}
            </div>
          </div>

          {/* Requirements Section */}
          <div className="card-3d rounded-2xl p-6 sm:p-8 bg-white border border-slate-200 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg icon-chip-3d flex items-center justify-center text-indigo-600">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Kualifikasi & Persyaratan</h2>
                <p className="text-[11px] text-slate-400">
                  Parameter penilaian scoring CV berbasis AI
                </p>
              </div>
            </div>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {jobData.requirements}
            </div>
          </div>
        </div>

        {/* Sidebar Summary / CTA */}
        <div className="space-y-6">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900">
                Ringkasan Lowongan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Tipe Pekerjaan</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {jobData.employment_type}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Lokasi</span>
                  <span className="font-semibold text-slate-800">{jobData.location}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Passing Score CV</span>
                  <span className="font-semibold text-slate-800">
                    {jobData.min_score_threshold} / 100
                  </span>
                </div>
              </div>

              {/* AI Notice Card */}
              <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200/80 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Proses Seleksi Otomatis</span>
                </div>
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  CV Anda akan dianalisis secara instan untuk mencocokkan keterampilan dengan kualifikasi posisi ini.
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                {existingApplication ? (
                  <Link
                    href="/applications"
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Sudah Dilamar (Lihat Status)</span>
                  </Link>
                ) : jobData.is_active ? (
                  <Link
                    href={`/jobs/${jobData.slug}/apply`}
                    className="w-full btn-primary-3d flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold"
                  >
                    <span>Lamar Posisi Ini</span>
                  </Link>
                ) : (
                  <button
                    disabled
                    className="w-full bg-slate-200 text-slate-500 py-2.5 rounded-lg text-sm font-semibold cursor-not-allowed"
                  >
                    Pendaftaran Ditutup
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
