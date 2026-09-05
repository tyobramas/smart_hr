import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/supabase/auth";
import { Application, Job } from "@/types/database";
import { CandidateApplicationRow } from "@/components/candidate-application-row";
import { FileText, Briefcase, ArrowRight } from "lucide-react";
import { HermesStatusBadge } from "@/components/hermes-status-badge";

export default async function CandidateApplicationsPage() {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const { data: applications, error } = await supabase
    .from("applications")
    .select(`
      *,
      job:jobs (*)
    `)
    .eq("candidate_id", profile.id)
    .order("created_at", { ascending: false });

  const appList = (applications as (Application & { job: Job })[]) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Riwayat Lamaran Saya</h1>
            <HermesStatusBadge variant="user" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pantau status seleksi dan hasil evaluasi CV untuk setiap lowongan yang Anda lamar
          </p>
        </div>
        <Link
          href="/jobs"
          className="btn-primary-3d inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold self-start sm:self-auto"
        >
          <Briefcase className="w-4 h-4" />
          <span>Cari Lowongan Baru</span>
        </Link>
      </div>

      {/* Applications Table / Cards */}
      {appList.length === 0 ? (
        <div className="card-3d rounded-2xl p-12 text-center bg-white">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400 shadow-xs mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Belum Ada Lamaran</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Anda belum mengajukan lamaran untuk posisi apapun. Jelajahi lowongan yang tersedia dan ajukan CV Anda sekarang.
          </p>
          <div className="mt-6">
            <Link
              href="/jobs"
              className="btn-primary-3d inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold"
            >
              <span>Jelajahi Lowongan Kerja</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="card-3d rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-soft-3d">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Posisi Pekerjaan</th>
                  <th className="py-3 px-4">Lokasi & Tipe</th>
                  <th className="py-3 px-4">Tanggal Diajukan</th>
                  <th className="py-3 px-4">Status Seleksi</th>
                  <th className="py-3 px-4 text-center">Skor AI Match</th>
                  <th className="py-3 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appList.map((item) => (
                  <CandidateApplicationRow key={item.id} app={item} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
