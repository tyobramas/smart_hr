import React from "react";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import { CommunicationLogTable, EnrichedCommunicationLog } from "@/components/communication-log-table";
import { Mail, Send, AlertCircle, Clock, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminCommunicationsPage() {
  await requireAdmin();

  const supabase = createAdminClient();

  let enrichedLogs: EnrichedCommunicationLog[] = [];
  let stats = {
    total: 0,
    sent: 0,
    queued: 0,
    failed: 0,
  };

  try {
    const { data: rawLogs, error } = await supabase
      .from("communication_logs")
      .select(`
        *,
        candidate:profiles (full_name),
        job:jobs (title)
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error && rawLogs) {
      enrichedLogs = rawLogs.map((item: any) => ({
        ...item,
        candidate_name: item.candidate?.full_name || item.email_to,
        job_title: item.job?.title || "Lowongan Pekerjaan",
      }));

      stats.total = enrichedLogs.length;
      stats.sent = enrichedLogs.filter((l) => l.status === "sent" || l.status === "opened").length;
      stats.queued = enrichedLogs.filter((l) => l.status === "queued").length;
      stats.failed = enrichedLogs.filter((l) => l.status === "failed" || l.status === "bounced").length;
    }
  } catch (err) {
    console.error("Error fetching communication logs:", err);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Mail className="w-6 h-6 text-indigo-600" />
            Riwayat Komunikasi Rekrutmen
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log seluruh email otomatis yang dikirimkan oleh AI Hermes kepada kandidat sepanjang siklus rekrutmen.
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-3d bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Email</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{stats.total}</div>
          </div>
        </div>

        <div className="card-3d bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Berhasil Dikirim</div>
            <div className="text-xl font-bold text-emerald-700 mt-0.5">{stats.sent}</div>
          </div>
        </div>

        <div className="card-3d bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Dalam Antrean</div>
            <div className="text-xl font-bold text-amber-700 mt-0.5">{stats.queued}</div>
          </div>
        </div>

        <div className="card-3d bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Gagal / Bounced</div>
            <div className="text-xl font-bold text-rose-700 mt-0.5">{stats.failed}</div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <CommunicationLogTable logs={enrichedLogs} />
    </div>
  );
}

