import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Job, Profile } from "@/types/database";
import { JobStatusToggle } from "@/components/job-status-toggle";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  PlusCircle,
  MapPin,
  Calendar,
  ExternalLink,
  Award,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function AdminJobsPage() {
  const supabase = await createClient();

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select(`
      *,
      creator:profiles (*)
    `)
    .order("created_at", { ascending: false });

  const jobList = (jobs as (Job & { creator: Profile })[]) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Daftar Lowongan Kerja
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola seluruh posisi lowongan, kualifikasi CV, dan status publikasi
          </p>
        </div>
        <Link
          href="/admin/jobs/new"
          className="btn-primary-3d inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Buat Lowongan Baru</span>
        </Link>
      </div>

      {/* Jobs Table */}
      {jobList.length === 0 ? (
        <div className="card-3d rounded-2xl p-12 text-center bg-white">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400 shadow-xs mb-4">
            <Briefcase className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Belum Ada Lowongan</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Mulai rekrutmen dengan mempublikasikan lowongan kerja pertama Anda.
          </p>
          <div className="mt-6">
            <Link
              href="/admin/jobs/new"
              className="btn-primary-3d inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buat Lowongan Pertama</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="card-3d rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-soft-3d">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Posisi & Slug</th>
                  <th className="py-3 px-4">Lokasi & Tipe</th>
                  <th className="py-3 px-4 text-center">Min. Skor AI</th>
                  <th className="py-3 px-4">Status Publikasi</th>
                  <th className="py-3 px-4">Dibuat Oleh / Tgl</th>
                  <th className="py-3 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobList.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Title & Slug */}
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900 text-sm">{job.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        /{job.slug}
                      </div>
                    </td>

                    {/* Location & Type */}
                    <td className="py-4 px-4">
                      <div className="text-slate-700 font-medium">{job.location}</div>
                      <div className="text-[11px] text-slate-400 capitalize">
                        {job.employment_type}
                      </div>
                    </td>

                    {/* Min Score Threshold */}
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                        {job.min_score_threshold}
                      </span>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-4 px-4">
                      <JobStatusToggle jobId={job.id} isActive={job.is_active} />
                    </td>

                    {/* Created By & Date */}
                    <td className="py-4 px-4 text-slate-600">
                      <div className="font-medium text-slate-800">
                        {job.creator?.full_name || "Admin"}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {formatDate(job.created_at)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      <Link
                        href={`/jobs/${job.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200/60"
                      >
                        <span>Lihat Publik</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
