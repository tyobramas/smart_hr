import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Job } from "@/types/database";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, Award, ArrowRight, Search, Sparkles } from "lucide-react";

export default async function JobsPage() {
  const supabase = await createClient();

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const activeJobs = (jobs as Job[]) || [];

  return (
    <div className="space-y-8">
      {/* Hero Banner Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-8 sm:p-10 text-white shadow-soft-3d border border-slate-800">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs font-semibold text-blue-300">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>AI Automated Matching Enabled</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Temukan Peluang Karir Impian Anda
          </h1>
          <p className="text-sm sm:text-base text-slate-300">
            Daftar posisi terbuka di berbagai divisi. Upload CV Anda dan dapatkan analisis kecocokan kualifikasi secara instan.
          </p>
        </div>
        {/* Background decorative circles */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 top-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Posisi Tersedia</h2>
          <p className="text-xs text-slate-500">
            Menampilkan {activeJobs.length} lowongan pekerjaan aktif
          </p>
        </div>
      </div>

      {/* Job Grid / List */}
      {activeJobs.length === 0 ? (
        <div className="card-3d rounded-2xl p-12 text-center bg-white">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400 shadow-xs mb-4">
            <Briefcase className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Belum Ada Lowongan Aktif</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Saat ini belum ada posisi baru yang dibuka. Silakan kunjungi kembali halaman ini secara berkala.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeJobs.map((job) => (
            <Card
              key={job.id}
              className="flex flex-col justify-between hover:-translate-y-1 transition-all duration-200 group"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <Badge variant="info" className="text-[11px] font-semibold capitalize">
                    {job.employment_type}
                  </Badge>
                </div>
                <CardTitle className="mt-3 text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {job.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4 flex-1">
                {/* Meta chips */}
                <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {job.location}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    Min. Skor: {job.min_score_threshold}
                  </span>
                </div>

                {/* Description snippet */}
                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                  {job.description}
                </p>
              </CardContent>

              <CardFooter className="pt-2 border-t border-slate-100">
                <Link
                  href={`/jobs/${job.slug}`}
                  className="w-full btn-primary-3d flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold"
                >
                  <span>Lihat Detail & Persyaratan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
