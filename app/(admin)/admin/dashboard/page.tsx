import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Application, Job, Profile } from "@/types/database";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Briefcase,
  Users,
  CheckCircle2,
  Clock,
  PlusCircle,
  ArrowRight,
  Sparkles,
  Award,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Queries for stats
  const [
    { count: totalJobsCount },
    { count: activeJobsCount },
    { count: totalAppsCount },
    { count: pendingAppsCount },
    { data: recentApps },
  ] = await Promise.all([
    supabase.from("jobs").select("*", { count: "exact", head: true }),
    supabase.from("jobs").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("applications").select("*", { count: "exact", head: true }),
    supabase.from("applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("applications")
      .select(`
        *,
        job:jobs (*),
        candidate:profiles (*)
      `)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const recentApplications =
    (recentApps as (Application & { job: Job; candidate: Profile })[]) || [];

  const metrics = [
    {
      title: "Lowongan Aktif",
      value: activeJobsCount || 0,
      sub: `Dari total ${totalJobsCount || 0} posisi`,
      icon: Briefcase,
      accent: "from-blue-600 to-indigo-600",
      bgLight: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      title: "Total Pelamar Masuk",
      value: totalAppsCount || 0,
      sub: "Akumulasi seluruh kandidat",
      icon: Users,
      accent: "from-indigo-600 to-violet-600",
      bgLight: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    {
      title: "Menunggu Review",
      value: pendingAppsCount || 0,
      sub: "Perlu screening CV",
      icon: Clock,
      accent: "from-amber-500 to-orange-600",
      bgLight: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      title: "Lolos Seleksi / Interview",
      value: (totalAppsCount || 0) - (pendingAppsCount || 0),
      sub: "Sudah diproses",
      icon: CheckCircle2,
      accent: "from-emerald-500 to-teal-600",
      bgLight: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Overview Rekrutmen
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ringkasan metrik lowongan aktif dan aktivitas screening pelamar
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/jobs/new"
            className="btn-primary-3d inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Buat Lowongan Baru</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="p-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{item.title}</span>
                <div
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-xs ${item.bgLight}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {item.value}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">{item.sub}</div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Applications Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Lamaran Masuk Terbaru</h2>
              <p className="text-[11px] text-slate-400">5 pelamar terakhir yang mendaftar</p>
            </div>
          </div>

          <Link
            href="/admin/applications"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
          >
            <span>Lihat Semua Pelamar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentApplications.length === 0 ? (
          <div className="card-3d rounded-xl p-8 text-center bg-white">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-500">Belum ada lamaran yang masuk.</p>
          </div>
        ) : (
          <div className="card-3d rounded-xl bg-white border border-slate-200 overflow-hidden shadow-soft-3d">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-5">Nama Kandidat</th>
                    <th className="py-3 px-4">Posisi Dilamar</th>
                    <th className="py-3 px-4">Tanggal Masuk</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Skor CV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900">
                          {app.candidate?.full_name || app.cv_parsed_name || "Kandidat"}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {app.candidate?.id?.slice(0, 8)}...
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {app.job?.title || "-"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {formatDate(app.created_at)}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {app.cv_score !== null ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Award className="w-3 h-3" />
                            {app.cv_score}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
