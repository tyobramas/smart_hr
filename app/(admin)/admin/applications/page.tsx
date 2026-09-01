import React from "react";
import { createClient } from "@/lib/supabase/server";
import { Application, Job, Profile } from "@/types/database";
import { AdminApplicationRow } from "@/components/admin-application-row";
import { Users } from "lucide-react";

export default async function AdminApplicationsPage() {
  const supabase = await createClient();

  const { data: applications, error } = await supabase
    .from("applications")
    .select(`
      *,
      job:jobs (*),
      candidate:profiles (*)
    `)
    .order("created_at", { ascending: false });

  const appList =
    (applications as (Application & { job: Job; candidate: Profile })[]) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Kelola Pelamar Masuk
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar seluruh lamaran kandidat, skor AI CV, status pengerjaan Tes Kepribadian, dan interview
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
          Total Pelamar: <span className="text-blue-600 font-bold">{appList.length}</span>
        </div>
      </div>

      {/* Applications Table */}
      {appList.length === 0 ? (
        <div className="card-3d rounded-2xl p-12 text-center bg-white">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400 shadow-xs mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Belum Ada Pelamar</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Belum ada kandidat yang mengajukan lamaran ke lowongan kerja Anda.
          </p>
        </div>
      ) : (
        <div className="card-3d rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-soft-3d">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-5">Kandidat</th>
                  <th className="py-3 px-4">Posisi Lowongan</th>
                  <th className="py-3 px-4">Tanggal Melamar</th>
                  <th className="py-3 px-4">Scoring CV</th>
                  <th className="py-3 px-4">Tes Kepribadian</th>
                  <th className="py-3 px-4">Interview AI</th>
                  <th className="py-3 px-5 text-right">Status & Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appList.map((app) => (
                  <AdminApplicationRow key={app.id} app={app} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
